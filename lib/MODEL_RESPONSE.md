I'll help you create a secure CloudFormation template that meets all your requirements. Here's a comprehensive YAML template with proper security configurations:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 data storage with encryption, access controls, and lifecycle management'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, test, prod]
    Description: Environment name for resource tagging and naming
  
  ProjectName:
    Type: String
    Default: secure-data-storage
    Description: Project name for resource naming and tagging
  
  DataRetentionDays:
    Type: Number
    Default: 30
    MinValue: 1
    MaxValue: 365
    Description: Number of days before transitioning data to Glacier

Resources:
  # KMS Key for S3 encryption - gives us control over encryption keys
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} S3 bucket encryption in ${Environment}'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
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
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: S3-Encryption

  # KMS Key Alias for easier management
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-s3-${Environment}'
      TargetKeyId: !Ref S3EncryptionKey

  # Main S3 bucket with comprehensive security settings
  SecureDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-secure-data-${Environment}-${AWS::AccountId}'
      # Encryption configuration - AES-256 with KMS
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true # Reduces KMS costs
      # Block all public access - critical for security
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Lifecycle policy for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: !Ref DataRetentionDays
                StorageClass: GLACIER
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      # Notification for monitoring (optional)
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: DataClassification
          Value: Sensitive

  # Bucket policy to enforce secure access
  SecureDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureDataBucket
      PolicyDocument:
        Statement:
          # Deny any unencrypted uploads
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${SecureDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          # Deny insecure transport (force HTTPS)
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Ref SecureDataBucket
            Condition:
              Bool:
                'aws:SecureTransport': false

  # IAM role for data administrators with MFA requirement
  DataAdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-data-admin-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': true # MFA required
              NumericLessThan:
                'aws:MultiFactorAuthAge': 3600 # MFA must be recent (1 hour)
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchLogsReadOnlyAccess
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # IAM policy for data administrators - full access with MFA
  DataAdminPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-data-admin-policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Full S3 access to the secure bucket
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
              - s3:GetBucketLocation
              - s3:RestoreObject
            Resource:
              - !Ref SecureDataBucket
              - !Sub '${SecureDataBucket}/*'
          # KMS permissions for encryption/decryption
          - Effect: Allow
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:DescribeKey
            Resource: !GetAtt S3EncryptionKey.Arn
      Roles:
        - !Ref DataAdminRole

  # IAM role for read-only access (for applications/analysts)
  DataReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-data-readonly-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': true # MFA required
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # IAM policy for read-only access
  DataReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-data-readonly-policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Read-only S3 access
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - !Ref SecureDataBucket
              - !Sub '${SecureDataBucket}/*'
          # KMS decrypt permissions
          - Effect: Allow
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: !GetAtt S3EncryptionKey.Arn
      Roles:
        - !Ref DataReadOnlyRole

  # CloudTrail for audit logging
  DataAccessCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub '${ProjectName}-data-access-trail-${Environment}'
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: !Sub '${ProjectName}-${Environment}/'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      # Focus on data events for our S3 bucket
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: false
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureDataBucket}/*'
            - Type: AWS::S3::Bucket
              Values:
                - !Ref SecureDataBucket
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Separate bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-logs-${Environment}-${AWS::AccountId}'
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90 # Keep logs for 90 days
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: CloudTrail-Logs

  # CloudTrail logs bucket policy
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailLogsBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

Outputs:
  SecureBucketName:
    Description: Name of the secure S3 bucket
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureBucketName'

  SecureBucketArn:
    Description: ARN of the secure S3 bucket
    Value: !GetAtt SecureDataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecureBucketArn'

  KMSKeyId:
    Description: KMS Key ID for S3 encryption
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: KMS Key ARN for S3 encryption
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  DataAdminRoleArn:
    Description: ARN of the data administrator role
    Value: !GetAtt DataAdminRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataAdminRoleArn'

  DataReadOnlyRoleArn:
    Description: ARN of the data read-only role
    Value: !GetAtt DataReadOnlyRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataReadOnlyRoleArn'

  CloudTrailArn:
    Description: ARN of the CloudTrail for audit logging
    Value: !GetAtt DataAccessCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'
```

## Key Security Features Explained

### **Encryption & Key Management**
- **KMS encryption**: Uses customer-managed KMS keys instead of S3-managed keys for better control
- **Bucket key enabled**: Reduces KMS API calls and costs while maintaining security
- **Enforced encryption**: Bucket policy denies any unencrypted uploads

### **Access Control**
- **MFA required**: Both IAM roles require multi-factor authentication
- **Time-limited MFA**: MFA must be used within the last hour
- **Principle of least privilege**: Separate roles for admin vs read-only access
- **HTTPS only**: Bucket policy denies any non-HTTPS requests

### **Public Access Prevention**
- **Complete public access block**: All four settings enabled to prevent accidental exposure
- **No public ACLs or policies**: Bucket is completely private

### **Monitoring & Auditing**
- **CloudTrail data events**: Logs all access to your S3 bucket objects
- **Separate audit log storage**: CloudTrail logs stored in dedicated bucket
- **Multi-region trail**: Captures events from all AWS regions

### **Cost Optimization**
- **Lifecycle management**: Automatically moves data to Glacier after specified days
- **Cleanup rules**: Removes incomplete multipart uploads after 7 days
- **Log retention**: CloudTrail logs automatically deleted after 90 days

## Deployment Instructions

1. **Save the template** as `secure-storage.yaml`

2. **Deploy using AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name secure-data-storage-dev \
  --template-body file://secure-storage.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=ProjectName,ParameterValue=your-project \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Or deploy via AWS Console**:
   - Go to CloudFormation → Create Stack
   - Upload the template file
   - Fill in parameters (Environment, ProjectName, etc.)
   - Check "I acknowledge that AWS CloudFormation might create IAM resources with custom names"

## Usage After Deployment

**To assume the admin role** (with MFA):
```bash
aws sts assume-role \
  --role-arn "arn:aws:iam::ACCOUNT-ID:role/PROJECT-data-admin-ENVIRONMENT" \
  --role-session-name "admin-session" \
  --serial-number "arn:aws:iam::ACCOUNT-ID:mfa/USERNAME" \
  --token-code "MFA-CODE"
```

This template provides enterprise-grade security while remaining maintainable and cost-effective. All resources are properly tagged for cost tracking, and the modular design makes it easy to modify for different environments.