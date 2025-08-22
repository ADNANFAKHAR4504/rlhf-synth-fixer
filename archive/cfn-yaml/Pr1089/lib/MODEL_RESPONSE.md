# FinApp-Security.yaml CloudFormation Template

Here's a complete CloudFormation template that meets all your security requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket and IAM role for FinApp with encryption, access controls, and least-privilege permissions'

Resources:
  # S3 Bucket with encryption and security controls
  FinAppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'finapp-secure-bucket-${AWS::AccountId}-${AWS::Region}'
      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Enable versioning for better data protection
      VersioningConfiguration:
        Status: Enabled
      # Configure server-side encryption with S3-managed keys
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      # Lifecycle configuration to manage costs
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7

  # Bucket policy to enforce HTTPS/SSL connections
  FinAppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FinAppS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${FinAppS3Bucket}/*'
              - !GetAtt FinAppS3Bucket.Arn
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM Role for EC2 instances to access S3
  FinAppS3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'FinApp-S3AccessRole-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      Tags:
        - Key: Application
          Value: FinApp
        - Key: Purpose
          Value: S3Access

  # Least-privilege IAM policy for S3 access
  FinAppS3AccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: FinApp-S3AccessPolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3ObjectOperations
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource: !Sub '${FinAppS3Bucket}/*'
          - Sid: AllowS3BucketLocationAccess
            Effect: Allow
            Action:
              - s3:GetBucketLocation
            Resource: !GetAtt FinAppS3Bucket.Arn
      Roles:
        - !Ref FinAppS3AccessRole

  # Instance profile to attach role to EC2 instances
  FinAppS3AccessInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'FinApp-S3AccessInstanceProfile-${AWS::Region}'
      Path: /
      Roles:
        - !Ref FinAppS3AccessRole

Outputs:
  S3BucketName:
    Description: 'Name of the secure S3 bucket for FinApp'
    Value: !Ref FinAppS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3AccessRoleArn:
    Description: 'ARN of the IAM role for S3 access'
    Value: !GetAtt FinAppS3AccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3AccessRoleArn'

  S3BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt FinAppS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  InstanceProfileArn:
    Description: 'ARN of the instance profile for EC2 attachment'
    Value: !GetAtt FinAppS3AccessInstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-InstanceProfileArn'
```

## Key Security Features Implemented

### 1. **Secure S3 Bucket (FinAppS3Bucket)**
- **Encryption at Rest**: Configured with `BucketEncryption` using `AES256` (SSE-S3)
- **Encryption in Transit**: Bucket policy explicitly denies non-HTTPS requests using the `aws:SecureTransport` condition
- **Access Control**: `PublicAccessBlockConfiguration` blocks all public access
- **Additional Security**: Versioning enabled and lifecycle rules for incomplete multipart uploads

### 2. **Least-Privilege IAM Role (FinAppS3AccessRole)**
- **Service Principal**: Configured for EC2 service assumption
- **Minimal Permissions**: Policy grants only `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject`
- **Resource Scoping**: Permissions limited to the specific bucket and its objects
- **Bucket Location**: Minimal additional permission for `s3:GetBucketLocation` (required for S3 operations)

### 3. **Security Best Practices**
- Unique bucket naming with account ID and region to avoid conflicts
- Resource tagging for governance
- Exported outputs for cross-stack references
- Comprehensive bucket policy for transport security

## Deployment Instructions

1. Save the template as `FinApp-Security.yaml`
2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name FinApp-Security \
  --template-body file://FinApp-Security.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Usage Example

After deployment, attach the instance profile to an EC2 instance:
```bash
aws ec2 associate-iam-instance-profile \
  --instance-id i-1234567890abcdef0 \
  --iam-instance-profile Name=FinApp-S3AccessInstanceProfile-us-east-1
```

This template provides a secure foundation for financial applications with defense-in-depth security controls and follows AWS security best practices.