```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure AWS Infrastructure for Data Storage with KMS encryption and strict IAM access control in us-west-2"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming"

Resources:
  # ============================================================================
  # KMS Key for S3 Encryption
  # ============================================================================
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "KMS Key for S3 bucket encryption - ${EnvironmentSuffix}"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow S3 Service Access
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: "*"
            Condition:
              StringEquals:
                "kms:ViaService": "s3.us-west-2.amazonaws.com"
      KeySpec: SYMMETRIC_DEFAULT
      KeyUsage: ENCRYPT_DECRYPT
      Tags:
        - Key: Name
          Value: !Sub "secure-data-s3-key-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: "S3-Encryption"

  # KMS Key Alias
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/secure-data-s3-encryption-${EnvironmentSuffix}"
      TargetKeyId: !Ref S3EncryptionKey

  # ============================================================================
  # IAM Role for S3 Access with Strict Permissions
  # ============================================================================
  S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                "aws:RequestedRegion": "us-west-2"
          - Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                "aws:RequestedRegion": "us-west-2"
      Path: "/"
      Policies:
        - PolicyName: !Sub "S3AccessPolicy-${EnvironmentSuffix}"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              # Explicit Allow - S3 Bucket Operations (only for our buckets)
              - Sid: AllowS3BucketAccess
                Effect: Allow
                Action:
                  - s3:GetBucketLocation
                  - s3:GetBucketVersioning
                  - s3:ListBucket
                  - s3:ListBucketVersions
                  - s3:GetBucketNotification
                  - s3:GetBucketLogging
                  - s3:GetBucketTagging
                Resource:
                  - !Sub "arn:aws:s3:::${PrimaryDataBucket}"
                  - !Sub "arn:aws:s3:::${SecondaryDataBucket}"
                Condition:
                  StringEquals:
                    "aws:RequestedRegion": "us-west-2"

              # Explicit Allow - S3 Object Operations (only for our bucket objects)
              - Sid: AllowS3ObjectAccess
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                  - s3:PutObject
                  - s3:PutObjectAcl
                  - s3:DeleteObject
                  - s3:DeleteObjectVersion
                  - s3:GetObjectTagging
                  - s3:PutObjectTagging
                Resource:
                  - !Sub "arn:aws:s3:::${PrimaryDataBucket}/*"
                  - !Sub "arn:aws:s3:::${SecondaryDataBucket}/*"
                Condition:
                  StringEquals:
                    "aws:RequestedRegion": "us-west-2"

              # Explicit Allow - KMS Operations for S3 encryption
              - Sid: AllowKMSForS3
                Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:ReEncrypt*
                  - kms:DescribeKey
                Resource: !GetAtt S3EncryptionKey.Arn
                Condition:
                  StringEquals:
                    "kms:ViaService": "s3.us-west-2.amazonaws.com"

              # Explicit Deny - All other AWS services except S3 and KMS
              - Sid: DenyAllOtherServices
                Effect: Deny
                NotAction:
                  - s3:*
                  - kms:Decrypt
                  - kms:GenerateDataKey
                  - kms:ReEncrypt*
                  - kms:DescribeKey
                Resource: "*"

              # Explicit Deny - Operations outside us-west-2
              - Sid: DenyOperationsOutsideRegion
                Effect: Deny
                Action: "*"
                Resource: "*"
                Condition:
                  StringNotEquals:
                    "aws:RequestedRegion": "us-west-2"
      Tags:
        - Key: Name
          Value: !Sub "SecureDataS3AccessRole-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Instance Profile for EC2 attachment
  S3AccessInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: "/"
      Roles:
        - !Ref S3AccessRole

  # ============================================================================
  # S3 Buckets with KMS Encryption and Security Policies
  # ============================================================================

  # Primary Data Bucket
  PrimaryDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "secure-data-primary-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
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
          Value: !Sub "secure-data-primary-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: DataClassification
          Value: "Sensitive"
        - Key: Encryption
          Value: "KMS"

  # Secondary Data Bucket (for backup/redundancy)
  SecondaryDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "secure-data-secondary-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
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
          Value: !Sub "secure-data-secondary-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: DataClassification
          Value: "Sensitive"
        - Key: Encryption
          Value: "KMS"

  # Bucket Policies for additional security
  PrimaryBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref PrimaryDataBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${PrimaryDataBucket}/*"
              - !Sub "${PrimaryDataBucket}"
            Condition:
              Bool:
                "aws:SecureTransport": "false"
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: "*"
            Action: "s3:PutObject"
            Resource: !Sub "${PrimaryDataBucket}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": "aws:kms"
          - Sid: DenyOperationsOutsideRegion
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "arn:aws:s3:::${PrimaryDataBucket}/*"
              - !Sub "arn:aws:s3:::${PrimaryDataBucket}"
            Condition:
              StringNotEquals:
                "aws:RequestedRegion": "us-west-2"

  SecondaryBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecondaryDataBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${SecondaryDataBucket}/*"
              - !Sub "${SecondaryDataBucket}"
            Condition:
              Bool:
                "aws:SecureTransport": "false"
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: "*"
            Action: "s3:PutObject"
            Resource: !Sub "${SecondaryDataBucket}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": "aws:kms"
          - Sid: DenyOperationsOutsideRegion
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "arn:aws:s3:::${SecondaryDataBucket}/*"
              - !Sub "arn:aws:s3:::${SecondaryDataBucket}"
            Condition:
              StringNotEquals:
                "aws:RequestedRegion": "us-west-2"

Outputs:
  StackRegion:
    Description: "Deployment Region"
    Value: !Ref "AWS::Region"
    Export:
      Name: !Sub "${AWS::StackName}-StackRegion"

  KMSKeyId:
    Description: "KMS Key ID for S3 Encryption"
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub "${AWS::StackName}-KMSKeyId"

  KMSKeyArn:
    Description: "KMS Key ARN for S3 Encryption"
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-KMSKeyArn"

  IAMRoleArn:
    Description: "S3 Access IAM Role ARN"
    Value: !GetAtt S3AccessRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-IAMRoleArn"

  IAMRoleName:
    Description: "S3 Access IAM Role Name"
    Value: !Ref S3AccessRole
    Export:
      Name: !Sub "${AWS::StackName}-IAMRoleName"

  InstanceProfileArn:
    Description: "Instance Profile ARN"
    Value: !GetAtt S3AccessInstanceProfile.Arn
    Export:
      Name: !Sub "${AWS::StackName}-InstanceProfileArn"

  PrimaryBucketName:
    Description: "Primary Secure Data Bucket"
    Value: !Ref PrimaryDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-PrimaryBucketName"

  PrimaryBucketArn:
    Description: "Primary S3 Bucket ARN"
    Value: !Sub "arn:aws:s3:::${PrimaryDataBucket}"
    Export:
      Name: !Sub "${AWS::StackName}-PrimaryBucketArn"

  SecondaryBucketName:
    Description: "Secondary Secure Data Bucket"
    Value: !Ref SecondaryDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-SecondaryBucketName"

  SecondaryBucketArn:
    Description: "Secondary S3 Bucket ARN"
    Value: !Sub "arn:aws:s3:::${SecondaryDataBucket}"
    Export:
      Name: !Sub "${AWS::StackName}-SecondaryBucketArn"

  DeploymentSummary:
    Description: "Deployment Summary"
    Value: !Sub |
      Secure AWS Infrastructure deployed successfully in ${AWS::Region}
      - Environment: ${EnvironmentSuffix}
      - KMS Encryption: Enabled for all S3 buckets
      - Public Access: Blocked on all S3 buckets
      - IAM: Least Privilege Access applied with explicit deny policies
      - Region Enforcement: All operations restricted to us-west-2
      - Security: HTTPS-only access enforced on all buckets
```
