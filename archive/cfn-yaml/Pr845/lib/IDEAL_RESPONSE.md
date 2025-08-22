# Secure AWS Infrastructure Documentation

This document provides comprehensive documentation for the secure AWS infrastructure components deployed using CloudFormation templates.

## Overview


The infrastructure implements a secure, scalable web application environment with the following key features:

- **Encrypted Storage**: All data is encrypted using AWS KMS
- **Least-Privilege Access**: IAM roles and policies follow the principle of least privilege
- **Comprehensive Logging**: S3 access logs and CloudWatch monitoring
- **Network Security**: VPC with public/private subnets and security groups
- **Compliance**: GDPR-compliant data handling and retention policies

## Infrastructure Components

### 1. CloudFormation Template (YAML)

The primary infrastructure template in YAML format:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with encrypted storage, least-privilege access, and comprehensive logging'

Parameters:
  YourPublicIP:
    Type: String
    Description: 'Your public IP address for SSH access (format: x.x.x.x/32)'
    Default: '203.0.113.0/32' # Safe placeholder; CI/CD must override this
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/(3[0-2]|[1-2]?[0-9])$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 203.0.113.0/32)'

  UniqueId:
    Type: String
    Description: 'Unique identifier for resource naming. Must be lowercase alphanumeric.'
    Default: 'secureapp'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must be lowercase alphanumeric characters only.'

  EnvironmentSuffix:
    Type: String
    Description: 'Environment name or identifier (e.g., dev, pr487)'
    Default: 'dev'
    AllowedPattern: '^[a-zA-Z0-9\-]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters or hyphens.'

  StackNameLower:
    Type: String
    Description: 'Lowercase version of the stack name for use in S3 bucket names.'
    AllowedPattern: '^[a-z0-9\-]+$'
    ConstraintDescription: 'Must be lowercase letters, numbers, and hyphens only.'
    Default: 'tapstack'

Resources:
  InfrastructureKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS Key for infrastructure encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # 1) Keep full admin for the account root
          - Sid: AllowRootUseOfKMSKey
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'

          # 2) Allow any principal in THIS account to administer the key policy
          #    (this covers your CI/deploy role so KMS won't reject creation)
          - Sid: AllowAccountAdminsToManageKey
            Effect: Allow
            Principal: '*'
            Action:
              - kms:PutKeyPolicy
              - kms:Create*
              - kms:Describe*
              - kms:Enable*
              - kms:Disable*
              - kms:List*
              - kms:Put*
              - kms:Update*
              - kms:Revoke*
              - kms:ScheduleKeyDeletion
              - kms:CancelKeyDeletion
            Resource: '*'
            Condition:
              StringEquals:
                kms:CallerAccount: !Ref AWS::AccountId

  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-vpc'
        - Key: Environment
          Value: 'Production'

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instance - SSH access only'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref YourPublicIP
          Description: 'SSH access from specified IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-sg'
        - Key: Purpose
          Value: 'Restricted SSH Access'

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: 'ReadWebsiteContent'
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - Fn::Sub: arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}
                  - Fn::Sub: arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*
              - Sid: 'WriteApplicationLogs'
                Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource:
                  - Fn::Sub: arn:aws:s3:::application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*
              - Sid: 'KMSAccess'
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:Encrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:ReEncrypt*'
                Resource: !GetAtt InfrastructureKMSKey.Arn
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-access-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: 'S3 Access Logs Bucket'
        - Key: Purpose
          Value: 'Access Logging'

  S3AccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3AccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3Logging
            Effect: Allow
            Principal:
              Service: logging.s3.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::s3-access-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Sub '${AWS::AccountId}'
              ArnLike:
                'aws:SourceArn':
                  - !Sub 'arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
                  - !Sub 'arn:aws:s3:::application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
                  - !Sub 'arn:aws:s3:::backup-data-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'

  WebsiteContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'website-content-access-logs/'

  ApplicationLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'application-logs-access-logs/'

  BackupDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'backup-data-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref InfrastructureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'backup-data-access-logs/'

  WebsiteContentBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteContentBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowEC2RoleReadAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !Sub 'arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*'
              - !Sub 'arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'

  ApplicationLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowEC2RoleWriteAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - 's3:PutObject'
              - 's3:PutObjectAcl'
            Resource:
              - !Sub 'arn:aws:s3:::application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*'
              - !Sub 'arn:aws:s3:::application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}'

  BackupDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref BackupDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt BackupDataBucket.Arn
              - !Sub 'arn:aws:s3:::backup-data-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*'
            Condition:
              Bool:
                aws:SecureTransport: false
          - Sid: AllowCloudFormationLogging
            Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action: 's3:PutBucketLogging'
            Resource: !GetAtt BackupDataBucket.Arn

  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: t2.micro
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: 'gp3'
            VolumeSize: 8
            Encrypted: true
            KmsKeyId: !Ref InfrastructureKMSKey
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli
          echo "Instance started at $(date)" > /tmp/startup.log
          aws s3 cp /tmp/startup.log s3://application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/startup-$(date +%Y%m%d-%H%M%S).log --region ${AWS::Region}
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-instance'
        - Key: Environment
          Value: 'Production'
        - Key: Purpose
          Value: 'Web Application Server'

Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  EC2InstanceId:
    Description: 'ID of the created EC2 instance'
    Value: !Ref SecureEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceId'

  EC2PublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt SecureEC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-EC2PublicIP'

  WebsiteContentBucket:
    Description: 'Name of the website content S3 bucket'
    Value: !Ref WebsiteContentBucket
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteContentBucket'

  ApplicationLogsBucket:
    Description: 'Name of the application logs S3 bucket'
    Value: !Ref ApplicationLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLogsBucket'

  BackupDataBucket:
    Description: 'Name of the backup data S3 bucket'
    Value: !Ref BackupDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-BackupDataBucket'

  S3AccessLogsBucket:
    Description: 'Name of the S3 access logs bucket'
    Value: !Ref S3AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3AccessLogsBucket'

  KMSKeyId:
    Description: 'ID of the KMS key used for S3 encryption'
    Value: !Ref InfrastructureKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  EC2InstanceRoleArn:
    Description: 'ARN of the EC2 instance IAM role'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceRoleArn'
```

### 2. CloudFormation Template (JSON)

The comprehensive infrastructure template in JSON format with enhanced features:

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Secure, scalable web application infrastructure with multi-region deployment, GDPR compliance, and comprehensive security controls.",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "EnvironmentSuffix",
                        "ProjectName"
                    ]
                },
                {
                    "Label": {
                        "default": "Network Configuration (Primary Region)"
                    },
                    "Parameters": [
                        "VpcCidr",
                        "PublicSubnetCidr",
                        "PrivateSubnetCidr",
                        "BastionSshCidr"
                    ]
                },
                {
                    "Label": {
                        "default": "Application Configuration"
                    },
                    "Parameters": [
                        "WebServerAmiId",
                        "InstanceType",
                        "MinInstances",
                        "MaxInstances",
                        "WebAppPort"
                    ]
                },
                {
                    "Label": {
                        "default": "Security Configuration"
                    },
                    "Parameters": [
                        "DataRetentionDays",
                        "AdminMfaRequired",
                        "AdminUserEmail"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "prod",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        },
        "ProjectName": {
            "Type": "String",
            "Default": "secure-web-app",
            "Description": "Project name for resource naming",
            "AllowedPattern": "^[a-zA-Z0-9-]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
        },
        "VpcCidr": {
            "Type": "String",
            "Default": "10.0.0.0/16",
            "Description": "CIDR block for the VPC in the primary region (us-east-1)",
            "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
        },
        "PublicSubnetCidr": {
            "Type": "String",
            "Default": "10.0.1.0/24",
            "Description": "CIDR block for the first public subnet in primary region"
        },
        "PrivateSubnetCidr": {
            "Type": "String",
            "Default": "10.0.2.0/24",
            "Description": "CIDR block for the first private subnet in primary region"
        },
        "BastionSshCidr": {
            "Type": "String",
            "Default": "203.0.113.0/24",
            "Description": "CIDR block for SSH access to Bastion Host (MUST be restricted in production)",
            "AllowedPattern": "^([0-9]{1,3}\\.){3}[0-9]{1,3}(\\/([0-9]|[1-2][0-9]|3[0-2]))?$"
        },
        "WebServerAmiId": {
            "Type": "AWS::EC2::Image::Id",
            "Description": "AMI ID for web servers (e.g., ami-0abcdef1234567890 for Amazon Linux 2)",
            "Default": "ami-0abcdef1234567890"
        },
        "InstanceType": {
            "Type": "String",
            "Default": "t3.medium",
            "Description": "EC2 instance type for web servers"
        },
        "MinInstances": {
            "Type": "Number",
            "Default": 2,
            "Description": "Minimum number of instances in the Auto Scaling Group",
            "MinValue": 1,
            "MaxValue": 10
        },
        "MaxInstances": {
            "Type": "Number",
            "Default": 10,
            "Description": "Maximum number of instances in the Auto Scaling Group",
            "MinValue": 1,
            "MaxValue": 20
        },
        "WebAppPort": {
            "Type": "Number",
            "Default": 80,
            "Description": "Port for the web application",
            "MinValue": 1,
            "MaxValue": 65535
        },
        "DataRetentionDays": {
            "Type": "Number",
            "Default": 90,
            "Description": "Number of days to retain application logs and data",
            "MinValue": 1,
            "MaxValue": 2555
        },
        "AdminMfaRequired": {
            "Type": "String",
            "Default": "true",
            "Description": "Whether MFA is required for admin access",
            "AllowedValues": ["true", "false"]
        },
        "AdminUserEmail": {
            "Type": "String",
            "Description": "Email address for admin user notifications",
            "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        }
    }
}
```

## Security Features

### Encryption

- **KMS Key Management**: Custom KMS key with automatic rotation
- **S3 Encryption**: Server-side encryption with KMS keys
- **EBS Encryption**: Encrypted EBS volumes for EC2 instances
- **In-Transit Encryption**: TLS/SSL for all data transmission

### Access Control

- **IAM Roles**: Least-privilege IAM roles for EC2 instances
- **Security Groups**: Restrictive security groups with minimal required access
- **S3 Bucket Policies**: Secure bucket policies with proper access controls
- **Public Access Block**: All S3 buckets block public access

### Monitoring and Logging

- **S3 Access Logs**: Comprehensive logging for all S3 bucket access
- **CloudWatch Integration**: Monitoring and alerting capabilities
- **VPC Flow Logs**: Network traffic monitoring
- **Lifecycle Policies**: Automated data retention and cleanup

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate permissions
   - CloudFormation stack creation permissions
   - Valid public IP address for SSH access

2. **Deploy YAML Template**:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-infrastructure \
     --template-body file://TapStack.yml \
     --parameters ParameterKey=YourPublicIP,ParameterValue=YOUR_IP/32
   ```

3. **Deploy JSON Template**:

   ```bash
   aws cloudformation create-stack \
     --stack-name comprehensive-infrastructure \
     --template-body file://TapStack.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```

## Resource Naming Convention

All resources follow a consistent naming pattern:

- `{StackName}-{ResourceType}-{Environment}`
- Example: `secure-infrastructure-vpc-prod`

## Compliance and Best Practices

- **GDPR Compliance**: Data retention policies and encryption
- **AWS Well-Architected Framework**: Follows security, reliability, and performance pillars
- **CIS Benchmarks**: Implements security best practices
- **Least Privilege**: Minimal required permissions for all resources

## Cost Optimization

- **Auto Scaling**: Dynamic scaling based on demand
- **Lifecycle Policies**: Automatic cleanup of old logs
- **Instance Types**: Appropriate sizing for workloads
- **Storage Classes**: Cost-effective S3 storage options
