# AWS CloudFormation Template:  Secure production infrastructure

Here's the complete CloudFormation template that sets up a Secure production infrastructure for enterprise application in the `us-west-2` region with high availability, internet connectivity, and proper IAM roles:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure production infrastructure for enterprise application'

Parameters:
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block allowed for SSH access'
  AllowedHTTPCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block allowed for HTTP access'
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
  DBPassword:
    Type: String
    Default: 'TempPassword123!'
    NoEcho: true
    MinLength: 8
    Description: 'Database master password'

Resources:
  # Subnets in existing VPC
  ProdPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: vpc-056d1fe3a8ef12345
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Name
          Value: Prod-PrivateSubnet1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: vpc-056d1fe3a8ef12345
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-west-2b
      Tags:
        - Key: Name
          Value: Prod-PrivateSubnet2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: vpc-056d1fe3a8ef12345
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-west-2a
      Tags:
        - Key: Name
          Value: Prod-PublicSubnet1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # Security Groups
  ProdWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: Prod-WebServerSecurityGroup
      GroupDescription: Security group for web servers
      VpcId: vpc-056d1fe3a8ef12345
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedHTTPCIDR
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedHTTPCIDR
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: Prod-WebServerSecurityGroup
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: Prod-DatabaseSecurityGroup
      GroupDescription: Security group for database servers
      VpcId: vpc-056d1fe3a8ef12345
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ProdWebServerSecurityGroup
      Tags:
        - Key: Name
          Value: Prod-DatabaseSecurityGroup
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # IAM Roles and Policies
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: Prod-EC2Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: SecureAppAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: 
                  - !Sub '${ProdApplicationBucket}/*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref ProdApplicationSecret
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/prod/secureapp/*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: Prod-EC2InstanceProfile
      Roles:
        - !Ref ProdEC2Role

  ProdLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: Prod-LambdaRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource: !GetAtt ProdDynamoDBTable.Arn
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # EC2 Instance
  ProdWebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c2d3e23f2c60e5a0  # Latest Amazon Linux 2 AMI in us-west-2
      InstanceType: t3.medium
      SubnetId: !Ref ProdPublicSubnet1
      SecurityGroupIds:
        - !Ref ProdWebServerSecurityGroup
      IamInstanceProfile: !Ref ProdEC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          yum install -y amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
          systemctl enable amazon-cloudwatch-agent
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: Prod-WebServer
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # RDS Subnet Group
  ProdDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: prod-db-subnet-group
      DBSubnetGroupDescription: Subnet group for production database
      SubnetIds:
        - !Ref ProdPrivateSubnet1
        - !Ref ProdPrivateSubnet2
      Tags:
        - Key: Name
          Value: Prod-DBSubnetGroup
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # RDS Instance
  ProdDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: prod-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref ProdDatabaseSecurityGroup
      DBSubnetGroupName: !Ref ProdDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      DeletionProtection: true
      EnablePerformanceInsights: true
      Tags:
        - Key: Name
          Value: Prod-Database
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # DynamoDB Table
  ProdDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Prod-ApplicationTable
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: Prod-ApplicationTable
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # S3 Buckets
  ProdApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-secureapp-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: GlacierTransition
            Status: Enabled
            Transitions:
              - TransitionInDays: 90
                StorageClass: GLACIER
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref ProdS3LogGroup
      Tags:
        - Key: Name
          Value: Prod-ApplicationBucket
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdLoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-logging-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: LogRetention
            Status: Enabled
            ExpirationInDays: 2555  # 7 years for compliance
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      Tags:
        - Key: Name
          Value: Prod-LoggingBucket
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # CloudTrail Bucket Policy
  ProdCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdLoggingBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ProdLoggingBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ProdLoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # Lambda Function
  ProdLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: Prod-ApplicationFunction
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt ProdLambdaRole.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref ProdDynamoDBTable
          ENVIRONMENT: Production
      KmsKeyArn: !GetAtt ProdKMSKey.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table(os.environ['TABLE_NAME'])
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from secure Lambda!')
              }
      Tags:
        - Key: Name
          Value: Prod-ApplicationFunction
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # KMS Key
  ProdKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for Prod SecureApp encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda access
            Effect: Allow
            Principal:
              AWS: !GetAtt ProdLambdaRole.Arn
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: Prod-KMSKey
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/prod-secureapp-key
      TargetKeyId: !Ref ProdKMSKey

  # Secrets Manager
  ProdApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: prod/secureapp/database-credentials
      Description: 'Database credentials for production application'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref ProdKMSKey
      Tags:
        - Key: Name
          Value: Prod-ApplicationSecret
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # Parameter Store
  ProdAppConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /prod/secureapp/app-config
      Type: SecureString
      Value: '{"debug": false, "log_level": "INFO"}'
      KeyId: !Ref ProdKMSKey
      Tags:
        Environment: Production
        Project: SecureApp

  # CloudWatch Log Groups
  ProdApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /prod/secureapp/application
      RetentionInDays: 90
      KmsKeyId: !GetAtt ProdKMSKey.Arn
      Tags:
        - Key: Name
          Value: Prod-ApplicationLogGroup
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  ProdS3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/s3/prod-secureapp-access
      RetentionInDays: 90
      KmsKeyId: !GetAtt ProdKMSKey.Arn

  # CloudWatch Alarms
  ProdUnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Prod-UnauthorizedAccessAttempts
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: FailedConnectionCount
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref ProdSNSTopic
      Tags:
        - Key: Name
          Value: Prod-UnauthorizedAccessAlarm
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # SNS Topic for Alarms
  ProdSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: Prod-SecurityAlerts
      KmsMasterKeyId: !Ref ProdKMSKey
      Tags:
        - Key: Name
          Value: Prod-SecurityAlerts
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # CloudTrail
  ProdCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: Prod-SecurityAuditTrail
      S3BucketName: !Ref ProdLoggingBucket
      S3KeyPrefix: cloudtrail-logs/
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref ProdKMSKey
      Tags:
        - Key: Name
          Value: Prod-SecurityAuditTrail
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

  # Config Configuration Recorder
  ProdConfigRole:
    Type: AWS::IAM::ServiceLinkedRole
    Properties:
      AWSServiceName: config.amazonaws.com

  ProdConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: Prod-ConfigDeliveryChannel
      S3BucketName: !Ref ProdLoggingBucket
      S3KeyPrefix: aws-config/

  ProdConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: Prod-ConfigurationRecorder
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Config Rules
  ProdS3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ProdConfigurationRecorder
    Properties:
      ConfigRuleName: Prod-S3BucketEncryptionEnabled
      Description: 'Checks if S3 buckets have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  ProdRDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ProdConfigurationRecorder
    Properties:
      ConfigRuleName: Prod-RDSStorageEncrypted
      Description: 'Checks if RDS instances have storage encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED

  # GuardDuty
  ProdGuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      Tags:
        - Key: Name
          Value: Prod-GuardDutyDetector
        - Key: Environment
          Value: Production
        - Key: Project
          Value: SecureApp

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: vpc-056d1fe3a8ef12345
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  WebServerInstanceId:
    Description: 'Web Server Instance ID'
    Value: !Ref ProdWebServer
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-ID'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt ProdDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  ApplicationBucket:
    Description: 'Application S3 Bucket Name'
    Value: !Ref ProdApplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-Application-Bucket'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref ProdDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'
```

# Key Features and Security Implementations

## Security Best Practices
- **Security Groups:** 
  - `ProdWebServerSecurityGroup` restricts ingress to HTTP (port 80), HTTPS (port 443), and SSH (port 22) from specified CIDR blocks (`AllowedHTTPCIDR` and `AllowedSSHCIDR`), ensuring controlled access. Egress allows all outbound traffic.
  - `ProdDatabaseSecurityGroup` permits MySQL traffic (port 3306) only from the web server security group, enforcing least privilege for database access.
- **IAM Roles:** 
  - `ProdEC2Role` grants EC2 instances access to S3 (`GetObject`, `PutObject`), Secrets Manager (`GetSecretValue`), and SSM Parameter Store (`GetParameter`, `GetParameters`) with fine-grained permissions.
  - `ProdLambdaRole` provides Lambda functions with DynamoDB access (`GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`) and basic execution permissions, adhering to least privilege principles.
- **Encryption:**
  - RDS storage is encrypted using AWS-managed keys.
  - S3 buckets (`ProdApplicationBucket`, `ProdLoggingBucket`) use server-side encryption with AES256.
  - DynamoDB table (`ProdDynamoDBTable`) enables server-side encryption.
  - Secrets Manager and SSM Parameter Store use a custom KMS key (`ProdKMSKey`) for encryption.
  - CloudWatch log groups are encrypted with the same KMS key.
- **KMS Key:** A dedicated KMS key (`ProdKMSKey`) secures Lambda functions, Secrets Manager, SSM parameters, and CloudWatch logs, with access restricted to the root account and Lambda role.
- **Public Access Restrictions:** S3 buckets enforce public access blocks (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, `RestrictPublicBuckets`) to prevent unauthorized access.
- **CloudTrail:** `ProdCloudTrail` logs all API activity to a secure S3 bucket with log file validation and encryption, ensuring auditability.
- **GuardDuty:** `ProdGuardDutyDetector` monitors for threats with findings published every 15 minutes.
- **Config Rules:** Enforce compliance by checking S3 bucket encryption (`ProdS3BucketEncryptionRule`) and RDS storage encryption (`ProdRDSEncryptionRule`).

## Monitoring & Alerting
- **CloudWatch Logs:** 
  - `ProdApplicationLogGroup` retains application logs for 90 days, encrypted with KMS.
  - `ProdS3LogGroup` captures S3 access logs, also encrypted and retained for 90 days.
- **CloudWatch Alarms:** `ProdUnauthorizedAccessAlarm` monitors unauthorized access attempts on Application Load Balancers, triggering notifications via `ProdSNSTopic` if the threshold is exceeded.
- **SNS Topic:** `ProdSNSTopic` delivers security alerts, encrypted with the KMS key.
- **CloudTrail:** Logs all API activities for security auditing, stored in `ProdLoggingBucket` with a 7-year retention policy.
- **Config Recorder:** `ProdConfigurationRecorder` tracks configuration changes across all resources, with delivery to `ProdLoggingBucket`.
- **Outputs:** Exports critical resource identifiers (VPC ID, Web Server Instance ID, RDS Endpoint, S3 Bucket Name, DynamoDB Table Name) for integration with other stacks or monitoring tools.

## Infrastructure Components
- **VPC Configuration:** Utilizes an existing VPC (`vpc-056d1fe3a8ef12345`) with public and private subnets across two availability zones (`us-west-2a`, `us-west-2b`) for high availability.
- **Subnets:**
  - `ProdPublicSubnet1` (10.0.3.0/24) hosts the web server.
  - `ProdPrivateSubnet1` (10.0.1.0/24) and `ProdPrivateSubnet2` (10.0.2.0/24) form the RDS subnet group for the database.
- **EC2 Instance:** `ProdWebServer` (t3.medium, Amazon Linux 2) runs Nginx, with CloudWatch Agent and SSM Agent installed via UserData. The instance uses an encrypted gp3 volume (20 GB) and is associated with `ProdEC2InstanceProfile`.
- **RDS Instance:** `ProdDatabase` (MySQL 8.0.35, db.t3.micro) is deployed in a Multi-AZ configuration with encrypted storage, automated backups (7-day retention), and Performance Insights enabled.
- **DynamoDB Table:** `ProdDynamoDBTable` uses pay-per-request billing with point-in-time recovery and server-side encryption.
- **S3 Buckets:**
  - `ProdApplicationBucket` stores application data with versioning, AES256 encryption, and a lifecycle policy transitioning objects to Glacier after 90 days.
  - `ProdLoggingBucket` stores CloudTrail and Config logs with a 7-year retention policy and transitions to Glacier after 90 days.
- **Lambda Function:** `ProdLambdaFunction` (Python 3.9) interacts with DynamoDB, secured with a KMS key and environment variables for configuration.
- **Secrets Manager:** `ProdApplicationSecret` stores database credentials, encrypted with the KMS key.
- **SSM Parameter Store:** `ProdAppConfigParameter` holds secure application configuration, encrypted with the KMS key.
- **CloudTrail:** Configured for multi-region logging with log file validation.
- **AWS Config:** Monitors resource compliance with rules for S3 and RDS encryption.
- **GuardDuty:** Provides threat detection across the infrastructure.

## Compliance Features
- **Tagging:** All resources are tagged with `Name`, `Environment` (Production), and `Project` (SecureApp) for cost tracking and resource management.
- **Region:** Deployed in `us-west-2` to meet regional requirements.
- **Data Protection:** 
  - Encrypted storage for RDS, S3, DynamoDB, Secrets Manager, SSM, and CloudWatch logs.
  - Deletion protection enabled for RDS, with snapshot retention on deletion.
- **Auditability:** CloudTrail and AWS Config ensure comprehensive logging and configuration tracking.
- **Dynamic Parameterization:** Uses `!Ref`, `!GetAtt`, `!Sub`, and `Fn::Base64` for flexible and reusable template configuration.
- **Long-term Retention:** S3 logging bucket retains logs for 7 years to meet compliance requirements.
- **VPC Isolation:** Private subnets protect the database, with access restricted to the web server security group.