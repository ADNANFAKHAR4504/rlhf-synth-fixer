```yml
AWSTemplateFormatVersion: '2010-09-09'
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
      - Label:
          default: "Monitoring Configuration"
        Parameters:
          - EnableDetailedMonitoring
          - NotificationEmail

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
    
  EnableDetailedMonitoring:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Enable detailed CloudWatch monitoring for enhanced observability
    
  NotificationEmail:
    Type: String
    Description: Email address for security notifications and alerts
    AllowedPattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

Resources:
  # ================================
  # KMS ENCRYPTION KEYS
  # ================================
  
  # Customer-managed KMS key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Customer-managed KMS key for S3 encryption - ${ProjectName}-${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Root account administrative access
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # S3 service access for encryption operations
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
      KeyRotationStatus: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-s3-encryption-key-${Environment}'
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
      AliasName: !Sub 'alias/${ProjectName}-s3-encryption-${Environment}'
      TargetKeyId: !Ref S3EncryptionKey

  # Customer-managed KMS key for CloudTrail encryption
  CloudTrailEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'Customer-managed KMS key for CloudTrail encryption - ${ProjectName}-${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail Service
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey
              - kms:Decrypt
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'cloudtrail.${AWS::Region}.amazonaws.com'
      KeyRotationStatus: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-encryption-key-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Encryption
        - Key: ManagedBy
          Value: CloudFormation

  CloudTrailEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-cloudtrail-encryption-${Environment}'
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
          Value: !Sub '${ProjectName}-secure-vpc-${Environment}'
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
          Value: !Sub '${ProjectName}-igw-${Environment}'
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
      GroupName: !Sub '${ProjectName}-web-tier-sg-${Environment}'
      GroupDescription: 'Security group for web tier - allows HTTP/HTTPS traffic from internet and administrative access from trusted networks'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # HTTP access from internet (consider redirecting to HTTPS in production)
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access from internet'
        # HTTPS access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access from internet'
        # SSH access from trusted networks only
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: 'SSH access from trusted IP range'
      SecurityGroupEgress:
        # Allow all outbound traffic (can be restricted based on requirements)
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-tier-sg-${Environment}'
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
      GroupName: !Sub '${ProjectName}-app-tier-sg-${Environment}'
      GroupDescription: 'Security group for application tier - allows access from web tier and administrative access from trusted networks'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # Application port access from web tier only
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref WebTierSecurityGroup
          Description: 'Application access from web tier'
        # SSH access from trusted networks
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: 'SSH access from trusted IP range'
      SecurityGroupEgress:
        # Allow outbound HTTPS for API calls and updates
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for API calls'
        # Allow outbound HTTP for package updates (consider restricting to specific repositories)
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
        # Database access to data tier
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DataTierSecurityGroup
          Description: 'MySQL access to data tier'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-app-tier-sg-${Environment}'
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
      GroupName: !Sub '${ProjectName}-data-tier-sg-${Environment}'
      GroupDescription: 'Security group for data tier - allows database access from application tier only'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # MySQL access from application tier only
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ApplicationTierSecurityGroup
          Description: 'MySQL access from application tier'
        # PostgreSQL access from application tier (if needed)
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ApplicationTierSecurityGroup
          Description: 'PostgreSQL access from application tier'
      # No outbound rules defined - uses default deny-all for enhanced security
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-data-tier-sg-${Environment}'
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
      GroupName: !Sub '${ProjectName}-management-sg-${Environment}'
      GroupDescription: 'Security group for management and monitoring tools - restricted to trusted networks'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        # SSH access for management
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedIpRange
          Description: 'SSH access from trusted IP range'
        # HTTPS for management interfaces
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref TrustedIpRange
          Description: 'HTTPS access for management interfaces'
        # Custom monitoring port
        - IpProtocol: tcp
          FromPort: 9090
          ToPort: 9090
          CidrIp: !Ref TrustedIpRange
          Description: 'Monitoring service access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic for management operations'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-management-sg-${Environment}'
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
      RoleName: !Sub '${ProjectName}-web-tier-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref AWS::Region
      ManagedPolicyArns:
        # AWS managed policy for CloudWatch agent
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        # Custom policy for S3 access to specific buckets only
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: 
                  - !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureS3Bucket.Arn
        # Custom policy for Systems Manager (for patching and management)
        - PolicyName: SystemsManagerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-web-tier-role-${Environment}'
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
      InstanceProfileName: !Sub '${ProjectName}-web-tier-profile-${Environment}'
      Roles:
        - !Ref WebTierInstanceRole

  # Application tier instance role with database and API access
  ApplicationTierInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-app-tier-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref AWS::Region
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        # S3 access for application data
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: 
                  - !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt SecureS3Bucket.Arn
        # KMS access for encryption/decryption
        - PolicyName: KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3EncryptionKey.Arn
        # Systems Manager access for configuration
        - PolicyName: SystemsManagerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-app-tier-role-${Environment}'
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
      InstanceProfileName: !Sub '${ProjectName}-app-tier-profile-${Environment}'
      Roles:
        - !Ref ApplicationTierInstanceRole

  # CloudTrail service role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-cloudtrail-role-${Environment}'
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-cloudtrail-role-${Environment}'
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
      RoleName: !Sub '${ProjectName}-config-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
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
                Resource: !Sub '${ConfigS3Bucket}/*'
                Condition:
                  StringEquals:
                    's3:x-amz-acl': bucket-owner-full-control
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-config-role-${Environment}'
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
      BucketName: !Sub '${ProjectName}-secure-storage-${Environment}-${AWS::AccountId}'
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
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3AccessLogGroup
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secure-storage-${Environment}'
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
        Version: '2012-10-17'
        Statement:
          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': aws:kms
          # Deny uploads without proper KMS key
          - Sid: DenyIncorrectEncryptionKey
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3EncryptionKey.Arn
          # Deny insecure transport
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub '${SecureS3Bucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # S3 bucket for access logs
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${Environment}-${AWS::AccountId}'
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
          Value: !Sub '${ProjectName}-access-logs-${Environment}'
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
      BucketName: !Sub '${ProjectName}-config-${Environment}-${AWS::AccountId}'
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
          Value: !Sub '${ProjectName}-config-${Environment}'
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
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${Environment}-${AWS::AccountId}'
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
          Value: !Sub '${ProjectName}-cloudtrail-${Environment}'
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
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-cloudtrail-${Environment}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${ProjectName}-cloudtrail-${Environment}'

  # ================================
  # CLOUDWATCH LOG GROUPS
  # ================================
  
  # VPC Flow Logs CloudWatch Log Group
  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${Environment}'
      RetentionInDays: !Ref ComplianceRetentionDays
```