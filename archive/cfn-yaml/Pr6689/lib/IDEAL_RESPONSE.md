# EKS Cluster with Managed Node Groups - Production-Ready Implementation

This implementation creates a production-ready EKS cluster with managed node groups, VPC, and advanced networking that passes all lint checks and successfully deploys.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EKS Cluster with Managed Node Groups and Advanced Networking'

Parameters:
  environmentSuffix:
    Type: String
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    Default: dev
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  KubernetesVersion:
    Type: String
    Description: Kubernetes version for EKS cluster
    Default: '1.28'
    AllowedValues:
      - '1.28'
      - '1.27'
      - '1.26'

  NodeInstanceType:
    Type: String
    Description: EC2 instance type for worker nodes
    Default: t3.medium
    AllowedValues:
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge

  NodeGroupMinSize:
    Type: Number
    Description: Minimum number of nodes in the node group
    Default: 2
    MinValue: 1

  NodeGroupMaxSize:
    Type: Number
    Description: Maximum number of nodes in the node group
    Default: 4
    MinValue: 1

  NodeGroupDesiredSize:
    Type: Number
    Description: Desired number of nodes in the node group
    Default: 2
    MinValue: 1

  VpcCIDR:
    Type: String
    Description: CIDR block for the VPC
    Default: 10.0.0.0/16
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$

Resources:
  # VPC Resources
  EKSVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-vpc-${environmentSuffix}'
        - Key: Environment
          Value: !Ref environmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'eks-igw-${environmentSuffix}'

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref EKSVpc
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref EKSVpc
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, 6, 12]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-subnet-1-${environmentSuffix}'
        - Key: kubernetes.io/role/elb
          Value: '1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref EKSVpc
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, 6, 12]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-subnet-2-${environmentSuffix}'
        - Key: kubernetes.io/role/elb
          Value: '1'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref EKSVpc
      CidrBlock: !Select [2, !Cidr [!Ref VpcCIDR, 6, 12]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-subnet-1-${environmentSuffix}'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref EKSVpc
      CidrBlock: !Select [3, !Cidr [!Ref VpcCIDR, 6, 12]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-subnet-2-${environmentSuffix}'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  # NAT Gateway Resources
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-eip-1-${environmentSuffix}'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-eip-2-${environmentSuffix}'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-gateway-1-${environmentSuffix}'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-gateway-2-${environmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref EKSVpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-rt-${environmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref EKSVpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-rt-1-${environmentSuffix}'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref EKSVpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-rt-2-${environmentSuffix}'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  ClusterSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EKS cluster control plane
      VpcId: !Ref EKSVpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-cluster-sg-${environmentSuffix}'

  NodeSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EKS worker nodes
      VpcId: !Ref EKSVpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-node-sg-${environmentSuffix}'

  NodeSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      Description: Allow nodes to communicate with each other
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref NodeSecurityGroup
      IpProtocol: -1

  NodeSecurityGroupFromClusterIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      Description: Allow worker Kubelets and pods to receive communication from the cluster control plane
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref ClusterSecurityGroup
      IpProtocol: tcp
      FromPort: 1025
      ToPort: 65535

  ClusterSecurityGroupFromNodeIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      Description: Allow pods to communicate with the cluster API Server
      GroupId: !Ref ClusterSecurityGroup
      SourceSecurityGroupId: !Ref NodeSecurityGroup
      IpProtocol: tcp
      ToPort: 443
      FromPort: 443

  NodeSecurityGroupEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      Description: Allow all outbound traffic
      GroupId: !Ref NodeSecurityGroup
      CidrIp: 0.0.0.0/0
      IpProtocol: -1

  # KMS Key for EKS encryption
  EKSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EKS cluster ${environmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EKS to use the key
            Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EKSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/eks-${environmentSuffix}'
      TargetKeyId: !Ref EKSKMSKey

  # IAM Roles
  EKSClusterRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-cluster-role-${environmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
        - 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'

  EKSNodeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-node-role-${environmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy'
        - 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'

  # CloudWatch Log Group
  EKSClusterLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/eks/cluster-${environmentSuffix}/cluster'
      RetentionInDays: 7

  # EKS Cluster
  EKSCluster:
    Type: AWS::EKS::Cluster
    Properties:
      Name: !Sub 'eks-cluster-${environmentSuffix}'
      Version: !Ref KubernetesVersion
      RoleArn: !GetAtt EKSClusterRole.Arn
      ResourcesVpcConfig:
        SecurityGroupIds:
          - !Ref ClusterSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PublicSubnet1
          - !Ref PublicSubnet2
        EndpointPrivateAccess: true
        EndpointPublicAccess: true
      EncryptionConfig:
        - Resources:
            - secrets
          Provider:
            KeyArn: !GetAtt EKSKMSKey.Arn
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
          Value: !Sub 'eks-cluster-${environmentSuffix}'
        - Key: Environment
          Value: !Ref environmentSuffix

  # EKS Node Group
  EKSNodeGroup:
    Type: AWS::EKS::Nodegroup
    Properties:
      NodegroupName: !Sub 'eks-nodegroup-${environmentSuffix}'
      ClusterName: !Ref EKSCluster
      NodeRole: !GetAtt EKSNodeRole.Arn
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      ScalingConfig:
        MinSize: !Ref NodeGroupMinSize
        MaxSize: !Ref NodeGroupMaxSize
        DesiredSize: !Ref NodeGroupDesiredSize
      InstanceTypes:
        - !Ref NodeInstanceType
      AmiType: AL2_x86_64
      Tags:
        Name: !Sub 'eks-nodegroup-${environmentSuffix}'
        Environment: !Ref environmentSuffix

Outputs:
  ClusterName:
    Description: EKS Cluster Name
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ClusterName'

  ClusterEndpoint:
    Description: EKS Cluster Endpoint
    Value: !GetAtt EKSCluster.Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-ClusterEndpoint'

  ClusterSecurityGroupId:
    Description: Security Group ID for the EKS cluster
    Value: !Ref ClusterSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ClusterSecurityGroupId'

  NodeGroupName:
    Description: EKS Node Group Name
    Value: !Ref EKSNodeGroup
    Export:
      Name: !Sub '${AWS::StackName}-NodeGroupName'

  VpcId:
    Description: VPC ID
    Value: !Ref EKSVpc
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  KMSKeyId:
    Description: KMS Key ID for EKS encryption
    Value: !Ref EKSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  ClusterLogGroupName:
    Description: CloudWatch Log Group for EKS cluster logs
    Value: !Ref EKSClusterLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-ClusterLogGroupName'
```

## Implementation Notes

This CloudFormation template creates:
- VPC with public and private subnets across 2 availability zones
- Internet Gateway for public subnet internet access
- NAT Gateways in each AZ for private subnet outbound access
- Security groups with proper ingress/egress rules for cluster and nodes
- KMS key for encrypting Kubernetes secrets
- IAM roles for EKS cluster and node groups with required policies
- CloudWatch log group for control plane logs
- EKS cluster with all control plane logging enabled
- Managed node group with auto-scaling configuration

All resources include the environmentSuffix parameter for multi-environment deployment support. The template passes all CloudFormation lint checks and successfully deploys to AWS.
