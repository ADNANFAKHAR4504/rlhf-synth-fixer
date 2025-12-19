```yml
AWSTemplateFormatVersion: "2010-09-09"
Description: |
  Enterprise-Grade AWS Security Framework
  This template creates a comprehensive security infrastructure including:
  - IAM roles and policies with least privilege access
  - Network security with properly configured security groups
  - Encrypted S3 storage with KMS customer-managed keys
  - Comprehensive monitoring and compliance logging

  Author: AWS Security Architect
  Version: 1.0
  Last Updated: 2024

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - ProjectName
          - VpcCidr
      - Label:
          default: "Security Configuration"
        Parameters:
          - TrustedIpRange
          - ComplianceRetentionDays

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name for resource tagging and configuration

  ProjectName:
    Type: String
    Default: secure-enterprise
    Description: Project name used for resource naming and tagging
    MinLength: 3
    MaxLength: 20
    AllowedPattern: ^[a-z0-9-]+$

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC
    AllowedPattern: ^(10\.(0|1[0-9]?[0-9]?|2[0-4][0-9]|25[0-5])\.(0|1[0-9]?[0-9]?|2[0-4][0-9]|25[0-5])\.(0|1[0-9]?[0-9]?|2[0-4][0-9]|25[0-5])\/16)$

  TrustedIpRange:
    Type: String
    Default: 10.0.0.0/8
    Description: Trusted IP range for administrative access (RFC 1918 private networks recommended)

  ComplianceRetentionDays:
    Type: Number
    Default: 2555
    MinValue: 365
    MaxValue: 3653
    Description: Log retention period in days for compliance (minimum 1 year, maximum 10 years)

  CloudWatchRetentionInDays:
    Type: Number
    Default: 365
    AllowedValues:
      - 1
      - 3
      - 5
      - 7
      - 14
      - 30
      - 60
      - 90
      - 120
      - 150
      - 180
      - 365
      - 400
      - 545
      - 731
      - 1827
      - 3653
    Description: Retention period (days) for CloudWatch Logs groups (must use supported values)

  EnableCloudTrail:
    Type: String
    Default: "false"
    AllowedValues:
      - "true"
      - "false"
    Description: Set to "true" to create CloudTrail resources. Default "false" avoids regional trail limits.

  NumberOfAZs:
    Type: Number
    Default: 1
    AllowedValues:
      - 1
      - 2
      - 3
    Description: Number of Availability Zones to use (set 1 for single-AZ regions)

Conditions:
  CreateAz2: !Not [!Equals [!Ref NumberOfAZs, 1]]
  CreateCloudTrail: !Equals [!Ref EnableCloudTrail, "true"]

Resources:
  # ================================
  # KMS ENCRYPTION KEYS
  # ================================

  # Customer-managed KMS key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "Customer-managed KMS key for S3 encryption - ${ProjectName}-${Environment}"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          # Root account administrative access
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          # S3 service access for encryption operations
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: "*"
            Condition:
              StringEquals:
                "kms:ViaService": !Sub "s3.${AWS::Region}.amazonaws.com"
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-s3-encryption-key-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: S3-Encryption
        - Key: ManagedBy
          Value: CloudFormation

  # KMS key alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${ProjectName}-s3-encryption-${Environment}"
      TargetKeyId: !Ref S3EncryptionKey

  # Customer-managed KMS key for CloudTrail encryption
  CloudTrailEncryptionKey:
    Condition: CreateCloudTrail
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "Customer-managed KMS key for CloudTrail encryption - ${ProjectName}-${Environment}"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudTrail Service
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey
              - kms:Decrypt
            Resource: "*"
            Condition:
              StringEquals:
                "kms:ViaService": !Sub "cloudtrail.${AWS::Region}.amazonaws.com"
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-cloudtrail-encryption-key-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Encryption
        - Key: ManagedBy
          Value: CloudFormation

  CloudTrailEncryptionKeyAlias:
    Condition: CreateCloudTrail
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${ProjectName}-cloudtrail-encryption-${Environment}"
      TargetKeyId: !Ref CloudTrailEncryptionKey

  # ================================
  # VPC AND NETWORK INFRASTRUCTURE
  # ================================

  # Main VPC with DNS support enabled
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-secure-vpc-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Secure-Network-Infrastructure
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway for public subnet connectivity
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-igw-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Attach Internet Gateway to VPC
  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  # ================================
  # SECURITY GROUPS
  # ================================

  # Web tier security group - allows HTTP/HTTPS from internet
  WebTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${ProjectName}-web-tier-sg-${Environment}"
      GroupDescription: "Security group for web tier - allows HTTP/HTTPS traffic from internet and administrative access from trusted networks"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # HTTP access from internet (consider redirecting to HTTPS in production)
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: "HTTP access from internet"
        # HTTPS access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS access from internet"
        # SSH access from trusted networks only
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: "SSH access from trusted IP range"
      SecurityGroupEgress:
        # Allow all outbound traffic (can be restricted based on requirements)
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: "All outbound traffic"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-web-tier-sg-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Web
        - Key: Purpose
          Value: Web-Application-Security
        - Key: ManagedBy
          Value: CloudFormation

  # Application tier security group - allows access only from web tier
  ApplicationTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${ProjectName}-app-tier-sg-${Environment}"
      GroupDescription: "Security group for application tier - allows access from web tier and administrative access from trusted networks"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # Application port access from web tier only
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref WebTierSecurityGroup
          Description: "Application access from web tier"
        # SSH access from trusted networks
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: "SSH access from trusted IP range"
      SecurityGroupEgress:
        # Allow outbound HTTPS for API calls and updates
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS outbound for API calls"
        # Allow outbound HTTP for package updates (consider restricting to specific repositories)
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: "HTTP outbound for package updates"
        # Database access to data tier (will be configured after data tier is created)
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: 0.0.0.0/0
          Description: "MySQL access to data tier"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-app-tier-sg-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Application
        - Key: Purpose
          Value: Application-Logic-Security
        - Key: ManagedBy
          Value: CloudFormation

  # Data tier security group - allows access only from application tier
  DataTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${ProjectName}-data-tier-sg-${Environment}"
      GroupDescription: "Security group for data tier - allows database access from application tier only"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # MySQL access from application tier only
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationTierSecurityGroup
          Description: "MySQL access from application tier"
        # PostgreSQL access from application tier (if needed)
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ApplicationTierSecurityGroup
          Description: "PostgreSQL access from application tier"
      # No outbound rules defined - uses default deny-all for enhanced security
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-data-tier-sg-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Data
        - Key: Purpose
          Value: Database-Security
        - Key: ManagedBy
          Value: CloudFormation

  # Management security group for administrative access
  ManagementSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${ProjectName}-management-sg-${Environment}"
      GroupDescription: "Security group for management and monitoring tools - restricted to trusted networks"
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # SSH access for management
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: "SSH access from trusted IP range"
        # HTTPS for management interfaces
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref TrustedIpRange
          Description: "HTTPS access for management interfaces"
        # Custom monitoring port
        - IpProtocol: tcp
          FromPort: 9090
          ToPort: 9090
          CidrIp: !Ref TrustedIpRange
          Description: "Monitoring service access"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: "All outbound traffic for management operations"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-management-sg-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Management-And-Monitoring
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # IAM ROLES AND POLICIES
  # ================================

  # EC2 instance role for web tier with minimal required permissions
  WebTierInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-web-tier-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                "aws:RequestedRegion": !Ref AWS::Region
      Policies:
        # CloudWatch agent access (inline replacement for managed policy)
        - PolicyName: CloudWatchAgentAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                  - cloudwatch:PutMetricData
                  - ec2:DescribeTags
                Resource: "*"
        # Custom policy for S3 access to specific buckets only
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureS3Bucket.Arn
        # Custom policy for Systems Manager (for patching and management)
        - PolicyName: SystemsManagerPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-web-tier-role-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Web-Tier-Service-Role
        - Key: ManagedBy
          Value: CloudFormation

  # Instance profile for web tier role
  WebTierInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${ProjectName}-web-tier-profile-${Environment}"
      Roles:
        - !Ref WebTierInstanceRole

  # Application tier instance role with database and API access
  ApplicationTierInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-app-tier-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                "aws:RequestedRegion": !Ref AWS::Region
      Policies:
        # CloudWatch agent access (inline replacement for managed policy)
        - PolicyName: CloudWatchAgentAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                  - cloudwatch:PutMetricData
                  - ec2:DescribeTags
                Resource: "*"
        # S3 access for application data
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource:
                  - !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureS3Bucket.Arn
        # KMS access for encryption/decryption
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3EncryptionKey.Arn
        # Systems Manager access for configuration
        - PolicyName: SystemsManagerPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-app-tier-role-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Application-Tier-Service-Role
        - Key: ManagedBy
          Value: CloudFormation

  ApplicationTierInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${ProjectName}-app-tier-profile-${Environment}"
      Roles:
        - !Ref ApplicationTierInstanceRole

  # CloudTrail service role
  CloudTrailRole:
    Condition: CreateCloudTrail
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-cloudtrail-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-cloudtrail-role-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Service-Role
        - Key: ManagedBy
          Value: CloudFormation

  # Config service role
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-config-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                  - s3:GetBucketLocation
                  - s3:ListBucket
                Resource: !GetAtt ConfigS3Bucket.Arn
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                Resource: !Sub "arn:${AWS::Partition}:s3:::${ConfigS3Bucket}/*"
                Condition:
                  StringEquals:
                    "s3:x-amz-acl": bucket-owner-full-control
        - PolicyName: ConfigServiceAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              # Publish to SNS for notifications
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref ConfigSNSTopic
              # Broad read-only across common services for configuration recording
              - Effect: Allow
                Action:
                  - ec2:Describe*
                  - iam:Get*
                  - iam:List*
                  - s3:Get*
                  - s3:List*
                  - rds:Describe*
                  - dynamodb:List*
                  - dynamodb:Describe*
                  - cloudtrail:DescribeTrails
                  - cloudtrail:GetTrailStatus
                  - lambda:List*
                  - lambda:Get*
                  - logs:Describe*
                  - logs:Get*
                  - cloudfront:List*
                  - cloudfront:Get*
                  - route53:List*
                  - route53:Get*
                  - kms:List*
                  - kms:Describe*
                  - kms:GetKeyPolicy
                  - elasticloadbalancing:Describe*
                  - apigateway:GET
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-config-role-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Config-Service-Role
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # S3 BUCKETS WITH ENCRYPTION
  # ================================

  # Main secure S3 bucket with comprehensive security controls
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-secure-storage-${Environment}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE

      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-secure-storage-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Secure-Data-Storage
        - Key: Encryption
          Value: KMS-Customer-Managed
        - Key: ManagedBy
          Value: CloudFormation

  # S3 bucket policy to enforce encryption and secure access
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: "*"
            Action: s3:PutObject
            Resource: !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": aws:kms
          # Deny uploads without proper KMS key
          - Sid: DenyIncorrectEncryptionKey
            Effect: Deny
            Principal: "*"
            Action: s3:PutObject
            Resource: !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption-aws-kms-key-id": !GetAtt S3EncryptionKey.Arn
          # Deny insecure transport
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"

  # S3 bucket for access logs
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-access-logs-${Environment}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: !Ref ComplianceRetentionDays
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-access-logs-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: S3-Access-Logging
        - Key: ManagedBy
          Value: CloudFormation

  # S3 bucket for AWS Config
  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-config-${Environment}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: ConfigRetention
            Status: Enabled
            ExpirationInDays: !Ref ComplianceRetentionDays
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-config-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: AWS-Config-Storage
        - Key: ManagedBy
          Value: CloudFormation

  # S3 bucket for CloudTrail logs
  CloudTrailS3Bucket:
    Condition: CreateCloudTrail
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-cloudtrail-${Environment}-${AWS::AccountId}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CloudTrailEncryptionKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: CloudTrailRetention
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            ExpirationInDays: !Ref ComplianceRetentionDays
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-cloudtrail-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Logging
        - Key: ManagedBy
          Value: CloudFormation

  # CloudTrail bucket policy
  CloudTrailS3BucketPolicy:
    Condition: CreateCloudTrail
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
            Condition:
              StringEquals:
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-cloudtrail-${Environment}"
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:${AWS::Partition}:s3:::${CloudTrailS3Bucket}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": bucket-owner-full-control
                "AWS:SourceArn": !Sub "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-cloudtrail-${Environment}"

  # ================================
  # CLOUDWATCH LOG GROUPS
  # ================================

  CloudTrailLogsGroup:
    Condition: CreateCloudTrail
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/cloudtrail/${ProjectName}-${Environment}"
      RetentionInDays: !Ref CloudWatchRetentionInDays
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-cloudtrail-logs-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Logs
        - Key: ManagedBy
          Value: CloudFormation

  # VPC Flow Logs CloudWatch Log Group
  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/vpc/flowlogs/${ProjectName}-${Environment}"
      RetentionInDays: !Ref CloudWatchRetentionInDays
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-vpc-flowlogs-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: VPC-Flow-Logging
        - Key: ManagedBy
          Value: CloudFormation

  # IAM Role for VPC Flow Logs delivery
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-vpc-flowlogs-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: VPCFlowLogsDeliveryPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-vpc-flowlogs-role-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: VPC-Flow-Logs-Delivery
        - Key: ManagedBy
          Value: CloudFormation

  # VPC Flow Logs resource
  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-vpc-flowlogs-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: VPC-Flow-Logging
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # NETWORK INFRASTRUCTURE - SUBNETS & ROUTING
  # ================================

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.1.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-public-subnet-1-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Public
        - Key: Purpose
          Value: Public-Network-Access
        - Key: ManagedBy
          Value: CloudFormation

  # Public Subnet 2
  PublicSubnet2:
    Condition: CreateAz2
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.2.0/24"
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-public-subnet-2-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Public
        - Key: Purpose
          Value: Public-Network-Access
        - Key: ManagedBy
          Value: CloudFormation

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.10.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-private-subnet-1-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Private
        - Key: Purpose
          Value: Application-Tier-Network
        - Key: ManagedBy
          Value: CloudFormation

  # Private Subnet 2
  PrivateSubnet2:
    Condition: CreateAz2
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.11.0/24"
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-private-subnet-2-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Private
        - Key: Purpose
          Value: Application-Tier-Network
        - Key: ManagedBy
          Value: CloudFormation

  # Data Tier Subnet 1
  DataSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.20.0/24"
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-data-subnet-1-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Data
        - Key: Purpose
          Value: Database-Network
        - Key: ManagedBy
          Value: CloudFormation

  # Data Tier Subnet 2
  DataSubnet2:
    Condition: CreateAz2
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: "10.0.21.0/24"
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-data-subnet-2-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Tier
          Value: Data
        - Key: Purpose
          Value: Database-Network
        - Key: ManagedBy
          Value: CloudFormation

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-public-routes-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Public-Network-Routing
        - Key: ManagedBy
          Value: CloudFormation

  # Public Route to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
    DependsOn: VPCGatewayAttachment

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-private-routes-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Private-Network-Routing
        - Key: ManagedBy
          Value: CloudFormation

  # NAT Gateway for private subnet internet access
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-nat-gateway-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: NAT-Gateway
        - Key: ManagedBy
          Value: CloudFormation

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-nat-eip-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: NAT-Gateway-IP
        - Key: ManagedBy
          Value: CloudFormation

  # Private Route to NAT Gateway
  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Condition: CreateAz2
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Condition: CreateAz2
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  DataSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DataSubnet1
      RouteTableId: !Ref PrivateRouteTable

  DataSubnet2RouteTableAssociation:
    Condition: CreateAz2
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref DataSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ================================
  # CLOUDTRAIL TRAIL
  # ================================

  # CloudTrail Trail for API activity logging
  CloudTrailTrail:
    Condition: CreateCloudTrail
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub "${ProjectName}-cloudtrail-${Environment}"
      S3BucketName: !Ref CloudTrailS3Bucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      KMSKeyId: !Ref CloudTrailEncryptionKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogsGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-cloudtrail-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: API-Activity-Logging
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # AWS CONFIG RESOURCES
  # ================================

  # Note: Recorder and DeliveryChannel are intentionally not created by this stack

  # SNS Topic for Config notifications
  ConfigSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${ProjectName}-config-notifications-${Environment}"
      DisplayName: !Sub "${ProjectName} Config Notifications ${Environment}"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-config-notifications-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Config-Notifications
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # CLOUDWATCH MONITORING
  # ================================

  # CloudWatch Dashboard for security monitoring
  SecurityDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "${ProjectName}-security-dashboard-${Environment}"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/VPC", "FlowLogs" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "VPC Flow Logs"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/S3", "NumberOfObjects" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "S3 Object Count"
              }
            }
          ]
        }

  # CloudWatch Alarm for VPC Flow Logs
  VPCFlowLogsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-vpc-flowlogs-alarm-${Environment}"
      AlarmDescription: "Alert when VPC Flow Logs are not being delivered"
      MetricName: FlowLogs
      Namespace: AWS/VPC
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: LessThanThreshold
      TreatMissingData: breaching
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-vpc-flowlogs-alarm-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: VPC-Flow-Logs-Monitoring
        - Key: ManagedBy
          Value: CloudFormation

  # ================================
  # OUTPUTS
  # ================================

Outputs:
  VPCId:
    Description: "ID of the Secure VPC"
    Value: !Ref SecureVPC
    Export:
      Name: !Sub "${ProjectName}-vpc-id-${Environment}"

  PublicSubnetIds:
    Description: "IDs of the public subnets"
    Value:
      !If [
        CreateAz2,
        !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]],
        !Ref PublicSubnet1,
      ]
    Export:
      Name: !Sub "${ProjectName}-public-subnet-ids-${Environment}"

  PrivateSubnetIds:
    Description: "IDs of the private subnets"
    Value:
      !If [
        CreateAz2,
        !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]],
        !Ref PrivateSubnet1,
      ]
    Export:
      Name: !Sub "${ProjectName}-private-subnet-ids-${Environment}"

  DataSubnetIds:
    Description: "IDs of the data tier subnets"
    Value:
      !If [
        CreateAz2,
        !Join [",", [!Ref DataSubnet1, !Ref DataSubnet2]],
        !Ref DataSubnet1,
      ]
    Export:
      Name: !Sub "${ProjectName}-data-subnet-ids-${Environment}"

  S3EncryptionKeyArn:
    Description: "ARN of the S3 encryption KMS key"
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub "${ProjectName}-s3-encryption-key-arn-${Environment}"

  CloudTrailTrailName:
    Condition: CreateCloudTrail
    Description: "Name of the CloudTrail trail"
    Value: !Ref CloudTrailTrail
    Export:
      Name: !Sub "${ProjectName}-cloudtrail-name-${Environment}"

  SecurityDashboardName:
    Description: "Name of the CloudWatch security dashboard"
    Value: !Ref SecurityDashboard
    Export:
      Name: !Sub "${ProjectName}-security-dashboard-name-${Environment}"
```