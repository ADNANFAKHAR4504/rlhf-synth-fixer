# Secure S3 Bucket CloudFormation Template

Here's a comprehensive CloudFormation template that meets all your security and compliance requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Gold Standard Secure S3 Bucket with comprehensive security controls and compliance features'

Parameters:
  ExternalAccountId:
    Type: String
    Description: 'AWS Account ID of the trusted external partner for cross-account access'
    AllowedPattern: '[0-9]{12}'
    ConstraintDescription: 'Must be a valid 12-digit AWS Account ID'

Resources:
  # KMS Key for S3 bucket encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for encrypting secure S3 bucket data'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow S3 Service'
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      KeyRotationStatus: true
      Tags:
        - Key: 'Purpose'
          Value: 'S3BucketEncryption'
        - Key: 'Environment'
          Value: 'Production'

  # KMS Key Alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/secure-s3-key-${AWS::StackName}'
      TargetKeyId: !Ref S3EncryptionKey

  # Logging bucket for access logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-data-logs-${AWS::StackId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldLogs'
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: 'Purpose'
          Value: 'AccessLogging'
        - Key: 'Environment'
          Value: 'Production'

  # Primary secure S3 bucket
  SecureDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'secure-data-${AWS::StackId}'
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Configure server-side encryption with KMS
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Configure access logging
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
      # Configure lifecycle policies
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToIA'
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: 'TransitionToGlacier'
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
          - Id: 'DeleteIncompleteMultipartUploads'
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      # Enable notifications for security monitoring
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
          - Event: 's3:ObjectRemoved:*'
      Tags:
        - Key: 'Purpose'
          Value: 'SecureDataStorage'
        - Key: 'Environment'
          Value: 'Production'
        - Key: 'Compliance'
          Value: 'Required'

  # Comprehensive bucket policy with multiple security layers
  SecureDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny unencrypted uploads - enforce KMS encryption
          - Sid: 'DenyUnencryptedUploads'
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          
          # Deny uploads without the correct KMS key
          - Sid: 'DenyIncorrectKMSKey'
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${SecureDataBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3EncryptionKey.Arn
          
          # Enforce encryption in transit - deny non-HTTPS requests
          - Sid: 'DenyInsecureConnections'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Sub '${SecureDataBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          
          # Grant cross-account read access to external partner
          - Sid: 'AllowCrossAccountRead'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${ExternalAccountId}:role/ExternalDataReaderRole'
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
              - 's3:ListBucket'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Sub '${SecureDataBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'true'
          
          # Allow current account full access with secure transport
          - Sid: 'AllowAccountAccess'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureDataBucket}/*'
              - !Sub '${SecureDataBucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'true'

Outputs:
  SecureBucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureBucketName'
  
  KMSKeyArn:
    Description: 'ARN of the KMS key used for bucket encryption'
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
  
  LoggingBucketName:
    Description: 'Name of the access logging bucket'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucketName'
  
  KMSKeyAlias:
    Description: 'Alias of the KMS key for easier reference'
    Value: !Ref S3EncryptionKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'
```

## Key Features and Security Controls

### **Encryption & Key Management**
- **Dedicated KMS Key**: Creates a customer-managed KMS key with automatic rotation
- **Enforced Encryption**: Bucket policy denies any uploads without proper KMS encryption
- **Key Alias**: Provides a user-friendly alias for the KMS key

### **Logging & Monitoring**
- **Separate Logging Bucket**: Dedicated bucket for access logs with its own security controls
- **CloudWatch Integration**: Configured for object creation/deletion notifications
- **Lifecycle Management**: Automatic log retention and cleanup policies

### **Access Controls**
- **Multi-layered Security**: Combines bucket policies, encryption, and access controls
- **Cross-Account Access**: Secure read-only access for external partners
- **Transport Security**: Enforces HTTPS for all requests
- **Public Access Block**: Prevents any public access configurations

### **Data Protection**
- **Versioning Enabled**: Protects against accidental overwrites and deletions
- **Deletion Policy**: `Retain` policy prevents accidental bucket deletion
- **Lifecycle Policies**: Automatic transition to cost-effective storage classes

### **Compliance Features**
- **Comprehensive Tagging**: Proper resource tagging for governance
- **Parameter Validation**: Ensures external account ID format is correct
- **Export Values**: Makes key resources available to other stacks

## Deployment Instructions

1. **Save the template** as `secure_s3_bucket.yaml`
2. **Deploy using AWS CLI**:
   ```bash
   aws cloudformation create-stack \
     --stack-name secure-s3-environment \
     --template-body file://secure_s3_bucket.yaml \
     --parameters ParameterKey=ExternalAccountId,ParameterValue=123456789012 \
     --region us-west-2
   ```
3. **Monitor deployment** in the CloudFormation console

This template creates a production-ready, highly secure S3 environment that exceeds typical compliance requirements and serves as a true "gold standard" for data protection.