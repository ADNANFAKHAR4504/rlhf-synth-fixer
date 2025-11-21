```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Compliant E-Commerce Cloud Environment'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name

  EnvironmentSuffix:
    Type: String
    Default: production
    Description: Short suffix to append to resource names to keep them unique (e.g. dev, staging, prod)

  OwnerEmail:
    Type: String
    Default: admin@example.com
    Description: Owner email for tagging

  DBUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    Description: Database admin username

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

  CreateConfigDeliveryChannel:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Whether to create the AWS Config DeliveryChannel. Set to 'false' if one exists in the account/region.

  CreateConfigRecorder:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Whether to create the AWS Config ConfigurationRecorder. Set to 'false' if one exists in the account/region.

Mappings:
  # AWS ELB Account IDs by region - needed for ALB access logging
  RegionToELBAccountId:
    us-east-1:
      AccountId: "127311923021"
    us-east-2:
      AccountId: "033677994240"
    us-west-1:
      AccountId: "027434742980"
    us-west-2:
      AccountId: "797873946194"
    af-south-1:
      AccountId: "098369216593"
    ca-central-1:
      AccountId: "985666609251"
    eu-central-1:
      AccountId: "054676820928"
    eu-west-1:
      AccountId: "156460612806"
    eu-west-2:
      AccountId: "652711504416"
    eu-west-3:
      AccountId: "009996457667"
    eu-north-1:
      AccountId: "897822967062"
    eu-south-1:
      AccountId: "635631232127"
    ap-east-1:
      AccountId: "754344448648"
    ap-northeast-1:
      AccountId: "582318560864"
    ap-northeast-2:
      AccountId: "600734575887"
    ap-northeast-3:
      AccountId: "383597477331"
    ap-southeast-1:
      AccountId: "114774131450"
    ap-southeast-2:
      AccountId: "783225319266"
    ap-southeast-3:
      AccountId: "589379963580"
    ap-south-1:
      AccountId: "718504428378"
    me-south-1:
      AccountId: "076674570225"
    sa-east-1:
      AccountId: "507241528517"

Conditions:
  CreateConfigDeliveryChannelCondition: !Equals [ !Ref CreateConfigDeliveryChannel, 'true' ]
  CreateConfigRecorderCondition: !Equals [ !Ref CreateConfigRecorder, 'true' ]
  CreateConfigDeliveryChannelAndRecorderCondition: !And [ !Condition CreateConfigDeliveryChannelCondition, !Condition CreateConfigRecorderCondition ]

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Environment Configuration
        Parameters:
          - Environment
          - OwnerEmail
      - Label:
          default: Security Configuration
        Parameters:
          - DBUsername

Resources:
  # ==================== EC2 Key Pair ====================
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub 'ecommerce-keypair-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-SSH

  # ==================== KMS Keys ====================
  MasterKMSKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: Master KMS key for E-Commerce encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - logs.amazonaws.com
                - rds.amazonaws.com
                - cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Encryption

  MasterKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/ecommerce-${EnvironmentSuffix}'
      TargetKeyId: !Ref MasterKMSKey

  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'ECommerce-VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Network

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Public-Subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-PublicSubnet

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'Public-Subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-PublicSubnet

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub 'Private-Subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-PrivateSubnet

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub 'Private-Subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-PrivateSubnet

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'ECommerce-IGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Gateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'NAT-EIP-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-NAT

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'NAT-EIP-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-NAT

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'NAT-Gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-NAT

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'NAT-Gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-NAT

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Public-Routes-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Routing

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
          Value: !Sub 'Private-Routes-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Routing

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

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Private-Routes-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Routing

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

  # ==================== Security Groups ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from Internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from Internet (will redirect to HTTPS)
      Tags:
        - Key: Name
          Value: !Sub 'ALB-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Security

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH from within VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to Internet
      Tags:
        - Key: Name
          Value: !Sub 'WebServer-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Security

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'Database-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Security

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS to Internet
      Tags:
        - Key: Name
          Value: !Sub 'Lambda-SG-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Security

  # Security Group Rules (added separately to avoid circular dependencies)
  ALBToWebServerEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref ALBSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      DestinationSecurityGroupId: !Ref WebServerSecurityGroup
      Description: HTTP to web servers

  WebServerFromALBIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: HTTP from ALB

  WebServerToDatabaseEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref WebServerSecurityGroup
      IpProtocol: tcp
      FromPort: 5432
      ToPort: 5432
      DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
      Description: PostgreSQL to RDS

  DatabaseFromWebServerIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref DatabaseSecurityGroup
      IpProtocol: tcp
      FromPort: 5432
      ToPort: 5432
      SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Description: PostgreSQL from web servers

  LambdaToDatabaseEgress:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref LambdaSecurityGroup
      IpProtocol: tcp
      FromPort: 5432
      ToPort: 5432
      DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
      Description: PostgreSQL to RDS

  DatabaseFromLambdaIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref DatabaseSecurityGroup
      IpProtocol: tcp
      FromPort: 5432
      ToPort: 5432
      SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Description: PostgreSQL from Lambda

  # ==================== S3 Buckets ====================
  S3LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'ecommerce-logging-${EnvironmentSuffix}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
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
        - Key: Purpose
          Value: E-Commerce-Logging

  S3LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${S3LoggingBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt S3LoggingBucket.Arn
          - Sid: ELBAccessLogsPolicy
            Effect: Allow
            Principal:
              AWS: !Sub
                - 'arn:aws:iam::${AccountId}:root'
                - AccountId: !FindInMap [RegionToELBAccountId, !Ref 'AWS::Region', AccountId]
            Action: 's3:PutObject'
            Resource: !Sub '${S3LoggingBucket.Arn}/*'

  S3ApplicationBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'ecommerce-app-${EnvironmentSuffix}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LoggingBucket
        LogFilePrefix: app-bucket/
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Application

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3ApplicationBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt S3ApplicationBucket.Arn
              - !Sub '${S3ApplicationBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==================== CloudTrail ====================
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'ecommerce-trail-${EnvironmentSuffix}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
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
        - Key: Purpose
          Value: E-Commerce-Audit

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub 'ECommerce-Trail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Audit

  # ==================== AWS Config ====================
  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'ecommerce-config-${EnvironmentSuffix}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref MasterKMSKey
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
        - Key: Purpose
          Value: E-Commerce-Config

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigRecorderRole:
    Type: AWS::IAM::Role
    Condition: CreateConfigRecorderCondition
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Config

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn:
      - ConfigBucketPolicy
    Condition: CreateConfigRecorderCondition
    Properties:
      Name: !Sub 'ECommerce-Recorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigRecorderRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    # Only create delivery channel if both delivery channel creation is requested and recorder creation is enabled
    Condition: CreateConfigDeliveryChannelAndRecorderCondition
    Properties:
      Name: !Sub 'ECommerce-DeliveryChannel-${EnvironmentSuffix}'
      S3BucketName: !Ref ConfigBucket

  # ==================== IAM Roles and Policies ====================
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
      Policies:
        - PolicyName: EC2S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt MasterKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/ecommerce/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBSecret
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-IAM

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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3ApplicationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt MasterKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/ecommerce/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBSecret
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-IAM

  MFAEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub 'RequireMFA-${EnvironmentSuffix}'
      Description: Enforces MFA for IAM users
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # ==================== Secrets Manager ====================
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '/ecommerce/database/credentials-${EnvironmentSuffix}'
      Description: RDS Database Credentials with auto-generated password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Config

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: S3LoggingBucketPolicy
    Properties:
      Name: !Sub 'ECommerce-ALB-${EnvironmentSuffix}'
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
          Value: !Ref S3LoggingBucket
        - Key: access_logs.s3.prefix
          Value: alb-logs
        - Key: deletion_protection.enabled
          Value: 'false'
        - Key: idle_timeout.timeout_seconds
          Value: '60'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-LoadBalancer

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'ECommerce-TG-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-TargetGroup

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Note: You'll need to import or create an SSL certificate in ACM
  # For now, using HTTP to HTTPS redirect only
  # HTTPSListener:
  #   Type: AWS::ElasticLoadBalancingV2::Listener
  #   Properties:
  #     LoadBalancerArn: !Ref ApplicationLoadBalancer
  #     Port: 443
  #     Protocol: HTTPS
  #     Certificates:
  #       - CertificateArn: !Ref ACMCertificate
  #     DefaultActions:
  #       - Type: forward
  #         TargetGroupArn: !Ref ALBTargetGroup

  # ==================== WAF ====================
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'ECommerce-WebACL-${EnvironmentSuffix}'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputsRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'ECommerce-WebACL-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-WAF

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebACL.Arn

  # ==================== Launch Template ====================
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'ECommerce-LT-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        KeyName: !Ref EC2KeyPair
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            set -euo pipefail
            yum update -y
            yum install -y python3 python3-pip awscli amazon-cloudwatch-agent

            pip3 install --upgrade pip
            pip3 install boto3 psycopg2-binary

            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
            {
              "metrics": {
                "namespace": "ECommerce/${EnvironmentSuffix}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                      {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": [
                      {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/ecommerce/${EnvironmentSuffix}",
                        "log_stream_name": "{instance_id}/messages"
                      },
                      {
                        "file_path": "/home/ec2-user/server.log",
                        "log_group_name": "/aws/ec2/ecommerce/${EnvironmentSuffix}",
                        "log_stream_name": "{instance_id}/server"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config -m ec2 \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

            cat > /home/ec2-user/server.py <<'EOF'
            import http.server
            import socketserver
            import json
            import os
            import boto3
            import psycopg2
            import json

            ENVIRONMENT = os.environ.get("ENVIRONMENT", "production")
            AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
            DB_SECRET_ARN = os.environ.get("DB_SECRET_ARN", "")
            DB_ENDPOINT_PARAMETER = os.environ.get("DB_ENDPOINT_PARAMETER", "/ecommerce/database/endpoint")
            S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")

            ssm = boto3.client("ssm", region_name=AWS_REGION)
            secrets = boto3.client("secretsmanager", region_name=AWS_REGION)
            s3 = boto3.client("s3", region_name=AWS_REGION)

            def get_db_connection():
                endpoint = ssm.get_parameter(Name=DB_ENDPOINT_PARAMETER)["Parameter"]["Value"]
                secret_value = secrets.get_secret_value(SecretId=DB_SECRET_ARN)
                secret = json.loads(secret_value["SecretString"])
                return psycopg2.connect(
                    host=endpoint,
                    user=secret["username"],
                    password=secret["password"],
                    dbname="postgres",
                    connect_timeout=5,
                    sslmode="require"
                )

            class Handler(http.server.SimpleHTTPRequestHandler):
                def do_GET(self):
                    if self.path == "/":
                        self.send_response(200)
                        self.send_header("Content-type", "text/html")
                        self.end_headers()
                        html = f"<h1>E-Commerce Application ({ENVIRONMENT})</h1>" \
                               "<p><a href='/health'>Health Check</a> | <a href='/db-test'>Database Test</a> | <a href='/s3-test'>S3 Test</a></p>"
                        self.wfile.write(html.encode())
                    elif self.path == "/health":
                        self.send_response(200)
                        self.send_header("Content-type", "application/json")
                        self.end_headers()
                        response = {"status": "healthy", "service": "python-server", "environment": ENVIRONMENT}
                        self.wfile.write(json.dumps(response).encode())
                    elif self.path.startswith("/db-test"):
                        self.handle_db_test()
                    elif self.path.startswith("/s3-test"):
                        self.handle_s3_test()
                    else:
                        super().do_GET()

                def handle_db_test(self):
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    try:
                        connection = get_db_connection()
                        cursor = connection.cursor()
                        cursor.execute("SELECT 1")
                        cursor.fetchone()
                        cursor.close()
                        connection.close()
                        response = {
                            "status": "success",
                            "message": "Database connection successful"
                        }
                    except Exception as error:
                        response = {
                            "status": "error",
                            "message": f"{error}"
                        }
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode())

                def handle_s3_test(self):
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    try:
                        if not S3_BUCKET_NAME:
                            raise Exception("S3_BUCKET_NAME environment variable not set")
                        
                        # Test file upload
                        test_key = "health-check/test-file.txt"
                        test_content = "E-Commerce health check test file"
                        
                        s3.put_object(
                            Bucket=S3_BUCKET_NAME,
                            Key=test_key,
                            Body=test_content.encode('utf-8')
                        )
                        
                        # Test file download
                        s3_response = s3.get_object(Bucket=S3_BUCKET_NAME, Key=test_key)
                        downloaded_content = s3_response['Body'].read().decode('utf-8')
                        
                        # Verify content matches
                        if downloaded_content == test_content:
                            response = {
                                "status": "success",
                                "message": "S3 upload and download successful",
                                "bucket": S3_BUCKET_NAME,
                                "test_key": test_key
                            }
                        else:
                            response = {
                                "status": "error",
                                "message": "Content mismatch between upload and download"
                            }
                    except Exception as error:
                        response = {
                            "status": "error",
                            "message": f"S3 operation failed: {error}"
                        }
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode())

            if __name__ == "__main__":
                PORT = 80
                with socketserver.TCPServer(("", PORT), Handler) as httpd:
                    print(f"Server running on port {PORT}")
                    httpd.serve_forever()
            EOF

            chown ec2-user:ec2-user /home/ec2-user/server.py
            chmod +x /home/ec2-user/server.py

            REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
            export ENVIRONMENT="${EnvironmentSuffix}"
            export AWS_DEFAULT_REGION=$REGION
            export DB_SECRET_ARN="${DBSecret}"
            export DB_ENDPOINT_PARAMETER="/ecommerce/database/endpoint"
            export S3_BUCKET_NAME="${S3ApplicationBucket}"

            nohup python3 /home/ec2-user/server.py > /home/ec2-user/server.log 2>&1 &
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'ECommerce-Instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Purpose
                Value: E-Commerce-Compute
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'ECommerce-Volume-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref OwnerEmail
              - Key: Purpose
                Value: E-Commerce-Storage

  # ==================== Auto Scaling Group ====================
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
    Properties:
      AutoScalingGroupName: !Sub 'ECommerce-ASG-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      MetricsCollection:
        - Granularity: 1Minute
      Tags:
        - Key: Name
          Value: !Sub 'ECommerce-ASG-Instance-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerEmail
          PropagateAtLaunch: true
        - Key: Purpose
          Value: E-Commerce-AutoScale
          PropagateAtLaunch: true

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 600
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 600
      ScalingAdjustment: -1

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up if CPU > 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      AlarmActions:
        - !Ref ScaleUpPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: GreaterThanThreshold

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down if CPU < 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      AlarmActions:
        - !Ref ScaleDownPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: LessThanThreshold

  # ==================== RDS Database ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'ECommerce-DBSubnet-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Database

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'ecommerce-db-${EnvironmentSuffix}'
      DBName: ecommercedb
      Engine: postgres
      EngineVersion: '15.14'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: 100
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref MasterKMSKey
      MultiAZ: true
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      PubliclyAccessible: false
      DeletionProtection: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Database

  DBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /ecommerce/database/endpoint
      Type: String
      Value: !GetAtt RDSDatabase.Endpoint.Address
      Description: RDS Database Endpoint
      Tags:
        Environment: !Ref Environment
        Owner: !Ref OwnerEmail
        Purpose: E-Commerce-Config

  # ==================== Lambda Function ====================
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/lambda/ECommerce-Function-${EnvironmentSuffix}'
      RetentionInDays: 30

  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub 'ECommerce-Function-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import logging
          import os

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Received event: {json.dumps(event)}")

              response = {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'E-Commerce Lambda Function',
                      'environment': os.environ.get('ENVIRONMENT', 'Unknown')
                  })
              }

              logger.info(f"Response: {json.dumps(response)}")
              return response
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          DB_ENDPOINT: !GetAtt RDSDatabase.Endpoint.Address
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Timeout: 60
      MemorySize: 256
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: Purpose
          Value: E-Commerce-Lambda

  # ==================== CloudWatch Log Groups ====================
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/ec2/ecommerce/${EnvironmentSuffix}'
      RetentionInDays: 30

  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/rds/instance/ecommerce-db-${EnvironmentSuffix}/postgresql'
      RetentionInDays: 30

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub 'ECommerce-VPC-${EnvironmentSuffix}'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub 'ECommerce-ALB-${EnvironmentSuffix}'

  S3ApplicationBucketName:
    Description: S3 Application Bucket Name
    Value: !Ref S3ApplicationBucket
    Export:
      Name: !Sub 'ECommerce-S3App-${EnvironmentSuffix}'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub 'ECommerce-RDS-${EnvironmentSuffix}'

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub 'ECommerce-Lambda-${EnvironmentSuffix}'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub 'ECommerce-Trail-${EnvironmentSuffix}'

  ConfigRecorderName:
    Description: AWS Config Recorder Name
    Condition: CreateConfigRecorderCondition
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub 'ECommerce-Config-${EnvironmentSuffix}'

  WebACLArn:
    Description: WAF WebACL ARN
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub 'ECommerce-WAF-${EnvironmentSuffix}'
```
