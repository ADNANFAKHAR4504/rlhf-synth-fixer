# CloudFormation Template for Secure S3 Bucket

Based on the requirements, I'll create a CloudFormation template that sets up a secure S3 bucket with the following features:

1. S3 bucket with versioning enabled
2. Server-side encryption using AWS KMS
3. VPC-restricted access through bucket policy
4. Access logging to a separate S3 bucket
5. Object Lock configuration for compliance

## secure-s3-template.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket with comprehensive security configurations'

Parameters:
  VpcId:
    Type: String
    Default: 'vpc-123abc456'
    Description: 'VPC ID that will have access to the S3 bucket'
  
  BucketNamePrefix:
    Type: String
    Default: 'secure-bucket'
    Description: 'Prefix for the S3 bucket name'

Resources:
  # KMS Key for S3 encryption
  S3EncryptionKey:
    Type: 'AWS::KMS::Key'
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
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
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  # KMS Key Alias
  S3EncryptionKeyAlias:
    Type: 'AWS::KMS::Alias'
    Properties:
      AliasName: 'alias/s3-encryption-key'
      TargetKeyId: !Ref S3EncryptionKey

  # S3 Bucket for storing access logs
  AccessLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${BucketNamePrefix}-access-logs-${AWS::AccountId}-${AWS::Region}'
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
          - Id: DeleteLogsAfter90Days
            Status: Enabled
            ExpirationInDays: 90

  # Main secure S3 bucket
  SecureS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${BucketNamePrefix}-main-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 1
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'access-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        EventBridgeConfiguration:
          EventBridgeEnabled: true

  # Bucket policy for VPC restriction
  SecureS3BucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAccessFromOutsideVPC
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              StringNotEquals:
                'aws:SourceVpc': !Ref VpcId
          - Sid: AllowVPCAccess
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !Ref SecureS3Bucket
            Condition:
              StringEquals:
                'aws:SourceVpc': !Ref VpcId

  # CloudWatch Log Group for S3 access monitoring
  S3AccessLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/s3/access-logs/${SecureS3Bucket}'
      RetentionInDays: 30

Outputs:
  SecureS3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3BucketName'

  SecureS3BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecureS3BucketArn'

  AccessLogsBucketName:
    Description: 'Name of the access logs bucket'
    Value: !Ref AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AccessLogsBucketName'

  KMSKeyId:
    Description: 'KMS Key ID used for encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyAlias:
    Description: 'KMS Key Alias'
    Value: !Ref S3EncryptionKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'
```

This CloudFormation template creates:

1. **Secure S3 Bucket** with versioning enabled and object lock configuration
2. **KMS encryption** using a dedicated KMS key for server-side encryption
3. **VPC-restricted access** through bucket policy that denies access from outside the specified VPC
4. **Access logging** to a separate S3 bucket with lifecycle policies
5. **Object Lock** with compliance mode and 1-year retention
6. **Public access block** configurations to prevent accidental public access
7. **EventBridge integration** for advanced event monitoring
8. **CloudWatch Log Group** for access monitoring

The template includes latest AWS features like:
- BucketKeyEnabled for cost optimization with KMS
- EventBridge integration for S3 events
- Enhanced security with comprehensive bucket policies

All resources follow AWS best practices for security and compliance.