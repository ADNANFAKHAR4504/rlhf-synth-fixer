# AWS Config Compliance Monitoring - CloudFormation Implementation

I'll create a CloudFormation YAML template to implement AWS Config rules for infrastructure compliance monitoring with proper configuration recording, compliance rules, and notifications.

## File: lib/TapStack.yml

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

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # S3 Bucket for AWS Config Delivery
  # ERROR 1: Missing BucketName property - Config requires explicit bucket name
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'  # ERROR 2: Using AES256 instead of KMS encryption
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

  # ERROR 3: Missing KMS Key resource entirely - requirement states all data must be encrypted with KMS

  # SNS Topic for Config Notifications
  ConfigTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'config-notifications-${EnvironmentSuffix}'
      DisplayName: 'AWS Config Compliance Notifications'
      # ERROR 4: Missing KmsMasterKeyId property - SNS should be encrypted
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ERROR 5: Missing S3 bucket policy to allow Config service access

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
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: ConfigS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  # ERROR 6: Missing 's3:PutObjectAcl' permission
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

  # AWS Config Recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'config-recorder-${EnvironmentSuffix}'
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  # AWS Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
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
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel

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
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel

  # ERROR 7: Config Rule missing InputParameters - they should be JSON string not object
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'required-tags-${EnvironmentSuffix}'
      Description: 'Checks whether resources are tagged with required tags'
      InputParameters:
        tag1Key: Environment  # ERROR 8: Should be JSON string format
        tag2Key: Owner
      Source:
        Owner: AWS
        SourceIdentifier: 'REQUIRED_TAGS'
    DependsOn:
      - ConfigRecorder
      - ConfigDeliveryChannel

  # ERROR 9: Missing RDS encryption rule (requirement: encrypted storage rules)

  # ERROR 10: Missing IAM password policy rule (requirement: IAM configurations)

  # ERROR 11: Missing security group rule (requirement: security group compliance)

  # ERROR 12: CloudWatch Alarm has invalid metric namespace and metric name
  ConfigComplianceAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'config-compliance-violations-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Config rules detect compliance violations'
      MetricName: ComplianceViolations  # ERROR 13: This metric doesn't exist in AWS/Config
      Namespace: AWS/Config  # ERROR 14: Incorrect namespace
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      # ERROR 15: Missing AlarmActions to notify the SNS topic

Outputs:
  ConfigBucketName:
    Description: 'Name of the Config S3 bucket'
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-ConfigBucketName'

  ConfigTopicArn:
    Description: 'ARN of the Config SNS topic'
    Value: !Ref ConfigTopic
    Export:
      Name: !Sub '${AWS::StackName}-ConfigTopicArn'

  ConfigRecorderName:
    Description: 'Name of the Config recorder'
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRecorderName'

  # ERROR 16: Missing ConfigBucketArn output

  # ERROR 17: Missing ConfigRoleArn output

  # ERROR 18: Missing EnvironmentSuffix output
```

## Deployment Instructions

Deploy the CloudFormation stack:

```bash
aws cloudformation create-stack \
  --stack-name aws-config-compliance-dev \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

Monitor stack creation:

```bash
aws cloudformation describe-stacks \
  --stack-name aws-config-compliance-dev \
  --region us-west-2
```

This implementation provides AWS Config infrastructure with configuration recording, compliance rules for encrypted volumes, S3 public access, and required tags, along with SNS notifications and CloudWatch monitoring.
