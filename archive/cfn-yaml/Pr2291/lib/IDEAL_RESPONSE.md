```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-region infrastructure with production-ready security controls and Customer Managed KMS Keys'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentName
          - ProjectName
      - Label:
          default: 'Network CIDR'
        Parameters:
          - VPCCidrUSEast1
          - VPCCidrEUCentral1
      - Label:
          default: 'Instance Types'
        Parameters:
          - RDSInstanceType
          - EC2InstanceType
      - Label:
          default: 'KMS Key Configuration'
        Parameters:
          - EnableKeyRotation

Parameters:
  ProjectName:
    Type: String
    Default: 'multi-region-secure-app'
    Description: 'Name of the project for resource naming and tagging'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  EnvironmentName:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VPCCidrUSEast1:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC in us-east-1

  VPCCidrEUCentral1:
    Type: String
    Default: '10.1.0.0/16'
    Description: CIDR block for VPC in eu-central-1

  RDSInstanceType:
    Type: String
    Default: db.m5.large
    AllowedValues:
      - db.m5.large
      - db.m5.xlarge
    Description: RDS instance type

  EC2InstanceType:
    Type: String
    Default: t3.medium
    Description: EC2 instance type

  EnableKeyRotation:
    Type: String
    Default: true
    AllowedValues: [true, false]
    Description: Enable automatic key rotation for KMS keys

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
      AZ1: us-east-1a
      AZ2: us-east-1b
    eu-central-1:
      AMI: ami-0d527b8c289b4af7f
      AZ1: eu-central-1a
      AZ2: eu-central-1b

Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']

Resources:
  # Customer Managed KMS Key for Infrastructure
  InfrastructureKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Customer Managed KMS Key for ${ProjectName} Infrastructure - ${AWS::Region}'
      KeyUsage: ENCRYPT_DECRYPT
      KeySpec: SYMMETRIC_DEFAULT
      EnableKeyRotation: !Ref EnableKeyRotation
      MultiRegion: false
      Origin: AWS_KMS
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Root access for account administration
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

          # CloudFormation service access
          - Sid: Allow CloudFormation Service
            Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: '*'

          # CloudTrail service access
          - Sid: Allow CloudTrail Service
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:ListGrants
              - kms:RevokeGrant
            Resource: '*'

          # RDS service access for database encryption
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:ListGrants
              - kms:RevokeGrant
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'rds.${AWS::Region}.amazonaws.com'

          # S3 service access for bucket encryption
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'

          # EBS service access for volume encryption
          - Sid: Allow EBS Service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:ListGrants
              - kms:RevokeGrant
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'ec2.${AWS::Region}.amazonaws.com'

          # CloudWatch Logs service access
          - Sid: Allow CloudWatch Logs Service
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
            Resource: '*'

          # Application Auto Scaling service access
          - Sid: Allow Application Auto Scaling Service
            Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'

      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-infrastructure-kms-key-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'
        - Key: KeyType
          Value: CustomerManaged
        - Key: Purpose
          Value: Infrastructure-Encryption

  # KMS Key Alias
  InfrastructureKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}-infrastructure-key-${AWS::Region}'
      TargetKeyId: !Ref InfrastructureKMSKey

  # VPC Configuration
  VPCProd:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !If
        - IsUSEast1
        - !Ref VPCCidrUSEast1
        - !Ref VPCCidrEUCentral1
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-prod-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-prod-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPCProd

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.1.0/24'
        - '10.1.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.2.0/24'
        - '10.1.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.3.0/24'
        - '10.1.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPCProd
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      CidrBlock: !If
        - IsUSEast1
        - '10.0.4.0/24'
        - '10.1.4.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-1-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-2-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-1-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-2-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPCProd
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-2-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'web-server-sg-${AWS::Region}'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'web-server-sg-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'database-sg-${AWS::Region}'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'database-sg-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ecs-sg-${AWS::Region}'
      GroupDescription: Security group for ECS services
      VpcId: !Ref VPCProd
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'ecs-sg-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ec2-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::prod-application-${AWS::Region}-${AWS::AccountId}/*'
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                  - kms:Encrypt
                  - kms:GenerateDataKey*
                  - kms:ReEncrypt*
                Resource: !GetAtt InfrastructureKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ecs-execution-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt InfrastructureKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-ecs-task-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                  - kms:Encrypt
                  - kms:GenerateDataKey*
                  - kms:ReEncrypt*
                Resource: !GetAtt InfrastructureKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  RDSRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-rds-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'role-cloudtrail-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                  - logs:DescribeLogGroups
                Resource:
                  - !Sub '${CloudTrailLogGroup.Arn}'
                  - !Sub '${CloudTrailLogGroup.Arn}:*'
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                  - kms:Encrypt
                  - kms:GenerateDataKey*
                  - kms:ReEncrypt*
                Resource: !GetAtt InfrastructureKMSKey.Arn

      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # S3 Buckets
  ApplicationBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'prod-application-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-application-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'prod-logging-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-logging-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  BackupBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'prod-backup-${AWS::Region}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-backup-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudTrail S3 Bucket Policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${LoggingBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'db-subnet-group-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # RDS Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'prod-db-${AWS::Region}'
      DBInstanceClass: !Ref RDSInstanceType
      Engine: mysql
      EngineVersion: '8.0.43'
      AllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref InfrastructureKMSKey
      MasterUsername: admin
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'prod-db-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'prod-cluster-${AWS::Region}'
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: !Sub 'prod-cluster-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Task Definition
  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'prod-task-${AWS::Region}'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: 256
      Memory: 512
      ExecutionRoleArn: !GetAtt ECSTaskExecutionRole.Arn
      TaskRoleArn: !GetAtt ECSTaskRole.Arn
      ContainerDefinitions:
        - Name: web-container
          Image: nginx:latest
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref ECSLogGroup
              awslogs-region: !Ref 'AWS::Region'
              awslogs-stream-prefix: ecs
          Essential: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-task-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ECS Service
  ECSService:
    Type: AWS::ECS::Service
    DependsOn: ALBListener
    Properties:
      ServiceName: !Sub 'prod-service-${AWS::Region}'
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref ECSTaskDefinition
      LaunchType: FARGATE
      DesiredCount: 2
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ECSSecurityGroup
          Subnets:
            - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
          AssignPublicIp: DISABLED
      LoadBalancers:
        - ContainerName: web-container
          ContainerPort: 80
          TargetGroupArn: !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub 'prod-service-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # Auto Scaling Target
  ECSAutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    DependsOn: ALBListener
    Properties:
      MaxCapacity: 10
      MinCapacity: 2
      ResourceId: !Sub 'service/${ECSCluster}/${ECSService.Name}'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService'
      ScalableDimension: ecs:service:DesiredCount
      ServiceNamespace: ecs

  # Auto Scaling Policy - CPU
  ECSAutoScalingPolicyCPU:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'ecs-cpu-scaling-${AWS::Region}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        TargetValue: 70.0
        ScaleOutCooldown: 300
        ScaleInCooldown: 300

  # Auto Scaling Policy - Queue Depth (ALB Target Group)
  ECSAutoScalingPolicyQueue:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub 'ecs-queue-scaling-${AWS::Region}'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ECSAutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ALBRequestCountPerTarget
          ResourceLabel: !Sub '${ApplicationLoadBalancer.LoadBalancerFullName}/${ALBTargetGroup.TargetGroupFullName}'
        TargetValue: 100.0
        ScaleOutCooldown: 300
        ScaleInCooldown: 300

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'prod-alb-${AWS::Region}'
      Scheme: internal
      Type: application
      SecurityGroups:
        - !Ref WebServerSecurityGroup
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'prod-alb-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ALB Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'prod-tg-${AWS::Region}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPCProd
      TargetType: ip
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: !Sub 'prod-tg-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref EC2InstanceType
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      SubnetId: !Ref PrivateSubnet1
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref InfrastructureKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
      Tags:
        - Key: Name
          Value: !Sub 'web-server-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Log Groups
  ECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/ecs/prod-task-${AWS::Region}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt InfrastructureKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'ecs-logs-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/prod-trail-${AWS::Region}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt InfrastructureKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'cloudtrail-logs-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'prod-trail-${AWS::Region}'
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: !Sub 'cloudtrail-logs/${AWS::Region}'
      KMSKeyId: !GetAtt InfrastructureKMSKey.Arn
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub 'arn:aws:s3:::${ApplicationBucket}/*'
                - !Sub 'arn:aws:s3:::${BackupBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub 'prod-trail-${AWS::Region}'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Alarms - EC2
  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'EC2-HighCPU-${AWS::Region}'
      AlarmDescription: 'Alarm for high EC2 CPU utilization'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Alarms - RDS
  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RDS-HighCPU-${AWS::Region}'
      AlarmDescription: 'Alarm for high RDS CPU utilization'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  RDSConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RDS-HighConnections-${AWS::Region}'
      AlarmDescription: 'Alarm for high RDS database connections'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  # CloudWatch Alarms - ECS
  ECSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ECS-HighCPU-${AWS::Region}'
      AlarmDescription: 'Alarm for high ECS CPU utilization'
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !Sub 'prod-service-${AWS::Region}'
        - Name: ClusterName
          Value: !Sub 'prod-cluster-${AWS::Region}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

  ECSMemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ECS-HighMemory-${AWS::Region}'
      AlarmDescription: 'Alarm for high ECS memory utilization'
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ServiceName
          Value: !Sub 'prod-service-${AWS::Region}'
        - Name: ClusterName
          Value: !Sub 'prod-cluster-${AWS::Region}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Region
          Value: !Ref 'AWS::Region'

Outputs:
  InfrastructureKMSKeyId:
    Description: Infrastructure KMS Key ID
    Value: !Ref InfrastructureKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  InfrastructureKMSKeyArn:
    Description: Infrastructure KMS Key ARN
    Value: !GetAtt InfrastructureKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  InfrastructureKMSKeyAlias:
    Description: Infrastructure KMS Key Alias
    Value: !Ref InfrastructureKMSKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-Alias'

  VPCId:
    Description: VPC ID
    Value: !Ref VPCProd
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnet-2-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnet-2-ID'

  WebServerSecurityGroupId:
    Description: Web Server Security Group ID
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG-ID'

  DatabaseSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Database-SG-ID'

  ECSSecurityGroupId:
    Description: ECS Security Group ID
    Value: !Ref ECSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ECS-SG-ID'

  ApplicationBucketName:
    Description: Application S3 Bucket Name
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-Application-Bucket'

  LoggingBucketName:
    Description: Logging S3 Bucket Name
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-Logging-Bucket'

  BackupBucketName:
    Description: Backup S3 Bucket Name
    Value: !Ref BackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-Backup-Bucket'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  ECSClusterName:
    Description: ECS Cluster Name
    Value: !Ref ECSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ECS-Cluster'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  EC2InstanceId:
    Description: EC2 Instance ID
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance-ID'
```
