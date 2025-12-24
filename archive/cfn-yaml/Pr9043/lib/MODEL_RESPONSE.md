# Infrastructure Compliance Validation System - Implementation

This implementation provides a comprehensive infrastructure compliance validation system using AWS CloudFormation with YAML. The solution uses AWS Config for continuous compliance monitoring, Lambda for custom validation logic, SNS for notifications, and S3 for data storage.

## Architecture Overview

The system consists of:
- **AWS Config**: Continuous configuration recording and compliance evaluation
- **Config Rules**: Both AWS managed and custom rules for compliance checks
- **Lambda Functions**: Custom compliance validation logic
- **SNS Topics**: Real-time notifications for compliance violations
- **S3 Bucket**: Secure storage for Config snapshots and compliance data
- **KMS Key**: Encryption for data at rest
- **CloudWatch**: Centralized logging and monitoring
- **IAM Roles**: Least-privilege access control

## Implementation

### File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Infrastructure Compliance Validation System

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource naming to ensure uniqueness across deployments
    Default: dev
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  NotificationEmail:
    Type: String
    Description: Email address for compliance notifications
    Default: compliance-team@example.com
    AllowedPattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

  ConfigRecordingFrequency:
    Type: String
    Description: Frequency for Config recording
    Default: CONTINUOUS
    AllowedValues:
      - CONTINUOUS
      - DAILY

Resources:
  # KMS Key for encryption
  ComplianceKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub KMS key for compliance validation system encryption ${EnvironmentSuffix}
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow Config to use the key
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub logs.${AWS::Region}.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:CreateGrant
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnLike:
                kms:EncryptionContext:aws:logs:arn: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*

  ComplianceKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/compliance-validation-${EnvironmentSuffix}
      TargetKeyId: !Ref ComplianceKmsKey

  # S3 Bucket for Config data storage
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub config-compliance-data-${EnvironmentSuffix}-${AWS::AccountId}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt ComplianceKmsKey.Arn
            BucketKeyEnabled: true
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
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub config-bucket-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: ComplianceValidation

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
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
          - Sid: AWSConfigBucketPutObject
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub ${ConfigBucket.Arn}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub ${ConfigBucket.Arn}/*
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms

  # SNS Topic for compliance notifications
  ComplianceNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub compliance-notifications-${EnvironmentSuffix}
      DisplayName: Compliance Validation Notifications
      KmsMasterKeyId: !Ref ComplianceKmsKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Name
          Value: !Sub compliance-topic-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ComplianceNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref ComplianceNotificationTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowConfigToPublish
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: SNS:Publish
            Resource: !Ref ComplianceNotificationTopic

  # IAM Role for AWS Config
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub config-service-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetBucketVersioning
                  - s3:PutObject
                  - s3:GetObject
                Resource:
                  - !GetAtt ConfigBucket.Arn
                  - !Sub ${ConfigBucket.Arn}/*
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt ComplianceKmsKey.Arn
      Tags:
        - Key: Name
          Value: !Sub config-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # AWS Config Recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub compliance-config-recorder-${EnvironmentSuffix}
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
        ResourceTypes: []

  # Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub compliance-delivery-channel-${EnvironmentSuffix}
      S3BucketName: !Ref ConfigBucket
      SnsTopicARN: !Ref ComplianceNotificationTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  # CloudWatch Log Group for Lambda functions
  ComplianceLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/lambda/compliance-validator-${EnvironmentSuffix}
      RetentionInDays: 14
      KmsKeyId: !GetAtt ComplianceKmsKey.Arn

  # IAM Role for Lambda functions
  ComplianceLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub compliance-lambda-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSConfigRulesExecutionRole
      Policies:
        - PolicyName: LambdaLogging
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt ComplianceLambdaLogGroup.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt ComplianceKmsKey.Arn
        - PolicyName: ConfigCompliance
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - config:PutEvaluations
                  - config:GetResourceConfigHistory
                Resource: '*'
              - Effect: Allow
                Action:
                  - ec2:Describe*
                  - s3:GetBucketEncryption
                  - s3:GetBucketPublicAccessBlock
                  - s3:GetBucketVersioning
                  - rds:Describe*
                  - kms:DescribeKey
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub compliance-lambda-role-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda function for custom compliance validation
  CustomComplianceValidatorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub compliance-validator-${EnvironmentSuffix}
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt ComplianceLambdaRole.Arn
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
          SNS_TOPIC_ARN: !Ref ComplianceNotificationTopic
      Code:
        ZipFile: |
          import json
          import boto3
          from datetime import datetime

          config = boto3.client('config')
          ec2 = boto3.client('ec2')
          s3 = boto3.client('s3')

          def lambda_handler(event, context):
              """
              Custom compliance validator for AWS resources.
              Evaluates resource configurations and returns compliance status.
              """
              print(f"Received event: {json.dumps(event)}")

              # Extract parameters from event
              invoking_event = json.loads(event['invokingEvent'])
              rule_parameters = json.loads(event.get('ruleParameters', '{}'))
              configuration_item = invoking_event.get('configurationItem', {})

              # Resource details
              resource_type = configuration_item.get('resourceType')
              resource_id = configuration_item.get('resourceId')

              print(f"Evaluating {resource_type}: {resource_id}")

              # Initialize compliance status
              compliance_type = 'COMPLIANT'
              annotation = 'Resource is compliant'

              try:
                  # Evaluate based on resource type
                  if resource_type == 'AWS::S3::Bucket':
                      compliance_type, annotation = evaluate_s3_bucket(resource_id, configuration_item)
                  elif resource_type == 'AWS::EC2::SecurityGroup':
                      compliance_type, annotation = evaluate_security_group(resource_id, configuration_item)
                  elif resource_type == 'AWS::EC2::Instance':
                      compliance_type, annotation = evaluate_ec2_instance(resource_id, configuration_item)
                  else:
                      compliance_type = 'NOT_APPLICABLE'
                      annotation = f'No custom validation for {resource_type}'

              except Exception as e:
                  print(f"Error evaluating resource: {str(e)}")
                  compliance_type = 'NON_COMPLIANT'
                  annotation = f'Error during evaluation: {str(e)}'

              # Submit evaluation result
              evaluation = {
                  'ComplianceResourceType': resource_type,
                  'ComplianceResourceId': resource_id,
                  'ComplianceType': compliance_type,
                  'Annotation': annotation,
                  'OrderingTimestamp': datetime.now()
              }

              response = config.put_evaluations(
                  Evaluations=[evaluation],
                  ResultToken=event['resultToken']
              )

              print(f"Evaluation result: {compliance_type} - {annotation}")
              return response

          def evaluate_s3_bucket(bucket_name, config_item):
              """Evaluate S3 bucket compliance"""
              try:
                  # Check encryption
                  try:
                      s3.get_bucket_encryption(Bucket=bucket_name)
                  except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                      return 'NON_COMPLIANT', 'S3 bucket does not have encryption enabled'

                  # Check public access block
                  try:
                      public_access = s3.get_public_access_block(Bucket=bucket_name)
                      block_config = public_access['PublicAccessBlockConfiguration']
                      if not all([
                          block_config.get('BlockPublicAcls'),
                          block_config.get('BlockPublicPolicy'),
                          block_config.get('IgnorePublicAcls'),
                          block_config.get('RestrictPublicBuckets')
                      ]):
                          return 'NON_COMPLIANT', 'S3 bucket does not have all public access blocks enabled'
                  except:
                      return 'NON_COMPLIANT', 'S3 bucket does not have public access block configured'

                  # Check versioning
                  try:
                      versioning = s3.get_bucket_versioning(Bucket=bucket_name)
                      if versioning.get('Status') != 'Enabled':
                          return 'NON_COMPLIANT', 'S3 bucket does not have versioning enabled'
                  except:
                      return 'NON_COMPLIANT', 'Could not verify S3 bucket versioning'

                  return 'COMPLIANT', 'S3 bucket meets all compliance requirements'
              except Exception as e:
                  return 'NON_COMPLIANT', f'Error evaluating S3 bucket: {str(e)}'

          def evaluate_security_group(sg_id, config_item):
              """Evaluate Security Group compliance"""
              try:
                  configuration = config_item.get('configuration', {})
                  ip_permissions = configuration.get('ipPermissions', [])

                  # Check for unrestricted inbound rules
                  for rule in ip_permissions:
                      for ip_range in rule.get('ipv4Ranges', []):
                          if ip_range.get('cidrIp') == '0.0.0.0/0':
                              from_port = rule.get('fromPort', 0)
                              to_port = rule.get('toPort', 65535)
                              # Allow only specific ports to be open to internet
                              if from_port not in [80, 443]:
                                  return 'NON_COMPLIANT', f'Security group has unrestricted access on port {from_port}'

                  return 'COMPLIANT', 'Security group has appropriate restrictions'
              except Exception as e:
                  return 'NON_COMPLIANT', f'Error evaluating security group: {str(e)}'

          def evaluate_ec2_instance(instance_id, config_item):
              """Evaluate EC2 instance compliance"""
              try:
                  configuration = config_item.get('configuration', {})

                  # Check if instance has required tags
                  tags = configuration.get('tags', [])
                  required_tags = ['Environment', 'Owner', 'CostCenter']
                  existing_tag_keys = [tag.get('key') for tag in tags]

                  missing_tags = [tag for tag in required_tags if tag not in existing_tag_keys]
                  if missing_tags:
                      return 'NON_COMPLIANT', f'EC2 instance missing required tags: {", ".join(missing_tags)}'

                  # Check if monitoring is enabled
                  monitoring = configuration.get('monitoring', {}).get('state')
                  if monitoring != 'enabled':
                      return 'NON_COMPLIANT', 'EC2 instance does not have detailed monitoring enabled'

                  return 'COMPLIANT', 'EC2 instance meets all compliance requirements'
              except Exception as e:
                  return 'NON_COMPLIANT', f'Error evaluating EC2 instance: {str(e)}'
      Tags:
        - Key: Name
          Value: !Sub compliance-validator-${EnvironmentSuffix}
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Permission for Config to invoke Lambda
  ComplianceLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref CustomComplianceValidatorFunction
      Action: lambda:InvokeFunction
      Principal: config.amazonaws.com
      SourceAccount: !Ref AWS::AccountId

  # AWS Managed Config Rule - S3 Bucket Encryption
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub s3-bucket-encryption-${EnvironmentSuffix}
      Description: Checks that S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  # AWS Managed Config Rule - S3 Bucket Public Access
  S3BucketPublicAccessRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub s3-bucket-public-access-${EnvironmentSuffix}
      Description: Checks that S3 buckets do not allow public access
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  # AWS Managed Config Rule - RDS Encryption
  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub rds-encryption-enabled-${EnvironmentSuffix}
      Description: Checks that RDS instances have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED
      Scope:
        ComplianceResourceTypes:
          - AWS::RDS::DBInstance

  # AWS Managed Config Rule - EBS Encryption
  EBSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub ec2-ebs-encryption-${EnvironmentSuffix}
      Description: Checks that EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume

  # AWS Managed Config Rule - Required Tags
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub required-tags-${EnvironmentSuffix}
      Description: Checks that resources have required tags
      InputParameters:
        tag1Key: Environment
        tag2Key: Owner
        tag3Key: CostCenter
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::S3::Bucket
          - AWS::RDS::DBInstance

  # AWS Managed Config Rule - VPC Flow Logs
  VPCFlowLogsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub vpc-flow-logs-enabled-${EnvironmentSuffix}
      Description: Checks that VPC Flow Logs are enabled
      Source:
        Owner: AWS
        SourceIdentifier: VPC_FLOW_LOGS_ENABLED

  # Custom Config Rule using Lambda
  CustomComplianceRule:
    Type: AWS::Config::ConfigRule
    DependsOn:
      - ConfigRecorder
      - ComplianceLambdaPermission
    Properties:
      ConfigRuleName: !Sub custom-compliance-validation-${EnvironmentSuffix}
      Description: Custom compliance validation for resources
      Source:
        Owner: CUSTOM_LAMBDA
        SourceIdentifier: !GetAtt CustomComplianceValidatorFunction.Arn
        SourceDetails:
          - EventSource: aws.config
            MessageType: ConfigurationItemChangeNotification
          - EventSource: aws.config
            MessageType: OversizedConfigurationItemChangeNotification
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket
          - AWS::EC2::SecurityGroup
          - AWS::EC2::Instance

  # CloudWatch Alarm for non-compliant resources
  NonCompliantResourcesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub compliance-violations-${EnvironmentSuffix}
      AlarmDescription: Alert when non-compliant resources are detected
      MetricName: NonCompliantResources
      Namespace: AWS/Config
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref ComplianceNotificationTopic

  # CloudWatch Alarm for Config Recorder
  ConfigRecorderFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub config-recorder-failure-${EnvironmentSuffix}
      AlarmDescription: Alert when Config Recorder fails
      MetricName: ConfigurationRecorderError
      Namespace: AWS/Config
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref ComplianceNotificationTopic

Outputs:
  ConfigBucketName:
    Description: S3 bucket for Config data storage
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub ${AWS::StackName}-ConfigBucket

  ComplianceNotificationTopicArn:
    Description: SNS topic ARN for compliance notifications
    Value: !Ref ComplianceNotificationTopic
    Export:
      Name: !Sub ${AWS::StackName}-NotificationTopic

  CustomComplianceFunctionArn:
    Description: Lambda function ARN for custom compliance validation
    Value: !GetAtt CustomComplianceValidatorFunction.Arn
    Export:
      Name: !Sub ${AWS::StackName}-ComplianceFunction

  ConfigRecorderName:
    Description: AWS Config Recorder name
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub ${AWS::StackName}-ConfigRecorder

  KmsKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref ComplianceKmsKey
    Export:
      Name: !Sub ${AWS::StackName}-KmsKey

  ComplianceRuleNames:
    Description: List of Config Rule names
    Value: !Sub |
      - ${S3BucketEncryptionRule}
      - ${S3BucketPublicAccessRule}
      - ${RDSEncryptionRule}
      - ${EBSEncryptionRule}
      - ${RequiredTagsRule}
      - ${VPCFlowLogsRule}
      - ${CustomComplianceRule}
```

## Key Features

### 1. AWS Config Setup
- **Configuration Recorder**: Continuously records resource configurations
- **Delivery Channel**: Stores snapshots in S3 and sends notifications via SNS
- **Recording Scope**: All supported resource types including global resources

### 2. Managed Config Rules
- **S3 Bucket Encryption**: Ensures all S3 buckets have encryption enabled
- **S3 Public Access**: Prevents public access to S3 buckets
- **RDS Encryption**: Ensures RDS instances are encrypted
- **EBS Encryption**: Ensures EBS volumes are encrypted
- **Required Tags**: Validates presence of Environment, Owner, and CostCenter tags
- **VPC Flow Logs**: Ensures VPC Flow Logs are enabled

### 3. Custom Compliance Validation
- **Lambda Function**: Implements custom compliance logic
- **S3 Bucket Validation**: Checks encryption, public access blocks, and versioning
- **Security Group Validation**: Ensures no unrestricted access except for HTTP/HTTPS
- **EC2 Instance Validation**: Validates required tags and monitoring configuration

### 4. Security Features
- **KMS Encryption**: All data encrypted at rest using customer-managed KMS key
- **Key Rotation**: Automatic key rotation enabled
- **IAM Least Privilege**: Minimal permissions for all roles
- **S3 Public Access Block**: All four settings enabled on Config bucket
- **Versioning**: S3 bucket versioning enabled for audit trail

### 5. Monitoring and Alerting
- **SNS Notifications**: Real-time alerts for compliance violations
- **CloudWatch Logs**: Centralized logging for Lambda functions (14-day retention)
- **CloudWatch Alarms**: Alerts for non-compliant resources and Config failures
- **Email Subscriptions**: Email notifications to compliance team

### 6. Cost Optimization
- **Lifecycle Policies**: Automatic deletion of old Config data after 90 days
- **Version Cleanup**: Non-current versions deleted after 30 days
- **Serverless Architecture**: Lambda and Config are pay-per-use
- **Log Retention**: Short retention period (14 days) to reduce costs

### 7. Operational Excellence
- **Resource Tagging**: All resources properly tagged
- **Parameter-driven**: Environment suffix for multi-environment support
- **Outputs**: Exports for cross-stack references
- **Documentation**: Clear descriptions for all resources

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Permissions to create Config, Lambda, S3, SNS, KMS, and IAM resources

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name compliance-validation \
     --template-body file://lib/TapStack.yml \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=prod \
       ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Confirm SNS subscription**:
   - Check email for SNS subscription confirmation
   - Click the confirmation link

4. **Enable Config Recorder**:
   ```bash
   aws configservice start-configuration-recorder \
     --configuration-recorder-name compliance-config-recorder-prod \
     --region us-east-1
   ```

5. **Verify deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name compliance-validation \
     --region us-east-1
   ```

## Testing the System

1. **Test S3 compliance**:
   ```bash
   # Create non-compliant bucket (no encryption)
   aws s3 mb s3://test-non-compliant-bucket

   # Wait for Config to detect and evaluate (2-5 minutes)
   # Check compliance status
   aws configservice get-compliance-details-by-resource \
     --resource-type AWS::S3::Bucket \
     --resource-id test-non-compliant-bucket
   ```

2. **Test custom validation**:
   - Create resources that violate custom rules
   - Monitor Lambda logs in CloudWatch
   - Verify compliance evaluations in Config dashboard

3. **Test notifications**:
   - Verify SNS email notifications are received
   - Check notification content includes resource details

## Extending with New Rules

To add new custom compliance checks:

1. Update the Lambda function code to handle new resource types
2. Add evaluation logic for the new resource type
3. Update the Config Rule scope to include the new resource type
4. Deploy the updated stack

Example:
```python
elif resource_type == 'AWS::Lambda::Function':
    compliance_type, annotation = evaluate_lambda_function(resource_id, configuration_item)
```

## Cleanup

To remove all resources:
```bash
# Stop Config recorder first
aws configservice stop-configuration-recorder \
  --configuration-recorder-name compliance-config-recorder-prod

# Delete the stack
aws cloudformation delete-stack \
  --stack-name compliance-validation

# Empty and delete the S3 bucket
aws s3 rm s3://config-compliance-data-prod-ACCOUNT_ID --recursive
```

## AWS Services Used

- AWS Config
- AWS Lambda
- Amazon S3
- Amazon SNS
- AWS KMS
- Amazon CloudWatch
- AWS IAM
