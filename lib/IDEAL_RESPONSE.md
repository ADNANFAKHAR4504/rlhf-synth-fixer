```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure AWS infrastructure for storing sensitive data across multiple regions.
  Implements enterprise-grade security controls including encryption, IAM with MFA,
  audit logging, and lifecycle management for compliance requirements.

# Metadata section for CloudFormation console organization
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentName
          - EnvironmentSuffix
      - Label:
          default: 'Security Configuration'
        Parameters:
          - RequireMFA
          - EnableCrossRegionReplication
      - Label:
          default: 'Storage Configuration'
        Parameters:
          - S3BucketPrefix
          - GlacierTransitionDays
      - Label:
          default: 'Audit Configuration'
        Parameters:
          - CloudTrailBucketPrefix
          - EnableLogFileValidation

Parameters:
  EnvironmentName:
    Type: String
    Default: 'Production'
    Description: 'Environment name (Production, Staging, Development)'
    AllowedValues:
      - Production
      - Staging
      - Development
    
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  S3BucketPrefix:
    Type: String
    Default: 'secure-data-storage'
    Description: 'Prefix for S3 bucket names (must be globally unique)'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  CloudTrailBucketPrefix:
    Type: String
    Default: 'audit-trail-logs'
    Description: 'Prefix for CloudTrail S3 bucket name'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  RequireMFA:
    Type: String
    Default: 'true'
    Description: 'Require MFA for sensitive operations'
    AllowedValues:
      - 'true'
      - 'false'

  EnableCrossRegionReplication:
    Type: String
    Default: 'true'
    Description: 'Enable cross-region replication for disaster recovery'
    AllowedValues:
      - 'true'
      - 'false'

  GlacierTransitionDays:
    Type: Number
    Default: 30
    Description: 'Days before transitioning objects to Glacier storage'
    MinValue: 1
    MaxValue: 365

  EnableLogFileValidation:
    Type: String
    Default: 'true'
    Description: 'Enable CloudTrail log file validation'
    AllowedValues:
      - 'true'
      - 'false'

# Conditions for conditional resource creation
Conditions:
  RequireMFACondition: !Equals [!Ref RequireMFA, 'true']
  EnableReplicationCondition: !Equals [!Ref EnableCrossRegionReplication, 'true']
  EnableLogValidation: !Equals [!Ref EnableLogFileValidation, 'true']

Resources:
  # KMS Key for encryption
  DataEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for encrypting sensitive data'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'key-policy-1'
        Statement:
          - Sid: 'Enable IAM policies'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow services to use the key'
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: 'Data Encryption'

  # KMS Key Alias for easier reference
  DataEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentSuffix}-data-encryption-key'
      TargetKeyId: !Ref DataEncryptionKey

  # S3 Bucket for CloudTrail logs
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CloudTrailBucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToGlacier'
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
          - Id: 'DeleteOldLogs'
            Status: Enabled
            ExpirationInDays: 2555  # 7 years retention for compliance
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: 'Audit Logs'

  # S3 Bucket Policy for CloudTrail
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # IAM Role for S3 Replication (must be created before the bucket)
  S3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: EnableReplicationCondition
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'S3ReplicationPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}'
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub 'arn:aws:s3:::${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource: !Sub 'arn:aws:s3:::${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}-replica/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt DataEncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Primary S3 Bucket for sensitive data storage
  SensitiveDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToGlacier'
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref GlacierTransitionDays
          - Id: 'DeleteIncompleteMultipartUploads'
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      ReplicationConfiguration: !If
        - EnableReplicationCondition
        - Role: !GetAtt S3ReplicationRole.Arn
          Rules:
            - Id: 'ReplicateAll'
              Status: Enabled
              Priority: 1
              Filter: {}
              DeleteMarkerReplication:
                Status: Enabled
              Destination:
                Bucket: !GetAtt ReplicationBucket.Arn
                ReplicationTime:
                  Status: Enabled
                  Time:
                    Minutes: 15
                Metrics:
                  Status: Enabled
                  EventThreshold:
                    Minutes: 15
                StorageClass: STANDARD_IA
        - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: 'Sensitive Data Storage'
        - Key: Compliance
          Value: 'Required'

  # Replication bucket for disaster recovery (conditional)
  ReplicationBucket:
    Type: AWS::S3::Bucket
    Condition: EnableReplicationCondition
    Properties:
      BucketName: !Sub '${S3BucketPrefix}-${EnvironmentSuffix}-${AWS::AccountId}-replica'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref DataEncryptionKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'TransitionToGlacier'
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref GlacierTransitionDays
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: 'Disaster Recovery Replica'

  # IAM Group for data administrators
  DataAdministratorsGroup:
    Type: AWS::IAM::Group
    Properties:
      ManagedPolicyArns:
        - !Ref DataAdminManagedPolicy

  # IAM Managed Policy for data administrators
  DataAdminManagedPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: 'Policy for data administrators with MFA requirements'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow basic operations without MFA
          - Sid: 'AllowListingWithoutMFA'
            Effect: Allow
            Action:
              - 's3:ListBucket'
              - 's3:ListBucketVersions'
              - 's3:GetBucketLocation'
              - 's3:GetBucketVersioning'
            Resource:
              - !GetAtt SensitiveDataBucket.Arn
              - !If
                - EnableReplicationCondition
                - !GetAtt ReplicationBucket.Arn
                - !Ref 'AWS::NoValue'
          # Require MFA for sensitive operations
          - Sid: 'RequireMFAForSensitiveOperations'
            Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:DeleteObjectVersion'
            Resource:
              - !Sub '${SensitiveDataBucket.Arn}/*'
              - !If
                - EnableReplicationCondition
                - !Sub '${ReplicationBucket.Arn}/*'
                - !Ref 'AWS::NoValue'
            Condition: !If
              - RequireMFACondition
              - Bool:
                  'aws:MultiFactorAuthPresent': 'true'
              - !Ref 'AWS::NoValue'
          # KMS permissions with MFA
          - Sid: 'AllowKMSOperations'
            Effect: Allow
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: !GetAtt DataEncryptionKey.Arn
            Condition: !If
              - RequireMFACondition
              - Bool:
                  'aws:MultiFactorAuthPresent': 'true'
              - !Ref 'AWS::NoValue'

  # IAM Role for read-only access
  ReadOnlyAccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition: !If
              - RequireMFACondition
              - Bool:
                  'aws:MultiFactorAuthPresent': 'true'
              - !Ref 'AWS::NoValue'
      Policies:
        - PolicyName: 'ReadOnlyAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !GetAtt SensitiveDataBucket.Arn
                  - !Sub '${SensitiveDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt DataEncryptionKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Sample IAM User (in production, users should be created separately)
  SampleDataAdmin:
    Type: AWS::IAM::User
    Properties:
      Groups:
        - !Ref DataAdministratorsGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Note
          Value: 'Enable MFA after creation'

  # CloudTrail for audit logging
  AuditTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentSuffix}-audit-trail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: !If [EnableLogValidation, true, false]
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SensitiveDataBucket.Arn}/'
                - !If
                  - EnableReplicationCondition
                  - !Sub '${ReplicationBucket.Arn}/'
                  - !Ref 'AWS::NoValue'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Purpose
          Value: 'Compliance Audit Trail'

# Outputs for reference
Outputs:
  DataEncryptionKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref DataEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-DataEncryptionKeyId'

  DataEncryptionKeyArn:
    Description: 'ARN of the KMS key used for encryption'
    Value: !GetAtt DataEncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataEncryptionKeyArn'

  SensitiveDataBucketName:
    Description: 'Name of the primary S3 bucket for sensitive data'
    Value: !Ref SensitiveDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-SensitiveDataBucketName'

  SensitiveDataBucketArn:
    Description: 'ARN of the primary S3 bucket'
    Value: !GetAtt SensitiveDataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SensitiveDataBucketArn'

  ReplicationBucketName:
    Condition: EnableReplicationCondition
    Description: 'Name of the replication S3 bucket'
    Value: !Ref ReplicationBucket
    Export:
      Name: !Sub '${AWS::StackName}-ReplicationBucketName'

  CloudTrailBucketName:
    Description: 'Name of the S3 bucket for CloudTrail logs'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  AuditTrailName:
    Description: 'Name of the CloudTrail for audit logging'
    Value: !Ref AuditTrail
    Export:
      Name: !Sub '${AWS::StackName}-AuditTrailName'

  DataAdministratorsGroupName:
    Description: 'Name of the IAM group for data administrators'
    Value: !Ref DataAdministratorsGroup
    Export:
      Name: !Sub '${AWS::StackName}-DataAdministratorsGroupName'

  ReadOnlyAccessRoleArn:
    Description: 'ARN of the read-only access role'
    Value: !GetAtt ReadOnlyAccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReadOnlyAccessRoleArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentName:
    Description: 'Environment name used for this deployment'
    Value: !Ref EnvironmentName
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```