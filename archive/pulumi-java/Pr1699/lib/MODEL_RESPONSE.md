# S3 Bucket Creation

I'll create a secure S3 bucket with the requested specifications.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MySecureStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-secure-storage-bucket
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
      Tags:
        - Key: Environment
          Value: Development
```
This CloudFormation template creates an S3 bucket with versioning enabled, AES256 encryption, and blocks all public access as requested.