# EKS Cluster Infrastructure - CloudFormation Template

This CloudFormation template creates a production-ready EKS cluster infrastructure with VPC, security groups, IAM roles, KMS encryption, and CloudWatch logging.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'EKS Cluster infrastructure for microservices hosting with VPC, security, and monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for resource names to ensure uniqueness
    Default: dev
    AllowedPattern: '[a-z0-9-]+'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  ClusterVersion:
    Type: String
    Description: Kubernetes version for EKS cluster
    Default: '1.28'
    AllowedValues:
      - '1.28'
      - '1.29'
      - '1.30'

  NodeInstanceType:
    Type: String
    Description: EC2 instance type for EKS nodes
    Default: t3.medium
    AllowedValues:
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge

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

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'eks-igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-subnet-1-${EnvironmentSuffix}'
        - Key: kubernetes.io/role/elb
          Value: '1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-subnet-2-${EnvironmentSuffix}'
        - Key: kubernetes.io/role/elb
          Value: '1'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-subnet-1-${EnvironmentSuffix}'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-subnet-2-${EnvironmentSuffix}'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-eip-${EnvironmentSuffix}'

  # NAT Gateway
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'eks-nat-${EnvironmentSuffix}'

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'eks-public-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
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

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'eks-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # KMS Key for EKS Encryption
  EKSEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EKS cluster secrets encryption - ${EnvironmentSuffix}'
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

  EKSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/eks-${EnvironmentSuffix}'
      TargetKeyId: !Ref EKSEncryptionKey

  # CloudWatch Log Group for EKS
  EKSClusterLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/eks/cluster-${EnvironmentSuffix}/cluster'
      RetentionInDays: 7

  # IAM Role for EKS Cluster
  EKSClusterRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-cluster-role-${EnvironmentSuffix}'
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
          Value: !Sub 'eks-cluster-role-${EnvironmentSuffix}'

  # EKS Cluster Security Group
  EKSClusterSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'eks-cluster-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for EKS cluster control plane
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'eks-cluster-sg-${EnvironmentSuffix}'

  # EKS Cluster
  EKSCluster:
    Type: AWS::EKS::Cluster
    Properties:
      Name: !Sub 'eks-cluster-${EnvironmentSuffix}'
      Version: !Ref ClusterVersion
      RoleArn: !GetAtt EKSClusterRole.Arn
      ResourcesVpcConfig:
        SecurityGroupIds:
          - !Ref EKSClusterSecurityGroup
        SubnetIds:
          - !Ref PublicSubnet1
          - !Ref PublicSubnet2
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        EndpointPublicAccess: true
        EndpointPrivateAccess: true
      EncryptionConfig:
        - Resources:
            - secrets
          Provider:
            KeyArn: !GetAtt EKSEncryptionKey.Arn
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
          Value: !Sub 'eks-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for EKS Node Group
  EKSNodeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-node-role-${EnvironmentSuffix}'
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
          Value: !Sub 'eks-node-role-${EnvironmentSuffix}'

  # EKS Node Group
  EKSNodeGroup:
    Type: AWS::EKS::Nodegroup
    Properties:
      NodegroupName: !Sub 'eks-nodegroup-${EnvironmentSuffix}'
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
        Name: !Sub 'eks-nodegroup-${EnvironmentSuffix}'
        Environment: !Ref EnvironmentSuffix

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ClusterName:
    Description: EKS Cluster Name
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ClusterName'

  ClusterArn:
    Description: EKS Cluster ARN
    Value: !GetAtt EKSCluster.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ClusterArn'

  ClusterEndpoint:
    Description: EKS Cluster API endpoint
    Value: !GetAtt EKSCluster.Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-ClusterEndpoint'

  ClusterSecurityGroupId:
    Description: Security group ID for the EKS cluster
    Value: !Ref EKSClusterSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ClusterSecurityGroupId'

  NodeGroupName:
    Description: EKS Node Group Name
    Value: !Ref EKSNodeGroup
    Export:
      Name: !Sub '${AWS::StackName}-NodeGroupName'

  KMSKeyId:
    Description: KMS Key ID for EKS encryption
    Value: !Ref EKSEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2'

  ClusterLogGroupName:
    Description: CloudWatch Log Group for EKS cluster logs
    Value: !Ref EKSClusterLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroup'
```

## Deployment Instructions

To deploy this EKS cluster infrastructure:

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Permissions to create VPC, EKS, IAM, KMS resources
   - Target region configured

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name TapStackdev \
     --template-body file://lib/TapStack.yml \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStackdev \
     --region us-east-1 \
     --query 'Stacks[0].StackStatus'
   ```

4. **Configure kubectl** (after deployment completes):
   ```bash
   aws eks update-kubeconfig \
     --name eks-cluster-dev \
     --region us-east-1
   ```

5. **Verify cluster**:
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces
   ```

## Key Features

- **High Availability**: Multi-AZ deployment with nodes in private subnets across 2 availability zones
- **Security**: KMS encryption for secrets, IAM roles with least privilege, security groups for network isolation
- **Monitoring**: CloudWatch logging enabled for all control plane components
- **Scalability**: Auto-scaling node group with configurable min/max/desired capacity
- **Network Isolation**: VPC with public and private subnets, NAT Gateway for private subnet egress
- **Production Ready**: Follows AWS best practices for EKS deployment

## Resource Naming

All resources include the environment suffix for uniqueness and easy identification:
- VPC: `eks-vpc-{suffix}`
- Cluster: `eks-cluster-{suffix}`
- Node Group: `eks-nodegroup-{suffix}`
- IAM Roles: `eks-cluster-role-{suffix}`, `eks-node-role-{suffix}`
- KMS Key: `alias/eks-{suffix}`

## Clean Up

To delete all resources:
```bash
aws cloudformation delete-stack \
  --stack-name TapStackdev \
  --region us-east-1
```

Note: All resources are configured without Retain policies, so the entire infrastructure can be cleanly removed.
