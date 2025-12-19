# Secure S3 Bucket CloudFormation Template

This CloudFormation template creates a gold standard secure S3 bucket with comprehensive security controls and compliance features including:

- KMS encryption with key rotation
- Bucket policy enforcing encryption and secure transport
- Access logging to a dedicated logging bucket
- Lifecycle policies for cost optimization
- Cross-account access for trusted partners
- Public access blocking

## CloudFormation Template

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

## Security Features

1. **KMS Encryption**: Customer-managed KMS key with automatic rotation enabled
2. **Bucket Policy**: Enforces encryption at rest and in transit
3. **Access Logging**: All access logged to dedicated logging bucket
4. **Public Access Block**: All public access blocked by default
5. **Cross-Account Access**: Controlled read access for trusted external partners
6. **Lifecycle Policies**: Automatic transition to cheaper storage classes

## Outputs

- `SecureBucketName`: Name of the secure S3 bucket
- `KMSKeyArn`: ARN of the KMS encryption key
- `LoggingBucketName`: Name of the access logging bucket
- `KMSKeyAlias`: Alias of the KMS key for reference
