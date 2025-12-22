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
