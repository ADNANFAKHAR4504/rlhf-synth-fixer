# IDEAL RESPONSE - AWS Config Compliance Monitoring

## Overview
This is the complete, production-ready CloudFormation template for AWS Config compliance monitoring with all critical issues fixed.

## Key Features
- ✅ AWS Config setup with proper IAM policies
- ✅ 8 Compliance rules for security and governance
- ✅ KMS encryption for all data at rest
- ✅ SNS notifications with EventBridge integration
- ✅ S3 lifecycle policies for cost optimization
- ✅ Conditional Config Recorder for multi-region deployments

## Complete CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Config Rules - Infrastructure Compliance Monitoring'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - EnableConfigRecorder

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  EnableConfigRecorder:
    Type: String
    Default: 'false'
    Description: 'Enable AWS Config Recorder (set to false if Config is already enabled in this region)'
    AllowedValues:
      - 'true'
      - 'false'

Conditions:
  ShouldEnableConfigRecorder: !Equals [!Ref EnableConfigRecorder, 'true']

Resources:
  # S3 Bucket for AWS Config Delivery
  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub 'config-bucket-${AWS::AccountId}-${EnvironmentSuffix}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !GetAtt ConfigKMSKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldConfigData'
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'AWS Config'
        - Key: Owner
          Value: 'Infrastructure Team'

  # S3 Bucket Policy for Config Service
  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  # KMS Key for Config Encryption
  ConfigKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for AWS Config encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Config to use the key
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow SNS to use the key
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'AWS Config'
        - Key: Owner
          Value: 'Infrastructure Team'

  # KMS Key Alias
  ConfigKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/config-${EnvironmentSuffix}'
      TargetKeyId: !Ref ConfigKMSKey

  # SNS Topic for Config Notifications
  ConfigTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'config-notifications-${EnvironmentSuffix}'
      DisplayName: 'AWS Config Compliance Notifications'
      KmsMasterKeyId: !GetAtt ConfigKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'AWS Config'
        - Key: Owner
          Value: 'Infrastructure Team'

  # SNS Topic Policy
  ConfigTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref ConfigTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowConfigPublish
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'SNS:Publish'
            Resource: !Ref ConfigTopic
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AllowEventBridgePublish
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'SNS:Publish'
            Resource: !Ref ConfigTopic

  # IAM Role for AWS Config
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'AWSConfigRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'  # ✅ CORRECT - Fixed from AWS_ConfigRole
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${ConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:GetBucketVersioning'
                Resource: !GetAtt ConfigBucket.Arn
        - PolicyName: ConfigSNSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 'sns:Publish'
                Resource: !Ref ConfigTopic
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: 'AWS Config'
        - Key: Owner
          Value: 'Infrastructure Team'

  # AWS Config Recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: ShouldEnableConfigRecorder
    Properties:
      Name: !Sub 'config-recorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # AWS Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Condition: ShouldEnableConfigRecorder
    Properties:
      Name: !Sub 'config-delivery-${EnvironmentSuffix}'
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref ConfigTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  # Config Rule: Encrypted Volumes
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'encrypted-volumes-${EnvironmentSuffix}'
      Description: 'Checks whether EBS volumes are encrypted'
      Source:
        Owner: AWS
        SourceIdentifier: 'ENCRYPTED_VOLUMES'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::EC2::Volume'

  # Config Rule: S3 Bucket Public Read Prohibited
  S3BucketPublicReadRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 's3-bucket-public-read-prohibited-${EnvironmentSuffix}'
      Description: 'Checks that S3 buckets do not allow public read access'
      Source:
        Owner: AWS
        SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::S3::Bucket'

  # Config Rule: Required Tags
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'required-tags-${EnvironmentSuffix}'
      Description: 'Checks whether resources are tagged with required tags'
      InputParameters: |
        {
          "tag1Key": "Environment",
          "tag2Key": "Owner"
        }
      Source:
        Owner: AWS
        SourceIdentifier: 'REQUIRED_TAGS'

  # Config Rule: RDS Storage Encrypted
  RDSStorageEncryptedRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'rds-storage-encrypted-${EnvironmentSuffix}'
      Description: 'Checks whether RDS DB instances have storage encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: 'RDS_STORAGE_ENCRYPTED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::RDS::DBInstance'

  # Config Rule: IAM Password Policy
  IAMPasswordPolicyRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'iam-password-policy-${EnvironmentSuffix}'
      Description: 'Checks whether IAM password policy meets requirements'
      Source:
        Owner: AWS
        SourceIdentifier: 'IAM_PASSWORD_POLICY'

  # Config Rule: SSH Restricted
  SSHRestrictedRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'ssh-restricted-${EnvironmentSuffix}'
      Description: 'Checks whether security groups disallow unrestricted SSH'
      Source:
        Owner: AWS
        SourceIdentifier: 'INCOMING_SSH_DISABLED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::EC2::SecurityGroup'

  # Config Rule: S3 Bucket Public Write Prohibited
  S3BucketPublicWriteRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 's3-bucket-public-write-prohibited-${EnvironmentSuffix}'
      Description: 'Checks that S3 buckets do not allow public write access'
      Source:
        Owner: AWS
        SourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::S3::Bucket'

  # Config Rule: S3 Bucket Server Side Encryption
  S3BucketSSERule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 's3-bucket-sse-enabled-${EnvironmentSuffix}'
      Description: 'Checks that S3 buckets have server-side encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::S3::Bucket'

  # EventBridge Rule for Config Compliance Changes
  ConfigComplianceEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'config-compliance-changes-${EnvironmentSuffix}'
      Description: 'Trigger notifications when Config rules detect non-compliance'
      EventPattern:
        source:
          - 'aws.config'
        detail-type:
          - 'Config Rules Compliance Change'
        detail:
          newEvaluationResult:
            complianceType:
              - 'NON_COMPLIANT'
      State: ENABLED
      Targets:
        - Arn: !Ref ConfigTopic
          Id: ConfigComplianceSNS
          InputTransformer:
            InputPathsMap:
              awsRegion: '$.detail.awsRegion'
              awsAccountId: '$.detail.awsAccountId'
              configRuleName: '$.detail.configRuleName'
              resourceType: '$.detail.resourceType'
              resourceId: '$.detail.resourceId'
              complianceType: '$.detail.newEvaluationResult.complianceType'
            InputTemplate: |
              {
                "Message": "AWS Config Compliance Violation Detected",
                "Account": "<awsAccountId>",
                "Region": "<awsRegion>",
                "Rule": "<configRuleName>",
                "ResourceType": "<resourceType>",
                "ResourceId": "<resourceId>",
                "ComplianceStatus": "<complianceType>"
              }

  # CloudWatch Log Group for Config
  ConfigLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/config/${EnvironmentSuffix}'
      RetentionInDays: 30

Outputs:
  ConfigBucketName:
    Description: 'Name of the Config S3 bucket'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-ConfigBucketName'

  ConfigBucketArn:
    Description: 'ARN of the Config S3 bucket'
    Value: !GetAtt ConfigBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ConfigBucketArn'

  ConfigTopicArn:
    Description: 'ARN of the Config SNS topic'
    Value: !Ref ConfigTopic
    Export:
      Name: !Sub '${AWS::StackName}-ConfigTopicArn'

  ConfigRecorderName:
    Condition: ShouldEnableConfigRecorder
    Description: 'Name of the Config recorder'
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRecorderName'

  ConfigRoleArn:
    Description: 'ARN of the Config IAM role'
    Value: !GetAtt ConfigRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRoleArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Deployment Instructions

### Validate Template
```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yml \
  --region us-east-1
```

### Deploy Stack
```bash
aws cloudformation create-stack \
  --stack-name aws-config-compliance-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=EnableConfigRecorder,ParameterValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Start Config Recorder (if enabled)
```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-dev \
  --region us-east-1
```

## Key Fixes Applied

### 1. ✅ IAM Policy ARN Fix (Critical)
**Before:** `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
**After:** `arn:aws:iam::aws:policy/service-role/ConfigRole`

### 2. ✅ S3 Bucket Policy Conditions
All bucket policy statements now include AWS:SourceAccount condition for enhanced security.

### 3. ✅ EventBridge Integration
Replaced CloudWatch Alarm with EventBridge Rule for real-time compliance notifications.

### 4. ✅ KMS Encryption
- S3 bucket encrypted with KMS
- SNS topic encrypted with KMS
- Proper KMS key policy for Config and SNS services

### 5. ✅ Conditional Config Recorder
Smart conditional logic to handle regions where Config is already enabled.

## Compliance Rules Coverage

| Rule | Description | Resource Type |
|------|-------------|---------------|
| ENCRYPTED_VOLUMES | EBS volumes must be encrypted | EC2::Volume |
| S3_BUCKET_PUBLIC_READ_PROHIBITED | S3 buckets cannot allow public read | S3::Bucket |
| S3_BUCKET_PUBLIC_WRITE_PROHIBITED | S3 buckets cannot allow public write | S3::Bucket |
| S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED | S3 buckets must have SSE | S3::Bucket |
| RDS_STORAGE_ENCRYPTED | RDS instances must be encrypted | RDS::DBInstance |
| IAM_PASSWORD_POLICY | IAM password policy compliance | Account-level |
| INCOMING_SSH_DISABLED | Security groups must restrict SSH | EC2::SecurityGroup |
| REQUIRED_TAGS | Resources must have Environment and Owner tags | All resources |

## Cost Optimization Features

1. **S3 Lifecycle Policy**:
   - Delete objects after 90 days
   - Delete non-current versions after 30 days

2. **Config Delivery Frequency**:
   - Set to TwentyFour_Hours (most cost-effective)

3. **CloudWatch Logs Retention**:
   - 30-day retention policy

## Security Best Practices

- ✅ KMS encryption at rest for all data
- ✅ S3 public access fully blocked
- ✅ Least privilege IAM policies
- ✅ Service-specific bucket and topic policies
- ✅ Account-scoped conditions in policies
- ✅ Resource tagging for compliance and cost tracking

## Testing

### Unit Tests
- Template structure validation
- Resource configuration checks
- Naming convention validation
- CloudFormation syntax validation

### Integration Tests
- S3 bucket existence and encryption
- SNS topic configuration
- IAM role permissions
- Config delivery channel setup
- Environment suffix consistency

## Production Readiness Checklist

- [x] Fix IAM managed policy ARN
- [x] Add S3 bucket policy
- [x] Add SNS topic policy
- [x] Configure KMS encryption
- [x] Add EventBridge rule
- [x] Add all required Config rules
- [x] Configure lifecycle policies
- [x] Add comprehensive tagging
- [x] Create unit tests
- [x] Create integration tests
- [x] Add CloudWatch log group
- [x] Configure conditional recorder
- [x] Add stack outputs with exports

## Notes

This template is production-ready and follows AWS best practices for:
- Security (encryption, least privilege)
- Cost optimization (lifecycle policies, delivery frequency)
- Operational excellence (monitoring, tagging)
- Reliability (multi-region support, conditional resources)