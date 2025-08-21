```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC - AWS Nova Model Breaking: Foundational security configuration with IAM MFA enforcement and AWS Config for S3 bucket monitoring'

Parameters:
  SampleBucketName:
    Type: String
    Description: 'Name for the sample S3 bucket to be monitored by AWS Config'
    Default: 'nova-sample-bucket'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Bucket name must be lowercase, contain only letters, numbers, and hyphens, and not start or end with a hyphen'
    MinLength: 3
    MaxLength: 63

  ConfigDeliveryBucketName:
    Type: String
    Description: 'Name for the AWS Config delivery S3 bucket'
    Default: 'nova-config-delivery-bucket'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Bucket name must be lowercase, contain only letters, numbers, and hyphens, and not start or end with a hyphen'
    MinLength: 3
    MaxLength: 63

Resources:
  # ==========================================
  # IAM MFA ENFORCEMENT RESOURCES
  # ==========================================

  MfaEnforcedUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: MfaEnforcedUsers
      Path: /
      ManagedPolicyArns:
        - !Ref MfaEnforcementPolicy

  MfaEnforcementPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${AWS::StackName}-MfaEnforcementPolicy'
      Description: 'Policy that enforces Multi-Factor Authentication for all actions on all resources'
      Path: /
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AllowAllActionsWithMFA'
            Effect: Allow
            Action: '*'
            Resource: '*'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
          - Sid: 'DenyAllActionsWithoutMFA'
            Effect: Deny
            Action: '*'
            Resource: '*'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'false'
          - Sid: 'AllowIAMActionsForMFASetup'
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:DeleteVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ResyncMFADevice'
              - 'iam:DeactivateMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:GetUser'
              - 'iam:ChangePassword'
            Resource: '*'

  # ==========================================
  # AWS CONFIG INFRASTRUCTURE
  # ==========================================

  ConfigDeliveryBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ConfigDeliveryBucketName}-${AWS::AccountId}-${AWS::Region}'
      Description: 'S3 bucket for AWS Config to store configuration history and logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldConfigData
            Status: Enabled
            ExpirationInDays: 2555  # 7 years retention
            NoncurrentVersionExpirationInDays: 365

  ConfigDeliveryBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigDeliveryBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub '${ConfigDeliveryBucket}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !Sub '${ConfigDeliveryBucket}'
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigDeliveryBucket}/AWSLogs/${AWS::AccountId}/Config/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ConfigServiceRole'
      Description: 'IAM role for AWS Config service to access AWS resources'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Path: /service-role/

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${AWS::StackName}-ConfigRecorder'
      Description: 'AWS Config recorder for monitoring resource configurations'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
        ResourceTypes: []

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${AWS::StackName}-ConfigDeliveryChannel'
      Description: 'AWS Config delivery channel for sending configuration data to S3'
      S3BucketName: !Ref ConfigDeliveryBucket
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  # ==========================================
  # AWS CONFIG RULES FOR S3 SECURITY
  # ==========================================

  S3BucketPublicReadProhibitedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-public-read-prohibited
      Description: 'AWS Config rule to check if S3 buckets allow public read access'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  S3BucketPublicWriteProhibitedRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: s3-bucket-public-write-prohibited
      Description: 'AWS Config rule to check if S3 buckets allow public write access'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_WRITE_PROHIBITED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  # ==========================================
  # DEMONSTRATION RESOURCES
  # ==========================================

  SampleS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${SampleBucketName}-${AWS::AccountId}-${AWS::Region}'
      Description: 'Sample S3 bucket for demonstration and monitoring by AWS Config rules'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

Outputs:
  MfaEnforcedUsersGroupName:
    Description: 'Name of the IAM group that enforces MFA for all actions'
    Value: !Ref MfaEnforcedUsersGroup
    Export:
      Name: !Sub '${AWS::StackName}-MfaEnforcedUsersGroup'

  MfaEnforcementPolicyArn:
    Description: 'ARN of the IAM policy that enforces MFA'
    Value: !Ref MfaEnforcementPolicy
    Export:
      Name: !Sub '${AWS::StackName}-MfaEnforcementPolicy'

  ConfigDeliveryBucketName:
    Description: 'Name of the S3 bucket used by AWS Config for delivery'
    Value: !Ref ConfigDeliveryBucket
    Export:
      Name: !Sub '${AWS::StackName}-ConfigDeliveryBucket'

  ConfigurationRecorderName:
    Description: 'Name of the AWS Config configuration recorder'
    Value: !Ref ConfigurationRecorder
    Export:
      Name: !Sub '${AWS::StackName}-ConfigurationRecorder'

  SampleBucketName:
    Description: 'Name of the sample S3 bucket being monitored'
    Value: !Ref SampleS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-SampleBucket'

  S3PublicReadRuleName:
    Description: 'Name of the Config rule monitoring S3 public read access'
    Value: !Ref S3BucketPublicReadProhibitedRule
    Export:
      Name: !Sub '${AWS::StackName}-S3PublicReadRule'

  S3PublicWriteRuleName:
    Description: 'Name of the Config rule monitoring S3 public write access'
    Value: !Ref S3BucketPublicWriteProhibitedRule
    Export:
      Name: !Sub '${AWS::StackName}-S3PublicWriteRule'
```
