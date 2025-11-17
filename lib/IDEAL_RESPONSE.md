# EKS Cluster with Managed Node Groups - Ideal Production-Ready Implementation

This implementation addresses all issues found in MODEL_FAILURES.md and provides a production-ready EKS cluster configuration.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-Ready EKS Cluster with Managed Node Groups and Advanced Networking'

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

  LogRetentionDays:
    Type: Number
    Description: CloudWatch log retention period in days
    Default: 30
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]

  PublicAccessCidrs:
    Type: CommaDelimitedList
    Description: CIDR blocks allowed to access the EKS public API endpoint
    Default: '0.0.0.0/0'

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: shared

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

  # VPC Flow Logs for Security Monitoring
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: !GetAtt VPCFlowLogsLogGroup.Arn

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs-${environmentSuffix}'
      RetentionInDays: !Ref LogRetentionDays

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref EKSVpc
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'eks-vpc-flowlogs-${environmentSuffix}'

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: shared

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: shared

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: shared

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: shared

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
        - Key: !Sub 'kubernetes.io/cluster/eks-cluster-${environmentSuffix}'
          Value: owned

  NodeSecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      Description: Allow nodes to communicate with each other
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref NodeSecurityGroup
      IpProtocol: -1
      FromPort: -1
      ToPort: -1

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

  # KMS Key for EKS encryption with safe deletion
  EKSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EKS cluster ${environmentSuffix}'
      EnableKeyRotation: true
      PendingWindowInDays: 7
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
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  EKSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/eks-${environmentSuffix}'
      TargetKeyId: !Ref EKSKMSKey

  # IAM Roles - Let CloudFormation auto-generate unique names to avoid conflicts
  EKSClusterRole:
    Type: AWS::IAM::Role
    Properties:
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
      Tags:
        - Key: Name
          Value: !Sub 'eks-cluster-role-${environmentSuffix}'
        - Key: Environment
          Value: !Ref environmentSuffix

  EKSNodeRole:
    Type: AWS::IAM::Role
    Properties:
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
      Tags:
        - Key: Name
          Value: !Sub 'eks-node-role-${environmentSuffix}'
        - Key: Environment
          Value: !Ref environmentSuffix

  # CloudWatch Log Group with configurable retention
  EKSClusterLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/eks/cluster-${environmentSuffix}/cluster'
      RetentionInDays: !Ref LogRetentionDays
      KmsKeyId: !GetAtt EKSKMSKey.Arn

  # EKS Cluster with enhanced security
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
        PublicAccessCidrs: !Ref PublicAccessCidrs
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

  # EKS Node Group with proper dependencies
  EKSNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn:
      - EKSCluster
      - PrivateRoute1
      - PrivateRoute2
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

  VPCFlowLogsLogGroupName:
    Description: CloudWatch Log Group for VPC Flow Logs
    Value: !Ref VPCFlowLogsLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLogsLogGroupName'

  EKSClusterRoleArn:
    Description: ARN of the EKS Cluster IAM Role
    Value: !GetAtt EKSClusterRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EKSClusterRoleArn'

  EKSNodeRoleArn:
    Description: ARN of the EKS Node IAM Role
    Value: !GetAtt EKSNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EKSNodeRoleArn'
```

## Key Improvements in Ideal Response

1. **Proper Kubernetes Cluster Tags**: Added `kubernetes.io/cluster/eks-cluster-${environmentSuffix}: shared` tags to VPC and all subnets for proper EKS integration

2. **No IAM Role Name Conflicts**: Removed explicit RoleName properties to let CloudFormation auto-generate unique names, preventing multi-stack conflicts

3. **Safe KMS Deletion**: Added `PendingWindowInDays: 7` to KMS key for safe deletion with recovery period

4. **Proper Resource Dependencies**: Added `DependsOn` for PrivateRoute1 and PrivateRoute2 to EKSNodeGroup to ensure networking is ready

5. **VPC Flow Logs**: Added complete VPC Flow Logs implementation with CloudWatch Logs for security monitoring

6. **Configurable Log Retention**: Added `LogRetentionDays` parameter with increased default to 30 days for production compliance

7. **Cluster Endpoint Access Control**: Added `PublicAccessCidrs` parameter to restrict public API endpoint access

8. **Enhanced KMS Policy**: Added CloudWatch Logs permissions to KMS key policy for encrypted log groups

9. **Log Encryption**: Added KMS encryption to CloudWatch log groups

10. **Additional Outputs**: Added more comprehensive outputs including VPC Flow Logs, IAM role ARNs for reference

All resources maintain the environmentSuffix requirement and follow CloudFormation YAML best practices for production deployments.
