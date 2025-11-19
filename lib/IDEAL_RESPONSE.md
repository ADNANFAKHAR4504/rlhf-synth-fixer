```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade EKS cluster with complete automation via Lambda custom resources'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'
  
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'
  
  PublicSubnet3Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for public subnet 3'
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 1'
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for private subnet 2'
  
  PrivateSubnet3Cidr:
    Type: String
    Default: '10.0.13.0/24'
    Description: 'CIDR block for private subnet 3'
  
  KubernetesVersion:
    Type: String
    Default: '1.28'
    Description: 'Kubernetes version for EKS cluster'
    AllowedValues: ['1.28', '1.29', '1.30']
  
  EnableBastionAccess:
    Type: String
    Description: 'Enable bastion host access to EKS API'
    Default: 'false'
    AllowedValues: ['true', 'false']
  
  EnableEbsEncryption:
    Type: String
    Description: 'Enable EBS encryption with customer-managed KMS key'
    Default: 'true'
    AllowedValues: ['true', 'false']

Mappings:
  InstanceTypeMaxPods:
    t3.medium:
      MaxPods: 17
    t3.large:
      MaxPods: 35
    t3a.large:
      MaxPods: 35
    t2.large:
      MaxPods: 35

Resources:
  # KMS Key for CloudWatch Logs Encryption
  LogsKmsKey:
    Type: AWS::KMS::Key
    Condition: EnableEbsEncryption
    Properties:
      Description: 'KMS key for CloudWatch Logs encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:${AWS::Partition}:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/eks/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster/cluster'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-logs-key'

  LogsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Condition: EnableEbsEncryption
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-logs'
      TargetKeyId: !Ref LogsKmsKey

  # KMS Key for EBS Encryption
  EbsKmsKey:
    Type: AWS::KMS::Key
    Condition: EnableEbsEncryption
    Properties:
      Description: 'KMS key for EBS encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:${AWS::Partition}:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EC2 Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:DescribeKey
              - kms:CreateGrant
              - kms:RetireGrant
            Resource: '*'
          - Sid: Allow Auto Scaling Service
            Effect: Allow
            Principal:
              Service: autoscaling.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:DescribeKey
              - kms:CreateGrant
              - kms:RetireGrant
            Resource: '*'
          - Sid: Allow EKS Node Instance Role
            Effect: Allow
            Principal:
              AWS: !GetAtt EksNodeRole.Arn
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:DescribeKey
              - kms:CreateGrant
              - kms:RetireGrant
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ebs-key'

  EbsKmsKeyAlias:
    Type: AWS::KMS::Alias
    Condition: EnableEbsEncryption
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ebs'
      TargetKeyId: !Ref EbsKmsKey

  # Bastion Host Security Group
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: EnableBastionAccess
    Properties:
      GroupDescription: 'Security group for bastion host access to EKS'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'SSH access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access to EKS API'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-bastion-sg'

  # VPC Resources
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'

  VpcGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  # Secondary CIDR for VPC CNI Custom Networking
  SecondaryCidr1:
    Type: AWS::EC2::VPCCidrBlock
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: '100.64.0.0/19'

  SecondaryCidr2:
    Type: AWS::EC2::VPCCidrBlock
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: '100.64.32.0/19'

  SecondaryCidr3:
    Type: AWS::EC2::VPCCidrBlock
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: '100.64.64.0/19'

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: kubernetes.io/role/elb
          Value: '1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: kubernetes.io/role/elb
          Value: '1'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PublicSubnet3Cidr
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-3'
        - Key: kubernetes.io/role/elb
          Value: '1'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'
        - Key: !Sub 'kubernetes.io/cluster/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
          Value: 'shared'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'
        - Key: !Sub 'kubernetes.io/cluster/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
          Value: 'shared'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet3Cidr
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-3'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'
        - Key: !Sub 'kubernetes.io/cluster/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
          Value: 'shared'

  # NAT Gateways
  NatGateway1Eip:
    Type: AWS::EC2::EIP
    DependsOn: VpcGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2Eip:
    Type: AWS::EC2::EIP
    DependsOn: VpcGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway3Eip:
    Type: AWS::EC2::EIP
    DependsOn: VpcGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1Eip.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2Eip.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-2'

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3Eip.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-3'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-1'

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-2'

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt-3'

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VpcGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway3

  # Route Table Associations
  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Security Groups
  EksClusterSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EKS cluster control plane'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - !If
          - EnableBastionAccess
          - IpProtocol: tcp
            FromPort: 443
            ToPort: 443
            SourceSecurityGroupId: !Ref BastionSecurityGroup
          - !Ref AWS::NoValue
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-sg'

  EksNodeSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EKS worker nodes'
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-node-sg'
        - Key: !Sub 'kubernetes.io/cluster/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
          Value: 'owned'

  EksNodeSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EksNodeSecurityGroup
      IpProtocol: -1
      SourceSecurityGroupId: !Ref EksNodeSecurityGroup

  EksNodeSecurityGroupFromControlPlaneIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EksNodeSecurityGroup
      IpProtocol: tcp
      FromPort: 1025
      ToPort: 65535
      SourceSecurityGroupId: !Ref EksClusterSecurityGroup

  EksControlPlaneSecurityGroupFromNodeIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EksClusterSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      SourceSecurityGroupId: !Ref EksNodeSecurityGroup

  # Lambda Security Group for VPC access
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda function to access EKS API'
      VpcId: !Ref Vpc
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access to EKS API'
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'DNS resolution'
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: '0.0.0.0/0'
          Description: 'DNS resolution'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg'

  EksControlPlaneSecurityGroupFromLambdaIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref EksClusterSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Description: 'Allow Lambda function access to EKS API'

  # IAM Roles
  EksClusterRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSClusterPolicy'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSServicePolicy'

  EksNodeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-node-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKS_CNI_Policy'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonSSMManagedInstanceCore'

  # CloudWatch Logs
  EksClusterLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/eks/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster/cluster'
      RetentionInDays: 7
      KmsKeyId: !If [EnableEbsEncryption, !GetAtt LogsKmsKey.Arn, !Ref AWS::NoValue]

  # EKS Cluster
  EksCluster:
    Type: AWS::EKS::Cluster
    DependsOn: [EksClusterLogGroup]
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
      Version: !Ref KubernetesVersion
      RoleArn: !GetAtt EksClusterRole.Arn
      ResourcesVpcConfig:
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
          - !Ref PublicSubnet1
          - !Ref PublicSubnet2
          - !Ref PublicSubnet3
        SecurityGroupIds:
          - !Ref EksClusterSecurityGroup
        EndpointPrivateAccess: true
        EndpointPublicAccess: true
        PublicAccessCidrs: ['0.0.0.0/0']
      Logging:
        ClusterLogging:
          EnabledTypes:
            - Type: api
            - Type: audit
            - Type: authenticator
            - Type: controllerManager
            - Type: scheduler
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'

  # Launch Templates
  OnDemandLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-lt'
      LaunchTemplateData:
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        Monitoring:
          Enabled: true
        SecurityGroupIds:
          - !Ref EksNodeSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-node'
              - Key: 'k8s.io/cluster-autoscaler/enabled'
                Value: 'true'
              - Key: !Sub 'k8s.io/cluster-autoscaler/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
                Value: 'owned'
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub
            - |
              MIME-Version: 1.0
              Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="
              
              --==MYBOUNDARY==
              Content-Type: text/x-shellscript; charset="us-ascii"
              
              #!/bin/bash
              /etc/eks/bootstrap.sh ${EksCluster} \
                --kubelet-extra-args '--max-pods=${MaxPods}'
              --==MYBOUNDARY==--
            - MaxPods: !FindInMap [InstanceTypeMaxPods, t3.medium, MaxPods]

  SpotLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-lt'
      LaunchTemplateData:
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        Monitoring:
          Enabled: true
        SecurityGroupIds:
          - !Ref EksNodeSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-node'
              - Key: 'k8s.io/cluster-autoscaler/enabled'
                Value: 'true'
              - Key: !Sub 'k8s.io/cluster-autoscaler/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
                Value: 'owned'
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        UserData:
          Fn::Base64: !Sub
            - |
              MIME-Version: 1.0
              Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="
              
              --==MYBOUNDARY==
              Content-Type: text/x-shellscript; charset="us-ascii"
              
              #!/bin/bash
              /etc/eks/bootstrap.sh ${EksCluster} \
                --kubelet-extra-args '--max-pods=${MaxPods}'
              --==MYBOUNDARY==--
            - MaxPods: !FindInMap [InstanceTypeMaxPods, t3.large, MaxPods]

  # Node Groups
  OnDemandNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: [OidcProvider]
    Properties:
      NodegroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-nodes'
      ClusterName: !Ref EksCluster
      NodeRole: !GetAtt EksNodeRole.Arn
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      ScalingConfig:
        DesiredSize: 2
        MinSize: 2
        MaxSize: 4
      InstanceTypes:
        - t3.medium
      AmiType: AL2_x86_64
      CapacityType: ON_DEMAND
      Tags:
        Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ondemand-node'
        'k8s.io/cluster-autoscaler/enabled': 'true'

  SpotNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: [OidcProvider]
    Properties:
      NodegroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-nodes'
      ClusterName: !Ref EksCluster
      NodeRole: !GetAtt EksNodeRole.Arn
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      ScalingConfig:
        DesiredSize: 3
        MinSize: 3
        MaxSize: 9
      InstanceTypes:
        - t3.large
        - t3a.large
        - t2.large
      AmiType: AL2_x86_64
      CapacityType: SPOT
      Tags:
        Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-spot-node'
        'k8s.io/cluster-autoscaler/enabled': 'true'

  # OIDC Provider
  OidcProvider:
    Type: AWS::IAM::OIDCProvider
    Properties:
      ClientIdList:
        - sts.amazonaws.com
      ThumbprintList:
        - '9e99a48a9960b14926bb7f3b02e22da2b0ab7280'
        - 'EE02AB7077803D7A698425630CF63F052EBC8A2C'
      Url: !GetAtt EksCluster.OpenIdConnectIssuerUrl

  # IRSA Roles
  ClusterAutoscalerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-autoscaler-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Ref OidcProvider
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                ':aud': 'sts.amazonaws.com'
      Policies:
        - PolicyName: ClusterAutoscalerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - autoscaling:DescribeAutoScalingGroups
                  - autoscaling:DescribeAutoScalingInstances
                  - autoscaling:DescribeLaunchConfigurations
                  - autoscaling:DescribeTags
                  - autoscaling:SetDesiredCapacity
                  - autoscaling:TerminateInstanceInAutoScalingGroup
                  - ec2:DescribeLaunchTemplateVersions
                  - ec2:DescribeInstanceTypes
                Resource: '*'

  AwsLoadBalancerControllerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-controller-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Ref OidcProvider
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                ':aud': 'sts.amazonaws.com'
      ManagedPolicyArns:
        - !Ref AwsLoadBalancerControllerPolicy

  AwsLoadBalancerControllerPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb-controller-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - elasticloadbalancing:*
              - ec2:DescribeAccountAttributes
              - ec2:DescribeAddresses
              - ec2:DescribeAvailabilityZones
              - ec2:DescribeInternetGateways
              - ec2:DescribeVpcs
              - ec2:DescribeVpcPeeringConnections
              - ec2:DescribeSubnets
              - ec2:DescribeSecurityGroups
              - ec2:DescribeInstances
              - ec2:DescribeNetworkInterfaces
              - ec2:DescribeTags
              - ec2:GetCoipPoolUsage
              - ec2:DescribeCoipPools
              - ec2:CreateSecurityGroup
              - ec2:CreateTags
              - ec2:DeleteTags
              - ec2:DeleteSecurityGroup
              - ec2:AuthorizeSecurityGroupIngress
              - ec2:RevokeSecurityGroupIngress
              - ec2:AuthorizeSecurityGroupEgress
              - ec2:RevokeSecurityGroupEgress
              - cognito-idp:DescribeUserPoolClient
              - acm:ListCertificates
              - acm:DescribeCertificate
              - iam:ListServerCertificates
              - iam:GetServerCertificate
              - waf-regional:GetWebACL
              - waf-regional:GetWebACLForResource
              - waf-regional:AssociateWebACL
              - waf-regional:DisassociateWebACL
              - wafv2:GetWebACL
              - wafv2:GetWebACLForResource
              - wafv2:AssociateWebACL
              - wafv2:DisassociateWebACL
              - shield:GetSubscriptionState
              - shield:DescribeProtection
              - shield:CreateProtection
              - shield:DeleteProtection
              - tag:GetResources
              - tag:TagResources
            Resource: '*'

  EbsCsiDriverRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ebs-csi-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Ref OidcProvider
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                ':aud': 'sts.amazonaws.com'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy'

  # EKS Add-ons
  VpcCniAddon:
    Type: AWS::EKS::Addon
    Properties:
      AddonName: vpc-cni
      ClusterName: !Ref EksCluster
      ResolveConflicts: OVERWRITE

  EbsCsiAddon:
    Type: AWS::EKS::Addon
    Properties:
      AddonName: aws-ebs-csi-driver
      ClusterName: !Ref EksCluster
      ServiceAccountRoleArn: !GetAtt EbsCsiDriverRole.Arn
      ResolveConflicts: OVERWRITE

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: EksManagementPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - eks:DescribeCluster
                  - eks:ListClusters
                  - eks:AccessKubernetesApi
                  - iam:GetOpenIDConnectProvider
                  - ec2:DescribeInstances
                  - ec2:DescribeSubnets
                  - ec2:DescribeVpcs
                  - autoscaling:DescribeAutoScalingGroups
                  - sts:GetCallerIdentity
                Resource: '*'

  # Lambda Function
  KubernetesManagementFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 900
      MemorySize: 1024
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
      Environment:
        Variables:
          CLUSTER_NAME: !Ref EksCluster
          VPC_ID: !Ref Vpc
          REGION: !Ref AWS::Region
          CLUSTER_AUTOSCALER_ROLE_ARN: !GetAtt ClusterAutoscalerRole.Arn
          AWS_LB_CONTROLLER_ROLE_ARN: !GetAtt AwsLoadBalancerControllerRole.Arn
          EBS_KMS_KEY_ID: !If [EnableEbsEncryption, !Ref EbsKmsKey, ""]
          ENABLE_EBS_ENCRYPTION: !Ref EnableEbsEncryption
      Code:
        ZipFile: |
          import json
          import boto3
          import base64
          import os
          import time
          from datetime import datetime
          import cfnresponse

          def handler(event, context):
              print(json.dumps(event))
              
              try:
                  if event['RequestType'] == 'Delete':
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      return
                  
                  cluster_name = os.environ['CLUSTER_NAME']
                  vpc_id = os.environ['VPC_ID']
                  region = os.environ['REGION']
                  autoscaler_role = os.environ['CLUSTER_AUTOSCALER_ROLE_ARN']
                  alb_role = os.environ['AWS_LB_CONTROLLER_ROLE_ARN']
                  ebs_kms_key_id = os.environ.get('EBS_KMS_KEY_ID', '')
                  enable_ebs_encryption = os.environ.get('ENABLE_EBS_ENCRYPTION', 'false')
                  
                  eks_client = boto3.client('eks', region_name=region)
                  iam_client = boto3.client('iam', region_name=region)
                  ec2_client = boto3.client('ec2', region_name=region)
                  
                  # Get cluster info
                  cluster = eks_client.describe_cluster(name=cluster_name)['cluster']
                  endpoint = cluster['endpoint']
                  ca_data = cluster['certificateAuthority']['data']
                  oidc_url = cluster['identity']['oidc']['issuer']
                  
                  # Get OIDC thumbprint
                  oidc_provider = oidc_url.replace('https://', '')
                  thumbprint = get_thumbprint(oidc_url)
                  
                  # Wait for cluster to be ready
                  print("Waiting for cluster to be ready...")
                  time.sleep(30)
                  
                  print("Cluster information retrieved successfully")
                  print(f"Cluster name: {cluster_name}")
                  print(f"Cluster endpoint: {endpoint}")
                  print(f"OIDC issuer: {oidc_url}")
                  print(f"Cluster autoscaler role: {autoscaler_role}")
                  print(f"ALB controller role: {alb_role}")
                  
                  # Note: Kubernetes setup (storage classes, cluster autoscaler, etc.) 
                  # can be installed after stack creation using kubectl or Helm
                  print("Lambda function completed successfully - cluster is ready for kubectl access")
                  
                  response_data = {
                      'OidcIssuerUrl': oidc_url,
                      'OidcThumbprint': thumbprint,
                      'ClusterEndpoint': endpoint,
                      'ClusterCA': ca_data
                  }
                  
                  cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  import traceback
                  traceback.print_exc()
                  cfnresponse.send(event, context, cfnresponse.FAILED, {})

          def get_thumbprint(oidc_url):
              # EKS OIDC root CA thumbprint (well-known value)
              return "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"





  # Custom Resource
  KubernetesCustomResource:
    Type: Custom::KubernetesSetup
    DependsOn: 
      - OnDemandNodeGroup
      - SpotNodeGroup
      - VpcCniAddon
      - EbsCsiAddon
    Properties:
      ServiceToken: !GetAtt KubernetesManagementFunction.Arn
      ClusterName: !Ref EksCluster
      Timestamp: !Ref AWS::StackId

Conditions:
  EnableEbsEncryption: !Equals [!Ref EnableEbsEncryption, 'true']
  EnableBastionAccess: !Equals [!Ref EnableBastionAccess, 'true']

Outputs:
  OidcIssuerUrl:
    Description: 'OIDC Issuer URL'
    Value: !GetAtt KubernetesCustomResource.OidcIssuerUrl
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OIDC-Issuer-URL"

  OidcThumbprint:
    Description: 'OIDC Thumbprint'
    Value: !GetAtt KubernetesCustomResource.OidcThumbprint
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OIDC-Thumbprint"

  ClusterName:
    Description: 'EKS Cluster Name'
    Value: !Ref EksCluster
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Name"

  ClusterEndpoint:
    Description: 'EKS Cluster Endpoint'
    Value: !GetAtt EksCluster.Endpoint
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Endpoint"
      
  OidcIssuerUrlDirect:
    Description: 'OIDC Issuer URL (Direct)'
    Value: !GetAtt EksCluster.OpenIdConnectIssuerUrl
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OIDC-Issuer-URL-Direct"

  NodeGroupRoleArn:
    Description: 'Node Group IAM Role ARN'
    Value: !GetAtt EksNodeRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Node-Group-Role-ARN"

  ClusterAutoscalerRoleArn:
    Description: 'Cluster Autoscaler IAM Role ARN'
    Value: !GetAtt ClusterAutoscalerRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Autoscaler-Role-ARN"

  AwsLoadBalancerControllerRoleArn:
    Description: 'AWS Load Balancer Controller IAM Role ARN'
    Value: !GetAtt AwsLoadBalancerControllerRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-ALB-Controller-Role-ARN"

  EbsCsiDriverRoleArn:
    Description: 'EBS CSI Driver IAM Role ARN'
    Value: !GetAtt EbsCsiDriverRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-CSI-Driver-Role-ARN"

  VpcId:
    Description: 'VPC ID'
    Value: !Ref Vpc
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-ID"

  PrivateSubnetIds:
    Description: 'Private Subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-IDs"

  PublicSubnetIds:
    Description: 'Public Subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-IDs"

  EbsKmsKeyId:
    Condition: EnableEbsEncryption
    Description: 'KMS Key ID for EBS encryption'
    Value: !Ref EbsKmsKey
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-KMS-Key-ID"

  EbsKmsKeyArn:
    Condition: EnableEbsEncryption  
    Description: 'KMS Key ARN for EBS encryption'
    Value: !GetAtt EbsKmsKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-KMS-Key-ARN"

  BastionSecurityGroupId:
    Condition: EnableBastionAccess
    Description: 'Security Group ID for bastion host access'
    Value: !Ref BastionSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Bastion-Security-Group-ID"

  LogsKmsKeyId:
    Condition: EnableEbsEncryption
    Description: 'KMS Key ID for CloudWatch Logs encryption'
    Value: !Ref LogsKmsKey
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Logs-KMS-Key-ID"

  LogsKmsKeyArn:
    Condition: EnableEbsEncryption  
    Description: 'KMS Key ARN for CloudWatch Logs encryption'
    Value: !GetAtt LogsKmsKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Logs-KMS-Key-ARN"

  # Additional Network Outputs for Testing
  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Internet-Gateway-ID"

  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-1-ID"

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-2-ID"

  NatGateway3Id:
    Description: 'NAT Gateway 3 ID'
    Value: !Ref NatGateway3
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-3-ID"

  NatGateway1EipAllocationId:
    Description: 'NAT Gateway 1 EIP Allocation ID'
    Value: !GetAtt NatGateway1Eip.AllocationId
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-1-EIP-Allocation-ID"

  NatGateway2EipAllocationId:
    Description: 'NAT Gateway 2 EIP Allocation ID'
    Value: !GetAtt NatGateway2Eip.AllocationId
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-2-EIP-Allocation-ID"

  NatGateway3EipAllocationId:
    Description: 'NAT Gateway 3 EIP Allocation ID'
    Value: !GetAtt NatGateway3Eip.AllocationId
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-3-EIP-Allocation-ID"

  NatGateway1PublicIp:
    Description: 'NAT Gateway 1 Public IP'
    Value: !Ref NatGateway1Eip
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-1-Public-IP"

  NatGateway2PublicIp:
    Description: 'NAT Gateway 2 Public IP'
    Value: !Ref NatGateway2Eip
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-2-Public-IP"

  NatGateway3PublicIp:
    Description: 'NAT Gateway 3 Public IP'
    Value: !Ref NatGateway3Eip
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-NAT-Gateway-3-Public-IP"

  # Route Table Outputs
  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Route-Table-ID"

  PrivateRouteTable1Id:
    Description: 'Private Route Table 1 ID'
    Value: !Ref PrivateRouteTable1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Route-Table-1-ID"

  PrivateRouteTable2Id:
    Description: 'Private Route Table 2 ID'
    Value: !Ref PrivateRouteTable2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Route-Table-2-ID"

  PrivateRouteTable3Id:
    Description: 'Private Route Table 3 ID'
    Value: !Ref PrivateRouteTable3
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Route-Table-3-ID"

  # Individual Subnet Outputs
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-1-ID"

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-2-ID"

  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-3-ID"

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-1-ID"

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-2-ID"

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-3-ID"

  # Subnet Availability Zones
  PublicSubnet1Az:
    Description: 'Public Subnet 1 Availability Zone'
    Value: !GetAtt PublicSubnet1.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-1-AZ"

  PublicSubnet2Az:
    Description: 'Public Subnet 2 Availability Zone'
    Value: !GetAtt PublicSubnet2.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-2-AZ"

  PublicSubnet3Az:
    Description: 'Public Subnet 3 Availability Zone'
    Value: !GetAtt PublicSubnet3.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-3-AZ"

  PrivateSubnet1Az:
    Description: 'Private Subnet 1 Availability Zone'
    Value: !GetAtt PrivateSubnet1.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-1-AZ"

  PrivateSubnet2Az:
    Description: 'Private Subnet 2 Availability Zone'
    Value: !GetAtt PrivateSubnet2.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-2-AZ"

  PrivateSubnet3Az:
    Description: 'Private Subnet 3 Availability Zone'
    Value: !GetAtt PrivateSubnet3.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-3-AZ"

  # CIDR Block Outputs
  VpcCidrBlock:
    Description: 'VPC CIDR Block'
    Value: !GetAtt Vpc.CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-CIDR-Block"

  PublicSubnet1CidrBlock:
    Description: 'Public Subnet 1 CIDR Block'
    Value: !Ref PublicSubnet1Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-1-CIDR"

  PublicSubnet2CidrBlock:
    Description: 'Public Subnet 2 CIDR Block'
    Value: !Ref PublicSubnet2Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-2-CIDR"

  PublicSubnet3CidrBlock:
    Description: 'Public Subnet 3 CIDR Block'
    Value: !Ref PublicSubnet3Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Public-Subnet-3-CIDR"

  PrivateSubnet1CidrBlock:
    Description: 'Private Subnet 1 CIDR Block'
    Value: !Ref PrivateSubnet1Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-1-CIDR"

  PrivateSubnet2CidrBlock:
    Description: 'Private Subnet 2 CIDR Block'
    Value: !Ref PrivateSubnet2Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-2-CIDR"

  PrivateSubnet3CidrBlock:
    Description: 'Private Subnet 3 CIDR Block'
    Value: !Ref PrivateSubnet3Cidr
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-3-CIDR"

  # Security Group Outputs
  EksClusterSecurityGroupId:
    Description: 'EKS Cluster Security Group ID'
    Value: !Ref EksClusterSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Cluster-Security-Group-ID"

  EksNodeSecurityGroupId:
    Description: 'EKS Node Security Group ID'
    Value: !Ref EksNodeSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Node-Security-Group-ID"

  # IAM Role Outputs
  EksClusterRoleArn:
    Description: 'EKS Cluster IAM Role ARN'
    Value: !GetAtt EksClusterRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Cluster-Role-ARN"

  EksClusterRoleName:
    Description: 'EKS Cluster IAM Role Name'
    Value: !Ref EksClusterRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Cluster-Role-Name"

  EksNodeRoleName:
    Description: 'EKS Node IAM Role Name'
    Value: !Ref EksNodeRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Node-Role-Name"

  ClusterAutoscalerRoleName:
    Description: 'Cluster Autoscaler IAM Role Name'
    Value: !Ref ClusterAutoscalerRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Autoscaler-Role-Name"

  AwsLoadBalancerControllerRoleName:
    Description: 'AWS Load Balancer Controller IAM Role Name'
    Value: !Ref AwsLoadBalancerControllerRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-ALB-Controller-Role-Name"

  EbsCsiDriverRoleName:
    Description: 'EBS CSI Driver IAM Role Name'
    Value: !Ref EbsCsiDriverRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-CSI-Driver-Role-Name"

  LambdaExecutionRoleArn:
    Description: 'Lambda Execution Role ARN'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Execution-Role-ARN"

  LambdaExecutionRoleName:
    Description: 'Lambda Execution Role Name'
    Value: !Ref LambdaExecutionRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Execution-Role-Name"

  # EKS Node Group Outputs
  OnDemandNodeGroupName:
    Description: 'On-Demand Node Group Name'
    Value: !Ref OnDemandNodeGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OnDemand-Node-Group-Name"

  OnDemandNodeGroupArn:
    Description: 'On-Demand Node Group ARN'
    Value: !GetAtt OnDemandNodeGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OnDemand-Node-Group-ARN"

  SpotNodeGroupName:
    Description: 'Spot Node Group Name'
    Value: !Ref SpotNodeGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Spot-Node-Group-Name"

  SpotNodeGroupArn:
    Description: 'Spot Node Group ARN'
    Value: !GetAtt SpotNodeGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Spot-Node-Group-ARN"

  # Launch Template Outputs
  OnDemandLaunchTemplateId:
    Description: 'On-Demand Launch Template ID'
    Value: !Ref OnDemandLaunchTemplate
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OnDemand-Launch-Template-ID"

  OnDemandLaunchTemplateVersion:
    Description: 'On-Demand Launch Template Version'
    Value: !GetAtt OnDemandLaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OnDemand-Launch-Template-Version"

  SpotLaunchTemplateId:
    Description: 'Spot Launch Template ID'
    Value: !Ref SpotLaunchTemplate
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Spot-Launch-Template-ID"

  SpotLaunchTemplateVersion:
    Description: 'Spot Launch Template Version'
    Value: !GetAtt SpotLaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Spot-Launch-Template-Version"

  # EKS Add-on Outputs
  VpcCniAddonArn:
    Description: 'VPC CNI Add-on ARN'
    Value: !GetAtt VpcCniAddon.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-CNI-Addon-ARN"

  VpcCniAddonVersion:
    Description: 'VPC CNI Add-on Version'
    Value: !Ref VpcCniAddon
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-CNI-Addon-Version"

  EbsCsiAddonArn:
    Description: 'EBS CSI Add-on ARN'
    Value: !GetAtt EbsCsiAddon.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-CSI-Addon-ARN"

  EbsCsiAddonVersion:
    Description: 'EBS CSI Add-on Version'
    Value: !Ref EbsCsiAddon
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-CSI-Addon-Version"

  # OIDC Provider Outputs
  OidcProviderArn:
    Description: 'OIDC Provider ARN'
    Value: !GetAtt OidcProvider.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OIDC-Provider-ARN"

  OidcProviderUrl:
    Description: 'OIDC Provider URL'
    Value: !Ref OidcProvider
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-OIDC-Provider-URL"

  # CloudWatch Log Group Outputs
  EksClusterLogGroupName:
    Description: 'EKS Cluster Log Group Name'
    Value: !Ref EksClusterLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Cluster-Log-Group-Name"

  EksClusterLogGroupArn:
    Description: 'EKS Cluster Log Group ARN'
    Value: !GetAtt EksClusterLogGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EKS-Cluster-Log-Group-ARN"

  # Lambda Function Outputs
  KubernetesManagementFunctionArn:
    Description: 'Kubernetes Management Lambda Function ARN'
    Value: !GetAtt KubernetesManagementFunction.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Kubernetes-Management-Function-ARN"

  KubernetesManagementFunctionName:
    Description: 'Kubernetes Management Lambda Function Name'
    Value: !Ref KubernetesManagementFunction
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Kubernetes-Management-Function-Name"

  # KMS Key Aliases (Conditional)
  LogsKmsKeyAliasName:
    Condition: EnableEbsEncryption
    Description: 'CloudWatch Logs KMS Key Alias Name'
    Value: !Ref LogsKmsKeyAlias
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Logs-KMS-Key-Alias-Name"

  EbsKmsKeyAliasName:
    Condition: EnableEbsEncryption
    Description: 'EBS KMS Key Alias Name'
    Value: !Ref EbsKmsKeyAlias
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-EBS-KMS-Key-Alias-Name"

  # Managed Policy Output
  AwsLoadBalancerControllerPolicyArn:
    Description: 'AWS Load Balancer Controller Managed Policy ARN'
    Value: !Ref AwsLoadBalancerControllerPolicy
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-ALB-Controller-Policy-ARN"

  # Region and Account Information
  DeployedRegion:
    Description: 'AWS Region where resources are deployed'
    Value: !Ref AWS::Region
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Deployed-Region"

  StackName:
    Description: 'CloudFormation Stack Name'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Stack-Name"

  # Environment and Configuration Outputs
  EnvironmentSuffix:
    Description: 'Environment Suffix used for resource naming'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Environment-Suffix"

  KubernetesVersion:
    Description: 'Kubernetes Version'
    Value: !Ref KubernetesVersion
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Kubernetes-Version"

  # VPC Secondary CIDR Blocks
  SecondaryCidr1:
    Description: 'Secondary CIDR Block 1 for VPC CNI Custom Networking'
    Value: '100.64.0.0/19'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Secondary-CIDR-1"

  SecondaryCidr2:
    Description: 'Secondary CIDR Block 2 for VPC CNI Custom Networking'
    Value: '100.64.32.0/19'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Secondary-CIDR-2"

  SecondaryCidr3:
    Description: 'Secondary CIDR Block 3 for VPC CNI Custom Networking'
    Value: '100.64.64.0/19'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Secondary-CIDR-3"

  # Complete Resource List for Testing
  AllPrivateSubnetIds:
    Description: 'All Private Subnet IDs (comma-separated)'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-All-Private-Subnet-IDs"

  AllPublicSubnetIds:
    Description: 'All Public Subnet IDs (comma-separated)'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-All-Public-Subnet-IDs"

  AllNatGatewayIds:
    Description: 'All NAT Gateway IDs (comma-separated)'
    Value: !Join [',', [!Ref NatGateway1, !Ref NatGateway2, !Ref NatGateway3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-All-NAT-Gateway-IDs"

  AllPrivateRouteTableIds:
    Description: 'All Private Route Table IDs (comma-separated)'
    Value: !Join [',', [!Ref PrivateRouteTable1, !Ref PrivateRouteTable2, !Ref PrivateRouteTable3]]
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-All-Private-Route-Table-IDs"

  # Testing Helper Outputs
  KubectlConfigCommand:
    Description: 'AWS CLI command to configure kubectl'
    Value: !Sub 'aws eks --region ${AWS::Region} update-kubeconfig --name ${EksCluster}'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Kubectl-Config-Command"

  ClusterAccessTestCommand:
    Description: 'Command to test cluster access'
    Value: 'kubectl get nodes'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Access-Test-Command"

  ClusterInfoCommand:
    Description: 'Command to get cluster information'
    Value: 'kubectl cluster-info'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-Info-Command"

  # Resource Tags for Identification
  ResourceNamePrefix:
    Description: 'Prefix used for all resource names'
    Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}'
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Resource-Name-Prefix"

  # EKS Cluster ARN
  ClusterArn:
    Description: 'EKS Cluster ARN'
    Value: !GetAtt EksCluster.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Cluster-ARN"

  # Custom Resource Outputs
  CustomResourceArn:
    Description: 'Kubernetes Custom Resource ARN'
    Value: !Ref KubernetesCustomResource
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Custom-Resource-ARN"