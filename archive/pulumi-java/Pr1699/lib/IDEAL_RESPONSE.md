# S3 Bucket Infrastructure

This solution creates a secure S3 bucket with versioning enabled and appropriate security configurations.

## Infrastructure Code

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket with versioning and encryption'

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

Outputs:
  BucketName:
    Description: Name of the created S3 bucket
    Value: !Ref MySecureStorageBucket
    Export:
      Name: !Sub "${AWS::StackName}-BucketName"

  BucketArn:
    Description: ARN of the created S3 bucket
    Value: !GetAtt MySecureStorageBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-BucketArn"
```
## Key Features
- **Versioning**: Enabled to maintain object history
- **Encryption**: AES256 server-side encryption for data at rest
- **Security**: Complete public access blocking
- **Tagging**: Environment tag for resource management
- **Outputs**: Bucket name and ARN for reference by other stacks