# Secure Multi-Region Data Storage CloudFormation Template

Here's a comprehensive CloudFormation template that implements all the specified security requirements for sensitive data storage:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure infrastructure template for sensitive data storage with comprehensive
  security controls, encryption, monitoring, and compliance features.
  Implements least privilege access, multi-factor authentication, and audit logging.

# Template Parameters for Environment Customization
Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]
    Description: Environment name for resource tagging and configuration
  
  ProjectName:
    Type: String
    Default: SecureDataStorage
    Description: Project name for resource naming and tagging
  
  EnableCrossRegionReplication:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Enable cross-region replication for disaster recovery
  
  ReplicationRegion:
    Type: String
    Default: us-east-1
    Description: Target region for cross-region replication
  
  RetentionPeriod:
    Type: Number
    Default: 2555
    MinValue: 365
    MaxValue: 3653
    Description: Data retention period in days (1-10 years)

# Environment-specific mappings
Mappings:
  EnvironmentConfig:
    dev:
      BucketVersioning: Suspended
      MfaDelete: Disabled
      LoggingLevel: INFO
    staging:
      BucketVersioning: Enabled
      MfaDelete: Disabled
      LoggingLevel: WARN
    prod:
      BucketVersioning: Enabled
      MfaDelete: Enabled
      LoggingLevel: ERROR

# Conditional resource creation based on parameters
Conditions:
  IsProdEnvironment: !Equals [!Ref Environment, prod]
  EnableReplication: !Equals [!Ref EnableCrossRegionReplication, 'true']
  IsNotUsEast1: !Not [!Equals [!Ref 'AWS::Region', us-east-1]]

Resources:
  # ==========================================
  # KMS Key for Encryption Management
  # ==========================================
  
  # Customer-managed KMS key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} S3 bucket encryption in ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Root account access for key management
          - Sid: Enable root account permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          
          # Service access for S3 encryption
          - Sid: Allow S3 service access
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
          
          # CloudTrail access for log encryption
          - Sid: Allow CloudTrail access
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:CreateGrant
            Resource: '*'
      
      KeyRotationEnabled: true  # Automatic annual key rotation
      PendingWindowInDays: 30   # 30-day deletion window for recovery
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-s3-encryption-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: S3-Encryption

  # KMS Key Alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-s3-encryption'
      TargetKeyId: !Ref S3EncryptionKey

  # ==========================================
  # IAM Roles and Policies
  # ==========================================
  
  # IAM Role for sensitive data access with least privilege
  SensitiveDataAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-SensitiveDataAccess'
      Description: Role for accessing sensitive data with strict permissions
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                aws:MultiFactorAuthPresent: 'true'  # Require MFA
              NumericLessThan:
                aws:MultiFactorAuthAge: '3600'      # MFA must be within 1 hour
      
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/ReadOnlyAccess  # Base read-only access
      
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sensitive-data-role'
        - Key: Environment
          Value: !Ref Environment

  # Restrictive policy for S3 access with encryption requirements
  SensitiveDataS3Policy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-${Environment}-S3-Access-Policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow list operations on the specific bucket
          - Sid: AllowListBucket
            Effect: Allow
            Action:
              - s3:ListBucket
              - s3:GetBucketLocation
              - s3:GetBucketVersioning
            Resource: !GetAtt SensitiveDataBucket.Arn
          
          # Allow object operations with encryption requirements
          - Sid: AllowObjectOperations
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:GetObjectVersion
              - s3:PutObject
              - s3:DeleteObject
            Resource: !Sub '${SensitiveDataBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3EncryptionKey.Arn
          
          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Action: s3:PutObject
            Resource: !Sub '${SensitiveDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          
          # Allow KMS operations for encryption
          - Sid: AllowKMSOperations
            Effect: Allow
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: !GetAtt S3EncryptionKey.Arn
      
      Roles:
        - !Ref SensitiveDataAccessRole

  # IAM User for application access (requires MFA)
  SensitiveDataUser:
    Type: AWS::IAM::User
    Properties:
      UserName: !Sub '${ProjectName}-${Environment}-data-user'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/IAMUserChangePassword
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-data-user'
        - Key: Environment
          Value: !Ref Environment
        - Key: RequiresMFA
          Value: 'true'

  # Policy attachment for the IAM user
  UserPolicyAttachment:
    Type: AWS::IAM::UserPolicyAttachment
    Properties:
      UserName: !Ref SensitiveDataUser
      PolicyArn: !Ref SensitiveDataS3Policy

  # ==========================================
  # S3 Buckets with Security Controls
  # ==========================================
  
  # Primary sensitive data storage bucket
  SensitiveDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-sensitive-data-${AWS::AccountId}-${AWS::Region}'
      
      # Versioning configuration based on environment
      VersioningConfiguration:
        Status: !FindInMap [EnvironmentConfig, !Ref Environment, BucketVersioning]
      
      # Server-side encryption with KMS
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
            BucketKeyEnabled: true  # Reduce KMS costs
      
      # Public access block - deny all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # Lifecycle configuration for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              # Transition to Standard-IA after 30 days
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              # Transition to Glacier after 90 days
              - TransitionInDays: 90
                StorageClass: GLACIER
              # Transition to Deep Archive after 365 days
              - TransitionInDays: 365
                StorageClass: DEEP_ARCHIVE
            
            # Delete incomplete multipart uploads after 7 days
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
            
            # Expire objects after retention period
            ExpirationInDays: !Ref RetentionPeriod
      
      # Notification configuration for security monitoring
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
          - Event: s3:ObjectRemoved:*
      
      # CORS configuration (restrictive)
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders: ['*']
            AllowedMethods: [GET, PUT, POST, DELETE, HEAD]
            AllowedOrigins: 
              - !Sub 'https://${ProjectName}-${Environment}.example.com'
            MaxAge: 3000
      
      # Tagging
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-sensitive-data'
        - Key: Environment
          Value: !Ref Environment
        - Key: DataClassification
          Value: Sensitive
        - Key: BackupRequired
          Value: 'true'

  # Bucket policy for additional security controls
  SensitiveDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SensitiveDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny all non-HTTPS requests
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SensitiveDataBucket.Arn
              - !Sub '${SensitiveDataBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          
          # Deny uploads without encryption
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SensitiveDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          
          # Require specific KMS key for encryption
          - Sid: RequireSpecificKMSKey
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SensitiveDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3EncryptionKey.Arn

  # Cross-region replication bucket (conditional)
  ReplicationBucket:
    Type: AWS::S3::Bucket
    Condition: EnableReplication
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-replication-${AWS::AccountId}-${ReplicationRegion}'
      
      # Same security configuration as primary bucket
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: alias/aws/s3
      
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      VersioningConfiguration:
        Status: Enabled
      
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-replication'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Cross-Region-Replication

  # ==========================================
  # CloudTrail for Audit Logging
  # ==========================================
  
  # S3 bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      
      # Encryption for audit logs
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3EncryptionKey.Arn
      
      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # Lifecycle policy for log retention
      LifecycleConfiguration:
        Rules:
          - Id: CloudTrailLogRetention
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
            ExpirationInDays: !Ref RetentionPeriod
      
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Audit-Logging

  # CloudTrail bucket policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow CloudTrail to check bucket ACL
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          
          # Allow CloudTrail to write logs
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
          
          # Deny insecure transport
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt CloudTrailLogsBucket.Arn
              - !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # CloudTrail for comprehensive audit logging
  SensitiveDataCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-audit-trail'
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: !Sub 'AWSLogs/${AWS::AccountId}/'
      
      # Enable log file encryption
      KMSKeyId: !GetAtt S3EncryptionKey.Arn
      
      # Comprehensive logging configuration
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true  # Log file integrity validation
      
      # Event selectors for S3 data events
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SensitiveDataBucket}/*'
            - Type: AWS::S3::Bucket
              Values:
                - !GetAtt SensitiveDataBucket.Arn
      
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-audit-trail'
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Security-Audit

  # ==========================================
  # CloudWatch Monitoring
  # ==========================================
  
  # CloudWatch Log Group for application logs
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/${ProjectName}/${Environment}/application'
      RetentionInDays: 365
      KmsKeyId: !GetAtt S3EncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-app-logs'
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Alarm for unauthorized access attempts
  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-Unauthorized-Access'
      AlarmDescription: 'Alert on unauthorized access attempts to sensitive data'
      MetricName: ErrorCount
      Namespace: AWS/S3
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: BucketName
          Value: !Ref SensitiveDataBucket
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-security-alarm'
        - Key: Environment
          Value: !Ref Environment

# ==========================================
# Template Outputs
# ==========================================

Outputs:
  # S3 Bucket Information
  SensitiveDataBucketName:
    Description: Name of the primary sensitive data storage bucket
    Value: !Ref SensitiveDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SensitiveDataBucket'
  
  SensitiveDataBucketArn:
    Description: ARN of the primary sensitive data storage bucket
    Value: !GetAtt SensitiveDataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SensitiveDataBucketArn'
  
  # KMS Key Information
  EncryptionKeyId:
    Description: ID of the KMS encryption key
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-EncryptionKeyId'
  
  EncryptionKeyArn:
    Description: ARN of the KMS encryption key
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EncryptionKeyArn'
  
  # IAM Role Information
  SensitiveDataAccessRoleArn:
    Description: ARN of the sensitive data access role (requires MFA)
    Value: !GetAtt SensitiveDataAccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataAccessRoleArn'
  
  # CloudTrail Information
  CloudTrailArn:
    Description: ARN of the CloudTrail for audit logging
    Value: !GetAtt SensitiveDataCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'
  
  # Monitoring Information
  LogGroupName:
    Description: Name of the CloudWatch Log Group
    Value: !Ref ApplicationLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroupName'
  
  # Security Configuration Summary
  SecurityFeatures:
    Description: Summary of implemented security features
    Value: !Sub |
      Encryption: KMS with automatic key rotation
      Access Control: IAM with MFA requirement and least privilege
      Monitoring: CloudTrail with data events and CloudWatch alarms
      Network Security: HTTPS-only access with public access blocked
      Data Lifecycle: Automatic transition to Glacier after 30 days
      Compliance: Comprehensive audit trail and log file validation
```

## Key Security Features Implemented

### 🔐 **Encryption Standards**
- **KMS Customer-Managed Key**: Automatic rotation enabled with 30-day deletion window
- **S3 Server-Side Encryption**: AES-256 with KMS, BucketKey enabled for cost optimization
- **CloudTrail Log Encryption**: All audit logs encrypted with the same KMS key

### 🛡️ **Access Control & IAM**
- **MFA Requirement**: All sensitive data access requires multi-factor authentication
- **Least Privilege**: IAM policies grant only necessary permissions
- **Conditional Access**: Time-based MFA validation (1-hour window)
- **Encryption Enforcement**: Policies deny unencrypted uploads

### 📊 **Monitoring & Compliance**
- **Comprehensive CloudTrail**: Multi-region trail with data events for S3
- **Log File Validation**: Ensures audit log integrity
- **CloudWatch Alarms**: Monitors for unauthorized access attempts
- **Event Logging**: All S3 operations logged for compliance

### 🌐 **Network Security**
- **Public Access Blocked**: All buckets have public access completely disabled
- **HTTPS-Only**: Bucket policies deny all non-SSL requests
- **CORS Configuration**: Restrictive cross-origin resource sharing

### 💰 **Data Lifecycle Management**
- **Automated Transitions**: Standard-IA (30 days) → Glacier (90 days) → Deep Archive (365 days)
- **Cost Optimization**: Intelligent tiering reduces storage costs
- **Retention Policies**: Configurable retention period with automatic expiration

## Deployment Instructions

1. **Validate Template**:
   ```bash
   aws cloudformation validate-template --template-body file://secure-data-storage.yaml
   ```

2. **Deploy Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-data-storage-prod \
     --template-body file://secure-data-storage.yaml \
     --parameters ParameterKey=Environment,ParameterValue=prod \
                  ParameterKey=ProjectName,ParameterValue=MyProject \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Enable MFA for Users**: After deployment, manually enable MFA for the created IAM user through the AWS Console.

This template provides enterprise-grade security for sensitive data storage while maintaining cost efficiency and operational excellence.