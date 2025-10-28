```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete secure production environment with VPC, Auto Scaling, RDS, CloudTrail, and security best practices'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Project Configuration'
        Parameters:
          - ProjectName
          - Environment
          - OwnerEmail
      - Label:
          default: 'Network Configuration'
        Parameters:
          - AdminIPAddress
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBUsername
      - Label:
          default: 'EC2 Configuration'
        Parameters:
          - KeyPairName
          - LatestAmiId
      - Label:
          default: 'Security Configuration'
        Parameters:
          - EnableHTTPS
          - EnableAWSConfig
          - EnableCloudTrail
    ParameterLabels:
      ProjectName:
        default: 'Project Name'
      Environment:
        default: 'Environment Type'
      OwnerEmail:
        default: 'Owner Email Address'
      AdminIPAddress:
        default: 'Admin IP Address for SSH'
      DBUsername:
        default: 'Database Master Username'
      KeyPairName:
        default: 'EC2 Key Pair'
      LatestAmiId:
        default: 'Latest Amazon Linux 2 AMI'
      EnableHTTPS:
        default: 'Enable HTTPS (Requires DNS)'
      EnableAWSConfig:
        default: 'Enable AWS Config (1 per region limit)'
      EnableCloudTrail:
        default: 'Enable CloudTrail (5 trails per region limit)'

  TargetRegion: us-east-1

  Comments:
    RegionRequirement: 'This template is designed for deployment in US East (N. Virginia) - us-east-1 region'
    SecurityNote: 'Ensure AdminIPAddress parameter is updated with your actual IP address before deployment'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - production
      - staging
      - development
    Description: Environment name
  
  ProjectName:
    Type: String
    Default: turingproject
    Description: Project name for resource naming
  
  OwnerEmail:
    Type: String
    Default: owner@example.com
    Description: Email of the resource owner
  
  AdminIPAddress:
    Type: String
    Default: 10.0.0.1/32
    Description: IP address allowed for SSH access (MUST be changed to your actual IP before deployment)
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
  
  DBUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  KeyPairName:
    Type: String
    Default: ''
    Description: EC2 Key Pair for SSH access (optional - instances accessible via SSM Session Manager)

  EnableHTTPS:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable HTTPS with ACM certificate (requires DNS validation)

  EnableAWSConfig:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable AWS Config (only 1 Config recorder allowed per region per account)

  EnableCloudTrail:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Enable CloudTrail (limit of 5 trails per region per account)

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]
  UseHTTPS: !Equals [!Ref EnableHTTPS, 'true']
  UseAWSConfig: !Equals [!Ref EnableAWSConfig, 'true']
  UseCloudTrail: !Equals [!Ref EnableCloudTrail, 'true']

Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PrivateSubnet1:
      CIDR: 10.0.10.0/24
    PrivateSubnet2:
      CIDR: 10.0.11.0/24
    DatabaseSubnet1:
      CIDR: 10.0.20.0/24
    DatabaseSubnet2:
      CIDR: 10.0.21.0/24

Resources:
  # ==========================================
  # KMS Keys for Encryption
  # ==========================================
  
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting resources
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for CloudWatch Logs
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
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
          - Sid: Allow Auto Scaling to use the key for EBS volumes
            Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - autoscaling.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref KMSKey

  # ==========================================
  # Secrets Manager for DB Password
  # ==========================================

  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/db/password'
      Description: RDS database master password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # VPC and Network Configuration
  # ==========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  VPCFlowLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-vpc-flow-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 1
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  VPCFlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref VPCFlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt VPCFlowLogsBucket.Arn
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${VPCFlowLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'aws:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AllowSSLRequestsOnly
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt VPCFlowLogsBucket.Arn
              - !Sub '${VPCFlowLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    DependsOn: VPCFlowLogsBucketPolicy
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt VPCFlowLogsBucket.Arn
      LogFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc-flow-log'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-public1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-public2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-private1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-private2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-database1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, DatabaseSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-subnet-database2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # NAT Gateways for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rt-public'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rt-private1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  DatabaseSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-rt-private2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  DatabaseSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DatabaseSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==========================================
  # Security Groups
  # ==========================================
  
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AdminIPAddress
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sg-bastion'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
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
          Value: !Sub '${ProjectName}-${Environment}-sg-alb'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sg-ec2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sg-rds'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sg-lambda'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  
  EC2Role:
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/AmazonSSMPatchAssociation
      Policies:
        - PolicyName: EC2InstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParameterHistory'
                  - 'ssm:GetParametersByPath'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource:
                  - !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource:
                  - !GetAtt KMSKey.Arn
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource:
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${Environment}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # S3 Buckets
  # ==========================================
  
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-data'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Condition: UseCloudTrail
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-cloudtrail'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: RetentionPolicy
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: UseCloudTrail
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ==========================================
  # CloudTrail
  # ==========================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: UseCloudTrail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-trail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${S3Bucket.Arn}/'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # AWS Config
  # ==========================================
  
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: UseAWSConfig
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-config-recorder'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigRole:
    Condition: UseAWSConfig
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigS3Bucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ConfigS3Bucket.Arn}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Condition: UseAWSConfig
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-config'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ConfigS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: UseAWSConfig
    Properties:
      Bucket: !Ref ConfigS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigS3Bucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigS3Bucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Condition: UseAWSConfig
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-delivery-channel'
      S3BucketName: !Ref ConfigS3Bucket

  ConfigRuleEncryptedVolumes:
    Type: AWS::Config::ConfigRule
    Condition: UseAWSConfig
    DependsOn:
      - ConfigRecorder
      - DeliveryChannel
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks whether EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES

  ConfigRuleSecurityGroupSSHRestricted:
    Type: AWS::Config::ConfigRule
    Condition: UseAWSConfig
    DependsOn:
      - ConfigRecorder
      - DeliveryChannel
    Properties:
      ConfigRuleName: restricted-ssh
      Description: Checks whether security groups that are in use disallow unrestricted incoming SSH traffic
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED

  # ==========================================
  # Application Load Balancer
  # ==========================================
  
  ALBAccessLogsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-alb-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 1
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ALBAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::127311923021:root'
            Action: 's3:PutObject'
            Resource: !Sub '${ALBAccessLogsBucket.Arn}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ALBAccessLogsBucket.Arn

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: ALBAccessLogsBucketPolicy
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBAccessLogsBucket
        - Key: deletion_protection.enabled
          Value: 'false'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - !If
          - UseHTTPS
          - Type: redirect
            RedirectConfig:
              Protocol: HTTPS
              Port: 443
              StatusCode: HTTP_301
          - Type: forward
            TargetGroupArn: !Ref ALBTargetGroup

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: UseHTTPS
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      Certificates:
        - CertificateArn: !Ref Certificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  Certificate:
    Type: AWS::CertificateManager::Certificate
    Condition: UseHTTPS
    Properties:
      DomainName: !Sub '*.${AWS::AccountId}.example.com'
      DomainValidationOptions:
        - DomainName: !Sub '*.${AWS::AccountId}.example.com'
          ValidationDomain: example.com
      ValidationMethod: DNS
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # Launch Template and Auto Scaling Group
  # ==========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-lt'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            amazon-linux-extras install -y nginx1
            systemctl start nginx
            systemctl enable nginx

            # Create health check endpoint
            echo "OK" > /usr/share/nginx/html/health

            # Configure CloudWatch agent
            cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/nginx/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/ec2/nginx/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-volume'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Project
                Value: !Ref ProjectName

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 3
      MaxSize: 9
      DesiredCapacity: 3
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-asg-instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true

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

  # ==========================================
  # CloudWatch Alarms
  # ==========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-high-cpu'
      AlarmDescription: Alarm when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-low-cpu'
      AlarmDescription: Alarm when CPU is below 20%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  UnexpectedScalingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-unexpected-scaling'
      AlarmDescription: Alert on unexpected scaling events
      MetricName: GroupDesiredCapacity
      Namespace: AWS/AutoScaling
      Statistic: Average
      Period: 60
      EvaluationPeriods: 1
      Threshold: 6
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref SNSTopic

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-alerts'
      DisplayName: Production Environment Alerts
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref OwnerEmail
          Protocol: email

  # ==========================================
  # RDS Database
  # ==========================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}-db'
      DBInstanceClass: db.t3.medium
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      EnableIAMDatabaseAuthentication: true
      DBParameterGroupName: !Ref RDSDBParameterGroup
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  RDSDBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub 'DB Parameter Group for ${ProjectName}-${Environment}'
      Family: mysql8.0
      Parameters:
        require_secure_transport: '1'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # Bastion Host
  # ==========================================
  
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 10
            VolumeType: gp3
            DeleteOnTermination: true
      MetadataOptions:
        HttpTokens: required
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bastion'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # Systems Manager Parameter Store
  # ==========================================
  
  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${Environment}/db/endpoint'
      Type: String
      Value: !GetAtt RDSDatabase.Endpoint.Address
      Description: RDS endpoint
      Tags:
        Environment: !Ref Environment
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  # ==========================================
  # Lambda Function Example
  # ==========================================
  
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DB_ENDPOINT_PARAM: !Sub '/${ProjectName}/${Environment}/db/endpoint'
          DB_PASSWORD_PARAM: !Sub '/${ProjectName}/${Environment}/db/password'
          ENVIRONMENT: !Ref Environment
      KmsKeyArn: !GetAtt KMSKey.Arn
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          
          def lambda_handler(event, context):
              ssm = boto3.client('ssm')
              
              # Example of retrieving encrypted parameters
              db_endpoint = ssm.get_parameter(
                  Name=os.environ['DB_ENDPOINT_PARAM'],
                  WithDecryption=True
              )['Parameter']['Value']
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Lambda function executed successfully',
                      'environment': os.environ['ENVIRONMENT']
                  })
              }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # CloudFront Distribution
  # ==========================================
  
  CloudFrontLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-cloudfront-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub '${ProjectName}-${Environment} CloudFront Distribution'
        Logging:
          Bucket: !GetAtt CloudFrontLogsBucket.DomainName
          Prefix: cloudfront/
          IncludeCookies: false
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
            Headers:
              - Authorization
              - CloudFront-Forwarded-Proto
              - Host
        CacheBehaviors:
          - PathPattern: '/static/*'
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${ProjectName}-${Environment}'

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}'
            Action: 's3:GetObject'
            Resource: !Sub '${S3Bucket.Arn}/*'

  # ==========================================
  # Patch Management
  # ==========================================
  
  PatchBaseline:
    Type: AWS::SSM::PatchBaseline
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-patch-baseline'
      Description: Patch baseline for EC2 instances
      OperatingSystem: AMAZON_LINUX_2
      PatchGroups:
        - !Sub '${ProjectName}-${Environment}'
      ApprovalRules:
        PatchRules:
          - PatchFilterGroup:
              PatchFilters:
                - Key: PRODUCT
                  Values:
                    - '*'
                - Key: CLASSIFICATION
                  Values:
                    - Security
                    - Bugfix
                - Key: SEVERITY
                  Values:
                    - Critical
                    - Important
            ApproveAfterDays: 0
            ComplianceLevel: HIGH
            EnableNonSecurity: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  MaintenanceWindow:
    Type: AWS::SSM::MaintenanceWindow
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-maintenance-window'
      Description: Maintenance window for patching
      Duration: 4
      Cutoff: 1
      Schedule: 'cron(0 2 ? * SUN *)'
      AllowUnassociatedTargets: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  MaintenanceWindowTarget:
    Type: AWS::SSM::MaintenanceWindowTarget
    Properties:
      WindowId: !Ref MaintenanceWindow
      Name: !Sub '${ProjectName}-${Environment}-patch-targets'
      Description: EC2 instances to patch
      ResourceType: INSTANCE
      Targets:
        - Key: tag:Environment
          Values:
            - !Ref Environment
        - Key: tag:Project
          Values:
            - !Ref ProjectName

  MaintenanceWindowTask:
    Type: AWS::SSM::MaintenanceWindowTask
    Properties:
      WindowId: !Ref MaintenanceWindow
      Targets:
        - Key: WindowTargetIds
          Values:
            - !Ref MaintenanceWindowTarget
      TaskType: RUN_COMMAND
      TaskArn: AWS-RunPatchBaseline
      ServiceRoleArn: !GetAtt MaintenanceWindowRole.Arn
      Priority: 1
      MaxConcurrency: '50%'
      MaxErrors: '0'
      TaskInvocationParameters:
        MaintenanceWindowRunCommandParameters:
          Parameters:
            Operation:
              - Install

  MaintenanceWindowRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ssm.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # Backup Configuration
  # ==========================================
  
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${ProjectName}-${Environment}-backup-vault'
      EncryptionKeyArn: !GetAtt KMSKey.Arn
      BackupVaultTags:
        Environment: !Ref Environment
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${ProjectName}-${Environment}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: 'cron(0 5 ? * * *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 365
              MoveToColdStorageAfterDays: 90
            RecoveryPointTags:
              Environment: !Ref Environment
              Owner: !Ref OwnerEmail
              Project: !Ref ProjectName
      BackupPlanTags:
        Environment: !Ref Environment
        Owner: !Ref OwnerEmail
        Project: !Ref ProjectName

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub '${ProjectName}-${Environment}-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: Environment
            ConditionValue: !Ref Environment
          - ConditionType: STRINGEQUALS
            ConditionKey: Project
            ConditionValue: !Ref ProjectName
        Resources:
          - !Sub 'arn:aws:rds:*:${AWS::AccountId}:db:*'
          - !Sub 'arn:aws:ec2:*:${AWS::AccountId}:volume/*'

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Project
          Value: !Ref ProjectName

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-DNS'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  BastionHostPublicIP:
    Description: Bastion Host Public IP
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-IP'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  KMSKeyId:
    Description: KMS Key ID
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  CloudTrailName:
    Condition: UseCloudTrail
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'

  SNSTopicArn:
    Description: SNS Topic ARN for Alerts
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
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

  DatabaseSubnet1Id:
    Description: Database Subnet 1 ID
    Value: !Ref DatabaseSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet1'

  DatabaseSubnet2Id:
    Description: Database Subnet 2 ID
    Value: !Ref DatabaseSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseSubnet2'

  ALBSecurityGroupId:
    Description: ALB Security Group ID
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG'

  EC2SecurityGroupId:
    Description: EC2 Security Group ID
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SG'

  RDSSecurityGroupId:
    Description: RDS Security Group ID
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-RDS-SG'

  LambdaSecurityGroupId:
    Description: Lambda Security Group ID
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-SG'

  BastionSecurityGroupId:
    Description: Bastion Security Group ID
    Value: !Ref BastionSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-SG'

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG'

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplate'

  ALBTargetGroupArn:
    Description: ALB Target Group ARN
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TargetGroup'

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  LambdaFunctionName:
    Description: Lambda Function Name
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Name'

  EC2RoleArn:
    Description: EC2 Instance Role ARN
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Role'

  LambdaRoleArn:
    Description: Lambda Execution Role ARN
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Role'

  CloudTrailS3Bucket:
    Condition: UseCloudTrail
    Description: CloudTrail S3 Bucket Name
    Value: !Ref CloudTrailS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'

  ConfigS3Bucket:
    Condition: UseAWSConfig
    Description: AWS Config S3 Bucket Name
    Value: !Ref ConfigS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-Config-Bucket'

  VPCFlowLogsBucket:
    Description: VPC Flow Logs S3 Bucket Name
    Value: !Ref VPCFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-Bucket'

  ALBAccessLogsBucket:
    Description: ALB Access Logs S3 Bucket Name
    Value: !Ref ALBAccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ALB-Logs-Bucket'

  DBSubnetGroupName:
    Description: RDS DB Subnet Group Name
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-DB-SubnetGroup'

  RDSInstanceId:
    Description: RDS Instance Identifier
    Value: !Ref RDSDatabase
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Instance'

  BackupVaultName:
    Description: Backup Vault Name
    Value: !Ref BackupVault
    Export:
      Name: !Sub '${AWS::StackName}-BackupVault'

  NATGateway1Id:
    Description: NAT Gateway 1 ID
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NAT1'

  NATGateway2Id:
    Description: NAT Gateway 2 ID
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NAT2'

  InternetGatewayId:
    Description: Internet Gateway ID
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW'

  DBPasswordSecretArn:
    Description: Database Password Secret ARN
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret'

  SSMDBEndpointParameter:
    Description: SSM Parameter for DB Endpoint
    Value: !Ref DBEndpointParameter
    Export:
      Name: !Sub '${AWS::StackName}-SSM-DB-Endpoint'

```