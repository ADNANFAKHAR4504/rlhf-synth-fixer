# TapStack.yml - Highly Secure Cloud Infrastructure

Below is a comprehensive CloudFormation YAML template that meets all your security and infrastructure requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly secure cloud infrastructure with encrypted S3 buckets, least-privilege IAM roles, and comprehensive CloudWatch logging'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - dev
      - staging
      - prod

Resources:
  # =====================================================
  # KMS Key for S3 Bucket Encryption
  # =====================================================
  SecureAppKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for SecureApp S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - kms:CreateGrant
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:GenerateDataKeyWithoutPlaintext
              - kms:ReEncryptFrom
              - kms:ReEncryptTo
              - kms:PutKeyPolicy
              - kms:GetKeyPolicy
              - kms:ListGrants
              - kms:ListKeys
              - kms:ListAliases
              - kms:DisableKey
              - kms:EnableKey
              - kms:ScheduleKeyDeletion
              - kms:CancelKeyDeletion
              - kms:CreateAlias            # Required for alias creation
              - kms:DeleteAlias            # Required for alias management
              - kms:UpdateAlias 
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: 'secureapp-kms-key'
        - Key: Environment
          Value: !Ref Environment

  # KMS Key Alias for easier reference
  SecureAppKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secureapp-s3-encryption-key
      TargetKeyId: !Ref SecureAppKMSKey

  # =====================================================
  # S3 Buckets with KMS Encryption
  # =====================================================
  
  # Primary application data bucket
  SecureAppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-data-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureAppKMSKey
            BucketKeyEnabled: true # Reduces KMS costs
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref SecureAppLogsBucket
        LogFilePrefix: 'access-logs/data-bucket/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref SecureAppS3LogGroup
      Tags:
        - Key: Name
          Value: 'secureapp-data-bucket'
        - Key: Environment
          Value: !Ref Environment

  # Logs bucket for S3 access logging
  SecureAppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureAppKMSKey
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
            ExpirationInDays: 90 # Retain logs for 90 days
      Tags:
        - Key: Name
          Value: 'secureapp-logs-bucket'
        - Key: Environment
          Value: !Ref Environment

  # Backup bucket for critical data
  SecureAppBackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secureapp-backup-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureAppKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'secureapp-backup-bucket'
        - Key: Environment
          Value: !Ref Environment

  # =====================================================
  # IAM Roles with Least Privilege Access
  # =====================================================
  
  # Read-only role for data bucket access
  SecureAppReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'secureapp-readonly-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'sts:ExternalId': 'secureapp-readonly-access'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsReadOnlyAccess
      Tags:
        - Key: Name
          Value: 'secureapp-readonly-role'
        - Key: Environment
          Value: !Ref Environment

  # Read-only policy for S3 data bucket
  SecureAppReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: 'secureapp-readonly-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3ReadAccess
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
              - s3:ListBucket
            Resource:
              - !GetAtt SecureAppDataBucket.Arn
              - !Sub '${SecureAppDataBucket.Arn}/*'
          - Sid: AllowKMSDecryption
            Effect: Allow
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: !GetAtt SecureAppKMSKey.Arn
      Roles:
        - !Ref SecureAppReadOnlyRole

  # Read-write role for application services
  SecureAppReadWriteRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'secureapp-readwrite-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 
                - ec2.amazonaws.com
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      Tags:
        - Key: Name
          Value: 'secureapp-readwrite-role'
        - Key: Environment
          Value: !Ref Environment

  # Read-write policy for S3 buckets
  SecureAppReadWritePolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: 'secureapp-readwrite-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3ReadWriteAccess
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
            Resource:
              - !GetAtt SecureAppDataBucket.Arn
              - !Sub '${SecureAppDataBucket.Arn}/*'
              - !GetAtt SecureAppBackupBucket.Arn
              - !Sub '${SecureAppBackupBucket.Arn}/*'
          - Sid: AllowKMSOperations
            Effect: Allow
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: !GetAtt SecureAppKMSKey.Arn
      Roles:
        - !Ref SecureAppReadWriteRole

  # Backup role with specific backup bucket access
  SecureAppBackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'secureapp-backup-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      Tags:
        - Key: Name
          Value: 'secureapp-backup-role'
        - Key: Environment
          Value: !Ref Environment

  # Backup policy with least privilege for backup operations
  SecureAppBackupPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: 'secureapp-backup-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowBackupOperations
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
            Resource:
              - !GetAtt SecureAppDataBucket.Arn
              - !Sub '${SecureAppDataBucket.Arn}/*'
              - !GetAtt SecureAppBackupBucket.Arn
              - !Sub '${SecureAppBackupBucket.Arn}/*'
          - Sid: AllowKMSForBackup
            Effect: Allow
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: !GetAtt SecureAppKMSKey.Arn
      Roles:
        - !Ref SecureAppBackupRole

  # =====================================================
  # CloudWatch Logging Configuration
  # =====================================================
  
  # CloudWatch Log Group for S3 events
  SecureAppS3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/secureapp/s3-events'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: 'secureapp-s3-logs'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for CloudFormation events
  SecureAppCloudFormationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/secureapp/cloudformation-events'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: 'secureapp-cloudformation-logs'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group for application logs
  SecureAppApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/secureapp/application'
      RetentionInDays: 7
      Tags:
        - Key: Name
          Value: 'secureapp-application-logs'
        - Key: Environment
          Value: !Ref Environment

  # =====================================================
  # CloudTrail for API Logging (Optional but Recommended)
  # =====================================================
  
  # CloudTrail for comprehensive API logging
  SecureAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: 'secureapp-cloudtrail'
      S3BucketName: !Ref SecureAppLogsBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureAppDataBucket}/*'
                - !Sub '${SecureAppBackupBucket}/*'
      Tags:
        - Key: Name
          Value: 'secureapp-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

# =====================================================
# Outputs
# =====================================================
Outputs:
  DataBucketName:
    Description: 'Name of the primary data bucket'
    Value: !Ref SecureAppDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-DataBucket'

  BackupBucketName:
    Description: 'Name of the backup bucket'
    Value: !Ref SecureAppBackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-BackupBucket'

  LogsBucketName:
    Description: 'Name of the logs bucket'
    Value: !Ref SecureAppLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-LogsBucket'

  KMSKeyId:
    Description: 'KMS Key ID for S3 encryption'
    Value: !Ref SecureAppKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'

  KMSKeyAlias:
    Description: 'KMS Key Alias for S3 encryption'
    Value: !Ref SecureAppKMSKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'

  ReadOnlyRoleArn:
    Description: 'ARN of the read-only IAM role'
    Value: !GetAtt SecureAppReadOnlyRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReadOnlyRole'

  ReadWriteRoleArn:
    Description: 'ARN of the read-write IAM role'
    Value: !GetAtt SecureAppReadWriteRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReadWriteRole'

  BackupRoleArn:
    Description: 'ARN of the backup IAM role'
    Value: !GetAtt SecureAppBackupRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BackupRole'

  S3LogGroupName:
    Description: 'CloudWatch Log Group for S3 events'
    Value: !Ref SecureAppS3LogGroup
    Export:
      Name: !Sub '${AWS::StackName}-S3LogGroup'

  CloudFormationLogGroupName:
    Description: 'CloudWatch Log Group for CloudFormation events'
    Value: !Ref SecureAppCloudFormationLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-CFLogGroup'
```

## Key Security Features Implemented

###  **Encryption at Rest**
- All S3 buckets use **SSE-KMS** encryption with a dedicated KMS key
- **BucketKeyEnabled** reduces KMS API costs while maintaining security
- KMS key policy allows S3 service access for encryption operations

###  **Least Privilege IAM Roles**
- **Read-Only Role**: Only `GetObject`, `ListBucket`, and KMS decrypt permissions
- **Read-Write Role**: Limited to necessary S3 operations and KMS key usage
- **Backup Role**: Specific permissions for backup operations only
- External ID condition for additional security on role assumption

###  **Comprehensive Logging**
- **CloudWatch Log Groups** for different event types with appropriate retention
- **S3 Access Logging** to dedicated logs bucket
- **CloudTrail** for API-level auditing of S3 operations
- **Lifecycle policies** on logs bucket to manage storage costs

###  **Infrastructure Best Practices**
- All resources prefixed with `secureapp` as required
- **Public access blocked** on all S3 buckets
- **Versioning enabled** on critical buckets
- **Resource tagging** for better management and cost allocation
- **Cross-stack exports** for resource sharing

## Deployment Instructions

1. Save the template as `TapStack.yml`
2. Deploy using AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name secureapp-infrastructure \
     --template-body file://TapStack.yml \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2 \
     --parameters ParameterKey=Environment,ParameterValue=prod
   ```

This template provides enterprise-grade security while maintaining operational flexibility and comprehensive audit capabilities.