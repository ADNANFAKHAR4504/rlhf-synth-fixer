# AWS Secure Infrastructure Template

This CloudFormation template creates a secure, scalable AWS infrastructure with comprehensive logging, encryption, and compliance features.

## Architecture Overview

The template deploys a complete multi-tier architecture including:
- **Network Layer**: VPC with public and private subnets across multiple AZs
- **Security Layer**: KMS encryption, IAM roles with least privilege, security groups
- **Compute Layer**: EC2 launch template with CloudWatch monitoring
- **Database Layer**: Encrypted RDS MySQL instance in private subnets
- **Storage Layer**: Encrypted S3 buckets for application data and logs
- **Compliance Layer**: CloudTrail for audit logging with CloudWatch integration

## Resources Created

### Security & Encryption
- **KMS Key**: Customer-managed encryption key for all services
- **KMS Key Alias**: Human-readable alias for the encryption key

### Network Infrastructure
- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Internet Gateway**: Internet access for public subnets
- **Public Subnets**: 2 subnets (10.0.1.0/24, 10.0.2.0/24) across AZs
- **Private Subnets**: 2 subnets (10.0.10.0/24, 10.0.11.0/24) for databases
- **Route Tables**: Public routing with internet gateway association

### Security Groups
- **Bastion Security Group**: SSH access from allowed CIDR
- **Web Server Security Group**: HTTPS access from allowed CIDR, SSH from bastion
- **Database Security Group**: MySQL access only from web servers

### Storage
- **Application S3 Bucket**: Encrypted storage with public access blocked
- **Access Logs S3 Bucket**: Centralized access logging storage
- **CloudTrail S3 Bucket**: Audit trail storage with proper bucket policy

### Database
- **RDS Subnet Group**: Private subnet group for database placement
- **Secrets Manager**: Secure password management
- **RDS MySQL Instance**: Encrypted, multi-AZ (in prod), backup enabled

### Compute
- **IAM Role**: EC2 instance role with CloudWatch and S3 permissions
- **Instance Profile**: Associates IAM role with EC2 instances
- **Launch Template**: Standardized EC2 configuration with monitoring

### Compliance & Monitoring
- **CloudWatch Log Groups**: Application and CloudTrail log collection
- **CloudTrail**: Global API auditing with log file validation
- **IAM Developer Group**: MFA-required access for developers

### CloudFormation Management
- **CloudFormation State Bucket**: Template deployment artifact storage

## Implementation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and scalable AWS infrastructure template with multi-region support'

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Description: Environment name (dev, staging, prod)
    Default: dev

  Owner:
    Type: String
    Description: Owner of the resources
    Default: DevOpsTeam

  Project:
    Type: String
    Description: Project name
    Default: SecureInfrastructure

  AllowedCIDR:
    Type: String
    Description: CIDR block allowed for HTTPS access
    Default: 10.0.0.0/8
    AllowedPattern: ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$

  DBUsername:
    Type: String
    Description: Database master username
    Default: dbadmin
    MinLength: 4
    MaxLength: 16

  EnvironmentSuffix:
    Type: String
    Description: Suffix to append to resource names for unique identification
    Default: dev
    AllowedPattern: ^[a-zA-Z0-9-]+$
    ConstraintDescription: Must contain only alphanumeric characters and hyphens
    MinLength: 1
    MaxLength: 20

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-0841edc20334f9287
    eu-west-1:
      AMI: ami-08ca3fed11864d6bb

Resources:
  # KMS Key for encryption at rest
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${Environment}-${Project}-encryption-key-${EnvironmentSuffix}'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs to encrypt application logs
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
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${Environment}-application-${EnvironmentSuffix}'
          - Sid: Allow CloudWatch Logs to encrypt CloudTrail logs
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
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/${Environment}-audit-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-kms-key-${EnvironmentSuffix}'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-${Project}-key-${EnvironmentSuffix}'
      TargetKeyId: !Ref KMSKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc-main-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw-main-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

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
          Value: !Sub '${Environment}-subnet-public-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-subnet-public-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-subnet-private-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-subnet-private-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rt-public-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

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

  # Security Groups
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-sg-bastion-${EnvironmentSuffix}'
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCIDR
          Description: SSH access from allowed CIDR range
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-sg-bastion-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-sg-webserver-${EnvironmentSuffix}'
      GroupDescription: Security group for web servers - HTTPS only from specific CIDR
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDR
          Description: HTTPS access from allowed CIDR range
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: SSH access from bastion host
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-sg-webserver-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-sg-database-${EnvironmentSuffix}'
      GroupDescription: Security group for RDS database - no public access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL access from web servers only
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-sg-database-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # S3 Bucket for application data with encryption and logging
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-s3-appdata-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LoggingBucket
        LogFilePrefix: access-logs/
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-s3-appdata-${EnvironmentSuffix}'

  # S3 Bucket for access logs
  S3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-s3-accesslogs-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-s3-accesslogs-${EnvironmentSuffix}'

  # CloudWatch Log Group for application logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-application-${EnvironmentSuffix}'
      RetentionInDays: 30
      KmsKeyId: !GetAtt KMSKey.Arn

  # IAM Role for EC2 instances (least privilege)
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-role-ec2-webserver-${EnvironmentSuffix}'
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
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-role-ec2-webserver-${EnvironmentSuffix}'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${Environment}-profile-ec2-webserver-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  # IAM Group for developers with MFA requirement
  DeveloperGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub '${Environment}-group-developers-${EnvironmentSuffix}'
      Policies:
        - PolicyName: MFARequiredPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowViewAccountInfo
                Effect: Allow
                Action:
                  - iam:GetAccountPasswordPolicy
                  - iam:GetAccountSummary
                  - iam:ListVirtualMFADevices
                Resource: '*'
              - Sid: AllowManageOwnPasswords
                Effect: Allow
                Action:
                  - iam:ChangePassword
                  - iam:GetUser
                Resource: 'arn:aws:iam::*:user/${aws:username}'
              - Sid: AllowManageOwnMFA
                Effect: Allow
                Action:
                  - iam:CreateVirtualMFADevice
                  - iam:DeleteVirtualMFADevice
                  - iam:ListMFADevices
                  - iam:EnableMFADevice
                  - iam:ResyncMFADevice
                Resource:
                  - 'arn:aws:iam::*:mfa/${aws:username}'
                  - 'arn:aws:iam::*:user/${aws:username}'
              - Sid: DenyAllExceptUnlessSignedInWithMFA
                Effect: Deny
                NotAction:
                  - iam:CreateVirtualMFADevice
                  - iam:EnableMFADevice
                  - iam:GetUser
                  - iam:ListMFADevices
                  - iam:ListVirtualMFADevices
                  - iam:ResyncMFADevice
                  - sts:GetSessionToken
                Resource: '*'
                Condition:
                  BoolIfExists:
                    'aws:MultiFactorAuthPresent': 'false'

  # RDS Subnet Group (private subnets only)
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-dbsubnet-main-${EnvironmentSuffix}'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-dbsubnet-main-${EnvironmentSuffix}'

  # Generate a random password for RDS
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}-rds-password-${EnvironmentSuffix}'
      Description: 'RDS Database Password'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-rds-password-${EnvironmentSuffix}'

  # RDS Database (private, encrypted)
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-rds-main-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      ManageMasterUserPassword: true
      MasterUserSecret:
        SecretArn: !Ref DBPasswordSecret
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProd, true, false]
      PubliclyAccessible: false
      DeletionProtection: false
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-rds-main-${EnvironmentSuffix}'

  # CloudTrail for global auditing
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Environment}-audit-${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt KMSKey.Arn

  CloudTrailLogStream:
    Type: AWS::Logs::LogStream
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      LogStreamName: !Sub '${Environment}-cloudtrail-stream-${EnvironmentSuffix}'

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Purpose
          Value: CloudTrail-LogsAccess

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${Environment}-cloudtrail-global-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref KMSKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail-global-${EnvironmentSuffix}'

  # S3 Bucket for CloudTrail logs
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-s3-cloudtrail-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Environment}-s3-cloudtrail-${EnvironmentSuffix}'

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
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Environment}-cloudtrail-global-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketLocation
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Environment}-cloudtrail-global-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${CloudTrailBucket}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${Environment}-cloudtrail-global-${EnvironmentSuffix}'

  # Launch Template for EC2 instances
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-lt-webserver-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
            {
              "metrics": {
                "namespace": "AWS/EC2/Custom",
                "metrics_collected": {
                  "cpu": {
                    "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                    "metrics_collection_interval": 60
                  },
                  "disk": {
                    "measurement": ["used_percent"],
                    "metrics_collection_interval": 60,
                    "resources": ["*"]
                  },
                  "mem": {
                    "measurement": ["mem_used_percent"],
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
                        "log_group_name": "/aws/ec2/${Environment}-application-${EnvironmentSuffix}",
                        "log_stream_name": "{instance_id}/messages"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${Environment}-ec2-webserver-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner
              - Key: Project
                Value: !Ref Project

  # CloudFormation State Bucket
  CloudFormationStateBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'iac-rlhf-cfn-states-${AWS::Region}-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
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
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Purpose
          Value: CloudFormationState

Conditions:
  IsProd: !Equals [!Ref Environment, prod]

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  S3BucketName:
    Description: S3 Bucket for application data
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${Environment}-s3-bucket'

  DatabaseEndpoint:
    Description: RDS Database endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-rds-endpoint'

  DatabaseSecretArn:
    Description: RDS Database password secret ARN
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${Environment}-rds-secret'

  CloudFormationStateBucketName:
    Description: CloudFormation state bucket name
    Value: !Ref CloudFormationStateBucket
    Export:
      Name: !Sub '${Environment}-cfn-state-bucket'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${Environment}-kms-key'

  LaunchTemplateId:
    Description: Launch Template ID for EC2 instances
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${Environment}-launch-template'

  WebServerSecurityGroupId:
    Description: Security Group ID for web servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${Environment}-sg-webserver'
```

## Security Features

### Encryption
- **KMS Customer-Managed Key**: Used for encrypting RDS, CloudWatch Logs, and CloudTrail
- **S3 Bucket Encryption**: AES-256 encryption for all S3 buckets
- **RDS Encryption**: Database encryption at rest using KMS

### Network Security
- **Private Database Subnets**: RDS instances isolated from internet access
- **Security Group Restrictions**: Least privilege network access controls
- **HTTPS Only**: Web servers only accept HTTPS traffic from allowed CIDR ranges

### Access Control
- **IAM Least Privilege**: EC2 instances have minimal required permissions
- **MFA Enforcement**: Developer group requires multi-factor authentication
- **CloudTrail Auditing**: All API calls logged and monitored

### Compliance
- **Audit Logging**: CloudTrail with log file validation enabled
- **Log Retention**: Configurable retention policies (30-90 days)
- **Multi-Region Trail**: Global service events captured
- **Backup Strategy**: RDS automated backups with 7-day retention

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate permissions
- CloudFormation deployment permissions
- KMS key management permissions

### Standard Deployment
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure-dev \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=EnvironmentSuffix,ParameterValue=pr$(date +%s) \
  --capabilities CAPABILITY_NAMED_IAM
```

### Production Deployment
```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure-prod \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=Environment,ParameterValue=prod \
               ParameterKey=EnvironmentSuffix,ParameterValue=v1 \
               ParameterKey=AllowedCIDR,ParameterValue=10.0.0.0/8 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Cost Optimization

- **t3.micro instances**: Cost-effective compute for development
- **gp2 storage**: Standard performance storage for RDS
- **Conditional Multi-AZ**: Only enabled in production environment
- **Log retention**: Optimized retention periods to balance cost and compliance

This template provides a secure, scalable foundation for AWS infrastructure with comprehensive logging, encryption, and compliance features while maintaining cost efficiency for different environments.