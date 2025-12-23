# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure-by-Design AWS Infrastructure with stringent security controls and compliance enforcement'

# ==============================================================================
# PARAMETERS SECTION
# ==============================================================================
Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class (e.g., db.t3.micro, db.m6g.large, db.r6g.xlarge)'
    AllowedPattern: '^db\.[a-z0-9]+\.[a-z0-9]+$'
    MinLength: 8
    MaxLength: 20

  DBEngineVersion:
    Type: String
    Default: '8.0.42'
    Description: 'MySQL engine version'

  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix - used for resource naming and tagging'
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '^[a-zA-Z0-9-_]+$'

# ==============================================================================
# RESOURCES SECTION
# ==============================================================================
Resources:

  # ------------------------------------------------------------------------------
  # KMS KEY - Customer Managed Key for encryption at rest
  # ------------------------------------------------------------------------------
  SecureDataKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for encrypting S3 and RDS data at rest'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow use of the key for S3 and RDS'
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Project
          Value: SecureOps
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # KMS Key Alias for easier reference
  SecureDataKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-${EnvironmentSuffix}-key'
      TargetKeyId: !Ref SecureDataKMSKey

  # ------------------------------------------------------------------------------
  # VPC CONFIGURATION
  # ------------------------------------------------------------------------------
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true  # Required by AWS Config rule
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private Subnet for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-1-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-2-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps

  # DB Subnet Group for RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for secure RDS instance'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DB-SubnetGroup-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps

  # ------------------------------------------------------------------------------
  # AWS CONFIG RULE - VPC DNS Support Validation
  # ------------------------------------------------------------------------------
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'ConfigServiceMinimalAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:Put*
                  - config:Get*
                  - config:List*
                  - config:Describe*
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub 
                  - '${BucketArn}/*'
                  - BucketArn: !GetAtt CentralLoggingBucket.Arn
                Condition:
                  StringLike:
                    s3:x-amz-acl: 'bucket-owner-full-control'
              - Effect: Allow
                Action:
                  - s3:GetBucketAcl
                Resource: !Sub 
                  - 'arn:aws:s3:::${bucketName}'
                  - bucketName: !Ref CentralLoggingBucket
      Tags:
        - Key: Project
          Value: SecureOps

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref CentralLoggingBucket

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-ConfigRecorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # Custom AWS Config Rule to validate VPC DNS Support
  VPCDnsSupportConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub 'vpc-dns-support-enabled-${EnvironmentSuffix}'
      Description: 'Validates that VPC has enableDnsSupport set to true'
      Source:
        Owner: CUSTOM_LAMBDA
        SourceIdentifier: !GetAtt VPCDnsSupportFunction.Arn
        SourceDetails:
          - EventSource: aws.config
            MessageType: ConfigurationItemChangeNotification
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::VPC

  # ------------------------------------------------------------------------------
  # LAMBDA FUNCTION FOR CUSTOM AWS CONFIG RULE
  # ------------------------------------------------------------------------------
  
  # IAM Role for Lambda function
  VPCDnsSupportLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-VPCDnsSupportLambdaRole-${EnvironmentSuffix}'
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
        - PolicyName: 'VPCDnsSupportConfigAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeVpcs
                  - config:PutEvaluations
                Resource: '*'
      Tags:
        - Key: Project
          Value: SecureOps

  # Lambda function to check VPC DNS support
  VPCDnsSupportFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-vpc-dns-support-check-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt VPCDnsSupportLambdaRole.Arn
      Timeout: 30
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def handler(event, context):
              logger.info('Event: %s', json.dumps(event))
              
              # Initialize AWS clients
              config = boto3.client('config')
              ec2 = boto3.client('ec2')
              
              # Get the VPC ID from the event
              vpc_id = event['configurationItem']['configuration']['vpcId']
              
              try:
                  # Describe the VPC to get enableDnsSupport setting
                  response = ec2.describe_vpcs(VpcIds=[vpc_id])
                  vpc = response['Vpcs'][0]
                  enable_dns_support = vpc['EnableDnsSupport']
                  
                  # Create evaluation
                  evaluation = {
                      'ComplianceType': 'COMPLIANT' if enable_dns_support else 'NON_COMPLIANT',
                      'OrderingTimestamp': event['notificationCreationTime'],
                      'ResultToken': event.get('resultToken')
                  }
                  
                  # Put evaluation
                  config.put_evaluations(Evaluations=[evaluation])
                  
                  logger.info('VPC %s DNS support: %s', vpc_id, enable_dns_support)
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Evaluation completed successfully')
                  }
                  
              except Exception as e:
                  logger.error('Error evaluating VPC DNS support: %s', str(e))
                  return {
                      'statusCode': 500,
                      'body': json.dumps(f'Error: {str(e)}')
                  }

  # Lambda Permission for AWS Config to invoke the function
  VPCDnsSupportLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref VPCDnsSupportFunction
      Action: lambda:InvokeFunction
      Principal: config.amazonaws.com
      SourceAccount: !Ref AWS::AccountId

  # ------------------------------------------------------------------------------
  # IAM ROLES - Least Privilege Implementation
  # ------------------------------------------------------------------------------
  
  # Application Server Role with minimal permissions
  AppServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-AppServerRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      # Inline policy following least privilege principle
      Policies:
        - PolicyName: 'AppServerMinimalAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${SecureDataBucket}/*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureDataKMSKey.Arn
      Tags:
        - Key: Project
          Value: SecureOps
        - Key: SecurityLevel
          Value: Medium

  # Low Security Read-Only Role with restricted access
  LowSecurityReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-LowSecurityReadOnlyRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      # Minimal read-only permissions
      Policies:
        - PolicyName: 'LowSecurityReadOnlyAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${CentralLoggingBucket}'
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::${CentralLoggingBucket}/public-logs/*'
      Tags:
        - Key: Project
          Value: SecureOps
        - Key: SecurityLevel
          Value: Low  # This tag will be used by S3 bucket policy to deny access

  # ------------------------------------------------------------------------------
  # S3 BUCKETS - Encrypted and Access Controlled
  # ------------------------------------------------------------------------------
  
  # Central Logging Bucket for RDS and other service logs
  CentralLoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'tapstack-${EnvironmentSuffix}-central-logging-${AWS::AccountId}'
      # Deny all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Enable versioning for audit trail
      VersioningConfiguration:
        Status: Enabled
      # Server-side encryption with KMS
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt SecureDataKMSKey.Arn
            BucketKeyEnabled: true
      # Lifecycle policy for log retention
      LifecycleConfiguration:
        Rules:
          - Id: 'LogRetentionRule'
            Status: Enabled
            ExpirationInDays: 2555  # 7 years retention for compliance
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Project
          Value: SecureOps
        - Key: Purpose
          Value: CentralLogging

  # Secure Data Bucket with conditional access policy
  SecureDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'tapstack-${EnvironmentSuffix}-secure-data-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt SecureDataKMSKey.Arn
            BucketKeyEnabled: true
      Tags:
        - Key: Project
          Value: SecureOps
        - Key: Purpose
          Value: SecureDataStorage

  # Bucket Policy to deny access to principals with SecurityLevel=Low tag
  SecureDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Explicitly deny all S3 actions for principals with SecurityLevel=Low
          - Sid: 'DenyLowSecurityLevelAccess'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${SecureDataBucket}'
              - !Sub 'arn:aws:s3:::${SecureDataBucket}/*'
            Condition:
              StringEquals:
                'aws:PrincipalTag/SecurityLevel': 'Low'
          # Allow access for other authorized principals
          - Sid: 'AllowAuthorizedAccess'
            Effect: Allow
            Principal:
              AWS: !GetAtt AppServerRole.Arn
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource: !Sub 'arn:aws:s3:::${SecureDataBucket}/*'

  # ------------------------------------------------------------------------------
  # RDS DATABASE - Encrypted with Audit Logging
  # ------------------------------------------------------------------------------
  
  # Security Group for RDS
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for secure RDS instance'
      VpcId: !Ref SecureVPC
      # No inbound rules - access only through application
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-SG-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps

  # RDS Instance with encryption and logging
  SecureRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db-${EnvironmentSuffix}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: !Ref DBEngineVersion
      MasterUsername: !Sub '{{resolve:secretsmanager:${AWS::StackName}-db-secret:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${AWS::StackName}-db-secret:SecretString:password}}'
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      # Encryption at rest using KMS CMK
      StorageEncrypted: true
      KmsKeyId: !GetAtt SecureDataKMSKey.Arn
      # Network configuration
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      # Backup and maintenance
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      # Enable log exports to S3
      EnableCloudwatchLogsExports:
        - audit
        - error
        - general
        - slowquery
      # Additional security settings
      DeletionProtection: false
      MultiAZ: false  # Set to true for production
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS-${EnvironmentSuffix}'
        - Key: Project
          Value: SecureOps

  # Note: RDS automatically creates CloudWatch Log Groups when EnableCloudwatchLogsExports is configured
  # No need to explicitly create them as it causes conflicts

# ==============================================================================
# OUTPUTS SECTION
# ==============================================================================
Outputs:
  VPCId:
    Description: 'ID of the secure VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  KMSKeyArn:
    Description: 'ARN of the customer-managed KMS key'
    Value: !GetAtt SecureDataKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ARN'

  CentralLoggingBucketName:
    Description: 'Name of the central logging S3 bucket'
    Value: !Ref CentralLoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-Central-Logging-Bucket'

  SecureDataBucketName:
    Description: 'Name of the secure data S3 bucket'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-Secure-Data-Bucket'

  RDSEndpoint:
    Description: 'RDS instance endpoint address'
    Value: !GetAtt SecureRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  AppServerRoleArn:
    Description: 'ARN of the Application Server IAM Role'
    Value: !GetAtt AppServerRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AppServer-Role-ARN'

  LowSecurityRoleArn:
    Description: 'ARN of the Low Security Read-Only IAM Role'
    Value: !GetAtt LowSecurityReadOnlyRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LowSecurity-Role-ARN'

  ConfigRuleName:
    Description: 'Name of the AWS Config rule validating VPC DNS support'
    Value: !Ref VPCDnsSupportConfigRule
    Export:
      Name: !Sub '${AWS::StackName}-Config-Rule-Name'
```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
