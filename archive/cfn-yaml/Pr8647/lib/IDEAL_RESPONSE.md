#  **ideal_response.md**

## Functional scope (build everything new)

A fully self-contained CloudFormation stack must be produced in YAML, deploying a new, production-grade multi-AZ application environment. The configuration must not reference any existing infrastructure and must provision every required module directly inside the template. The environment must span three Availability Zones and include VPC networking, public and private subnets, internet and NAT gateways, route tables per subnet, an Application Load Balancer, Auto Scaling capabilities, a highly available RDS instance with Secrets Manager integration, and a secure S3 storage layer with cross-region-ready replication. All resources created must include the EnvironmentSuffix to avoid naming conflicts across deployments, follow strict tagging requirements, and adopt high-availability, least-privilege, and encryption best practices throughout.

## Requirements to be implemented

The template must define parameters and validations, construct network layers across AZs, establish security groups for ALB, EC2, and RDS, and create a launch template and Auto Scaling group using Amazon Linux 2 with CloudWatch monitoring enabled. The RDS instance must be deployed into private subnets with multi-AZ enabled and credentials sourced from a newly created Secrets Manager secret. The S3 storage tier must include an encrypted source bucket, a replica bucket, replication IAM role, replication configuration, and customer-managed KMS key. The entire solution must be delivered through a single YAML file named TapStack.yml, representing a clean, complete, and ready-to-deploy environment.

## Deliverable

A single, fully formatted YAML CloudFormation template named TapStack.yml containing parameters, networking, compute, database, IAM, S3, replication, secrets generation, observations, and outputs. The file must include all logic inline, declare all resources explicitly, and produce a complete, deployable system without external dependencies.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-AZ infrastructure stack with ALB, ASG, RDS, and S3 with cross-region-ready replication'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Environment identifier suffix (e.g., prod-us, production, qa)'
    AllowedPattern: '^[a-z0-9-]{3,20}$'
    ConstraintDescription: 'Must be lowercase alphanumeric with hyphens, 3-20 characters'

  DestinationBucketRegion:
    Type: String
    Default: 'us-east-1'
    Description: 'Intended AWS region for S3 replication destination bucket (informational tag / documentation only)'

  SSHAllowedCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

Resources:
  # VPC and Core Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-vpc-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'myapp-igw-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (dynamic AZs)
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-public-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-public-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-public-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnets (dynamic AZs)
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-private-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.12.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-private-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.13.0/24'
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'myapp-subnet-private-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Elastic IPs for NAT Gateways
  NATGatewayEIPA:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-eip-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIPB:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-eip-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIPC:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-eip-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # NAT Gateways
  NATGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIPA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIPB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayC:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIPC.AllocationId
      SubnetId: !Ref PublicSubnetC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-natgw-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route Tables for Public Subnets
  PublicRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-public-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-public-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTableC:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-public-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Public Routes
  PublicRouteA:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTableA
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicRouteB:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTableB
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicRouteC:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTableC
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Route Tables for Private Subnets
  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-private-az-a-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-private-az-b-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTableC:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'myapp-rt-private-az-c-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Routes
  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayA

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayB

  PrivateRouteC:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableC
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGatewayC

  # Subnet Route Table Associations
  PublicSubnetRouteTableAssociationA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTableA

  PublicSubnetRouteTableAssociationB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTableB

  PublicSubnetRouteTableAssociationC:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetC
      RouteTableId: !Ref PublicRouteTableC

  PrivateSubnetRouteTableAssociationA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateSubnetRouteTableAssociationB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  PrivateSubnetRouteTableAssociationC:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetC
      RouteTableId: !Ref PrivateRouteTableC

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from anywhere'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-sg-alb-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
          Description: 'Allow SSH from restricted CIDR'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-sg-ec2-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS instance'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'Allow PostgreSQL from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub 'myapp-sg-rds-${EnvironmentSuffix}'
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Destination bucket (replica) for replication
  ApplicationBucketReplica:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'myapp-storage-replica-${EnvironmentSuffix}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3ReplicationKmsKey
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix


  ApplicationBucketReplicaPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationBucketReplica
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowReplicationFromSource
            Effect: Allow
            Principal:
              AWS: !GetAtt S3ReplicationRole.Arn
            Action:
              - 's3:ReplicateObject'
              - 's3:ReplicateDelete'
              - 's3:ReplicateTags'
            Resource: !Sub '${ApplicationBucketReplica.Arn}/*'

  # S3 source bucket with replication
  ApplicationBucket:
    Type: AWS::S3::Bucket
    DependsOn:
      - ApplicationBucketReplica
      - ApplicationBucketReplicaPolicy
    Properties:
      BucketName: !Sub 'myapp-storage-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled

      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Id: ReplicateAll
            Status: Enabled
            Priority: 1
            Filter: {}
            DeleteMarkerReplication:
              Status: Enabled
            SourceSelectionCriteria:
              SseKmsEncryptedObjects:
                Status: Enabled
            Destination:
              Bucket: !Sub 'arn:aws:s3:::myapp-storage-replica-${EnvironmentSuffix}'
              StorageClass: STANDARD_IA
              EncryptionConfiguration:
                ReplicaKmsKeyID: !GetAtt S3ReplicationKmsKey.Arn


      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: ReplicationDestinationRegion
          Value: !Ref DestinationBucketRegion

  ApplicationBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ApplicationBucket.Arn
              - !Sub '${ApplicationBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
  S3ReplicationKmsKey:
    Type: AWS::KMS::Key
    Properties:
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowRoot
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowS3ReplicationUse
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
            Resource: "*"
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3ReplicationKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/myapp-replication-key-${EnvironmentSuffix}
      TargetKeyId: !Ref S3ReplicationKmsKey


  ALBAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'myapp-alb-logs-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 30
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowALBAccessLogs
            Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::797873946194:root'  # ALB service account for us-west-2
            Action: 's3:PutObject'
            Resource: !Sub '${ALBAccessLogsBucket.Arn}/*'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'myapp-ec2-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub 'arn:aws:s3:::myapp-storage-${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::myapp-storage-${EnvironmentSuffix}'
        - PolicyName: SSMParameterAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/aws/service/*'
        - PolicyName: RDSIAMAuthAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds-db:connect'
                Resource: !Sub
                  - 'arn:aws:rds-db:${AWS::Region}:${AWS::AccountId}:dbuser:${DBResourceId}/${DBUser}'
                  - DBResourceId: !GetAtt DBInstance.DbiResourceId
                    DBUser: !Ref DBMasterUsername
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'myapp-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'myapp-s3-replication-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::myapp-storage-${EnvironmentSuffix}'
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub 'arn:aws:s3:::myapp-storage-${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource: !Sub 'arn:aws:s3:::myapp-storage-replica-${EnvironmentSuffix}/*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                Resource: !GetAtt S3ReplicationKmsKey.Arn

      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'myapp-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
        - !Ref PublicSubnetC
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBAccessLogsBucket
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'myapp-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template for Auto Scaling
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'myapp-lt-${EnvironmentSuffix}'
      LaunchTemplateData:
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: t3.micro
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${EnvironmentSuffix} - Instance $(ec2-metadata --instance-id | cut -d ' ' -f 2)</h1>" > /var/www/html/index.html
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'myapp-instance-${EnvironmentSuffix}'
              - Key: Project
                Value: CloudFormationChallenge
              - Key: Environment
                Value: !Ref EnvironmentSuffix

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'myapp-asg-${EnvironmentSuffix}'
      VPCZoneIdentifier:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
        - !Ref PublicSubnetC
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 5
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true

  # CloudWatch Alarms and Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'myapp-high-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Trigger scale up when CPU > 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'myapp-low-cpu-${EnvironmentSuffix}'
      AlarmDescription: 'Trigger scale down when CPU < 30%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # RDS Resources
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'myapp-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for RDS'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
        - !Ref PrivateSubnetC
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'myapp-db-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '14'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}::password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      EnableIAMDatabaseAuthentication: true
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix
  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'myapp-db-password-${EnvironmentSuffix}'
      Description: 'Master password for RDS'
      GenerateSecretString:
        SecretStringTemplate: '{"username":"dbadmin"}'
        GenerateStringKey: "password"
        PasswordLength: 16
        ExcludeCharacters: '"@/'   # simplified & YAML-safe
        ExcludePunctuation: true
      Tags:
        - Key: Project
          Value: CloudFormationChallenge
        - Key: Environment
          Value: !Ref EnvironmentSuffix


Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  ALBEndpoint:
    Description: 'Application Load Balancer DNS name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-endpoint'

  ApplicationBucketName:
    Description: 'Application S3 bucket name'
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-app-bucket'

  DBEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-db-endpoint'
```