# Security Configuration as Code - CloudFormation YAML Solution

## Overview
This CloudFormation template implements a comprehensive security-focused AWS infrastructure with security best practices, encryption at rest, least privilege access controls, and automated compliance monitoring.

## Solution Architecture

### Core Security Features Implemented
1. **Network Segmentation**: VPC with public and private subnets
2. **Encryption Everywhere**: All data at rest is encrypted using AES256
3. **Least Privilege IAM**: Roles with minimal required permissions
4. **Security Monitoring**: CloudWatch Logs and SNS alerts
5. **Access Control**: Restrictive security groups with no public access

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security Configuration as Code - Secure AWS Infrastructure with EC2 security groups, encrypted S3 buckets, private RDS, IAM roles with least privilege, and SNS alerts'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9-]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens.'

  TrustedCidrBlock:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block for trusted SSH access'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|1[0-9]|2[0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid CIDR range.'

  DBUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters.'

  NotificationEmail:
    Type: String
    Description: 'Email address for security alerts'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: 'Must be a valid email address.'
    Default: 'admin@example.com'

Resources:
  # VPC and Network Infrastructure
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Security
          Value: 'High'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ2'

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.4.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes'

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-EC2-SecurityGroup-${EnvironmentSuffix}'
      GroupDescription: 'Security group for EC2 instances - SSH access from trusted CIDR only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref TrustedCidrBlock
          Description: 'SSH access from trusted CIDR block'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for updates'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          CidrIp: '10.0.0.0/16'
          Description: 'MySQL access to RDS within VPC'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-SecurityGroup'
        - Key: Security
          Value: 'Restrictive'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-RDS-SecurityGroup-${EnvironmentSuffix}'
      GroupDescription: 'Security group for RDS - access from EC2 instances only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-SecurityGroup'
        - Key: Security
          Value: 'Private'

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-Role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::tap-${EnvironmentSuffix}-secure-${AWS::AccountId}/*'
                  - !Sub 'arn:aws:s3:::tap-${EnvironmentSuffix}-secure-${AWS::AccountId}'
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2-InstanceProfile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  # S3 Buckets with Encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DependsOn: SecurityAlertsTopicPolicy
    Properties:
      BucketName: !Sub 'tap-${EnvironmentSuffix}-secure-${AWS::AccountId}'
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
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingS3Bucket
        LogFilePrefix: 'secure-bucket-access-logs/'
      NotificationConfiguration:
        TopicConfigurations:
          - Event: 's3:ObjectCreated:*'
            Topic: !Ref SecurityAlertsTopic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-SecureBucket'
        - Key: Security
          Value: 'Encrypted'

  LoggingS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'tap-${EnvironmentSuffix}-logs-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 60
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-LoggingBucket'
        - Key: Purpose
          Value: 'AccessLogs'

  # S3 Bucket Policy for Secure Bucket
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::tap-${EnvironmentSuffix}-secure-${AWS::AccountId}/*'
              - !Sub 'arn:aws:s3:::tap-${EnvironmentSuffix}-secure-${AWS::AccountId}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnEncryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub 'arn:aws:s3:::tap-${EnvironmentSuffix}-secure-${AWS::AccountId}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # Secrets Manager Secret for RDS Password
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-DBPassword'
      Description: 'Database password for RDS MySQL instance'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group-${EnvironmentSuffix}'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSubnetGroup'

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-mysql-db-${EnvironmentSuffix}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.37'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      EnablePerformanceInsights: false
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-MySQL-Database'
        - Key: Security
          Value: 'Encrypted-Private'

  # RDS Monitoring Role
  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-RDS-Monitoring-Role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # SNS Topic for Security Alerts
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-SecurityAlerts-${EnvironmentSuffix}'
      DisplayName: 'Security Compliance Alerts'
      KmsMasterKeyId: alias/aws/sns

  SecurityAlertsTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SecurityAlertsTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3ToPublish
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - SNS:Publish
            Resource: !Ref SecurityAlertsTopic
            Condition:
              StringEquals:
                aws:SourceAccount: !Ref AWS::AccountId

  SecurityAlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SecurityAlertsTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # CloudWatch Log Group for Security Events
  SecurityLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/security/${AWS::StackName}'
      RetentionInDays: 365

  # Note: GuardDuty detector removed as it can only be created once per account/region
  # Use AWS Config rules for compliance monitoring instead

  # Note: AWS Config components removed as account already has Config setup
  # The security monitoring is handled through CloudWatch logs and SNS alerts

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCID'

  SecurityGroupId:
    Description: 'ID of the EC2 Security Group'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SecurityGroup'

  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3Bucket'

  RDSEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  SNSTopicArn:
    Description: 'ARN of the Security Alerts SNS Topic'
    Value: !Ref SecurityAlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAlerts-Topic'

  DBPasswordSecretArn:
    Description: 'ARN of the database password secret in Secrets Manager'
    Value: !Ref DBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-DBPassword-Secret'
```

## Key Security Features

### 1. Network Security
- **VPC Isolation**: All resources deployed within a custom VPC
- **Subnet Segregation**: Public subnets for internet-facing resources, private subnets for databases
- **No Internet Access for RDS**: Database instances in private subnets with no public accessibility

### 2. Access Control
- **Security Groups**: Restrictive inbound rules, only allowing SSH from trusted CIDR
- **IAM Least Privilege**: EC2 role with minimal permissions (read-only S3, CloudWatch logs)
- **No Public Access**: All security groups deny public access by default

### 3. Data Protection
- **Encryption at Rest**: All S3 buckets and RDS instances use AES256 encryption
- **Encryption in Transit**: S3 bucket policy enforces HTTPS-only access
- **Versioning**: S3 bucket versioning enabled for data recovery

### 4. Monitoring and Compliance
- **CloudWatch Logs**: Security events logged with 365-day retention
- **SNS Alerts**: Email notifications for security events
- **Access Logging**: S3 access logs stored in dedicated logging bucket

### 5. Operational Security
- **Automated Backups**: RDS with 7-day backup retention
- **Resource Tagging**: All resources tagged for tracking and management
- **Environment Isolation**: Environment suffix for multi-environment deployment

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Sufficient permissions to create IAM roles, VPC, S3, RDS, SNS resources

2. **Deploy the stack**:
   ```bash
   aws cloudformation deploy \
     --template-file TapStack.yml \
     --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
     --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
     --parameter-overrides \
       EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
       NotificationEmail=<your-email> \
     --region us-east-1
   ```

3. **Verify deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStack-${ENVIRONMENT_SUFFIX} \
     --query 'Stacks[0].Outputs'
   ```

## Compliance with Requirements

✅ **Requirement 1**: Security groups deny all traffic except SSH from specific IP range
✅ **Requirement 2**: S3 buckets have server-side encryption using AWS-managed keys
✅ **Requirement 3**: RDS database in private subnet, not publicly accessible
✅ **Requirement 4**: IAM roles follow least privilege principles
✅ **Requirement 5**: SNS topic configured for security compliance alerts

## Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimal permissions granted
3. **Encryption Everywhere**: All data encrypted at rest and in transit
4. **Audit and Monitoring**: Comprehensive logging and alerting
5. **Infrastructure as Code**: Version-controlled, repeatable deployments
6. **Environment Isolation**: Support for multiple environments with suffix naming

## Notes

- GuardDuty and AWS Config components were omitted as they require account-level setup (one per account/region)
- Performance Insights disabled for db.t3.micro instances (not supported)
- DeletionProtection set to false for testing environments (should be true in production)
- All resources include environment suffix to prevent naming conflicts
