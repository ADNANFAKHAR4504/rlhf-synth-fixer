### Reasoning Trace

---

This is a comprehensive request for a CloudFormation template that creates a compliance checking infrastructure. Let me break down the requirements:

1. **S3 Bucket**: With versioning and KMS encryption for storing CloudFormation templates
2. **AWS Config**: With rules for S3 encryption, IAM policy safety, and mandatory tagging (15-minute evaluation)
3. **IAM Roles**: Least-privilege access for Lambda and Config, with explicit deny statements
4. **DynamoDB Table**: On-demand billing, TTL for 90 days
5. **CloudWatch Logs**: 30-day retention
6. **CloudWatch Alarms**: Trigger SNS notifications
7. **SNS**: Encrypted messages with SecureTransport
8. **Cross-account scanning**: Assume roles with external IDs
9. **Systems Manager Parameter Store**: Store compliance rule parameters
10. **Standard tags**: Environment, CostCenter, Owner on all resources
11. **Region**: us-east-1

Note: SCPs (Service Control Policies) cannot be created via CloudFormation as they are Organization-level policies, but I'll mention this in the documentation.

Let me create a comprehensive CloudFormation template that addresses all these requirements.

### Answer

---

I'll create a comprehensive CloudFormation template for your compliance checking infrastructure. This solution provides automated security and governance validation for CloudFormation templates across multiple AWS accounts.

## CloudFormation Compliance Infrastructure Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete Compliance Checking Infrastructure for CloudFormation Templates'

Parameters:
  Environment:
    Type: String
    Default: 'Production'
    AllowedValues:
      - Development
      - Staging
      - Production
    Description: Environment designation for tagging

  CostCenter:
    Type: String
    Default: 'Compliance'
    Description: Cost center for billing allocation

  Owner:
    Type: String
    Default: 'SecurityTeam'
    Description: Owner team or individual

  NotificationEmail:
    Type: String
    Description: Email address for compliance notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

  CrossAccountExternalId:
    Type: String
    Description: External ID for cross-account assume role
    NoEcho: true
    MinLength: 32
    Default: 'ComplianceScanner-ExternalId-2024-Secure'

Mappings:
  RegionConfig:
    us-east-1:
      ConfigRecorderName: compliance-recorder
      DeliveryChannelName: compliance-delivery

Resources:
  # ========================================
  # KMS Key for Encryption
  # ========================================
  ComplianceKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for Compliance Infrastructure encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Id: compliance-key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for encryption
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - logs.amazonaws.com
                - sns.amazonaws.com
                - config.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: logs.us-east-1.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner
        - Key: Purpose
          Value: ComplianceInfrastructure

  ComplianceKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/compliance-infrastructure
      TargetKeyId: !Ref ComplianceKMSKey

  # ========================================
  # S3 Bucket for CloudFormation Templates
  # ========================================
  ComplianceTemplateBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'compliance-cfn-templates-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKMSKey
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            NoncurrentVersionExpirationInDays: 90
            Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ComplianceScannerFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: '.yaml'
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ComplianceScannerFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: '.yml'
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ComplianceScannerFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: suffix
                    Value: '.json'
      LoggingConfiguration:
        DestinationBucketName: !Ref ComplianceLogBucket
        LogFilePrefix: 'template-bucket-logs/'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ComplianceLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'compliance-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            ExpirationInDays: 365
            Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ComplianceTemplateBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ComplianceTemplateBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ComplianceTemplateBucket.Arn
              - !Sub '${ComplianceTemplateBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ========================================
  # DynamoDB Table for Violation Tracking
  # ========================================
  ComplianceViolationsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: ComplianceViolations
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: ViolationId
          AttributeType: S
        - AttributeName: AccountId
          AttributeType: S
        - AttributeName: Timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: ViolationId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: AccountIdTimestampIndex
          KeySchema:
            - AttributeName: AccountId
              KeyType: HASH
            - AttributeName: Timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      TimeToLiveSpecification:
        Enabled: true
        AttributeName: TTL
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref ComplianceKMSKey
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # CloudWatch Log Groups
  # ========================================
  ComplianceLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/compliance-scanner
      RetentionInDays: 30
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ComplianceConfigLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/config/compliance
      RetentionInDays: 30
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # SNS Topic for Notifications
  # ========================================
  ComplianceNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ComplianceViolationAlerts
      DisplayName: Compliance Violation Alerts
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ComplianceNotificationTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref ComplianceNotificationTopic
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: RequireSecureTransport
            Effect: Deny
            Principal: '*'
            Action:
              - 'SNS:Publish'
            Resource: !Ref ComplianceNotificationTopic
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowCloudWatchAlarms
            Effect: Allow
            Principal:
              Service: cloudwatch.amazonaws.com
            Action: 'SNS:Publish'
            Resource: !Ref ComplianceNotificationTopic

  # ========================================
  # IAM Roles and Policies
  # ========================================
  ComplianceLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ComplianceLambdaExecutionRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': !Ref CrossAccountExternalId
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: ComplianceLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ReadAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ComplianceTemplateBucket.Arn
                  - !Sub '${ComplianceTemplateBucket.Arn}/*'
              - Sid: DynamoDBAccess
                Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:UpdateItem'
                Resource:
                  - !GetAtt ComplianceViolationsTable.Arn
                  - !Sub '${ComplianceViolationsTable.Arn}/index/*'
              - Sid: SNSPublish
                Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref ComplianceNotificationTopic
              - Sid: KMSDecrypt
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ComplianceKMSKey.Arn
              - Sid: ParameterStoreAccess
                Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/compliance/*'
              - Sid: CloudFormationValidate
                Effect: Allow
                Action:
                  - 'cloudformation:ValidateTemplate'
                Resource: '*'
              - Sid: LogsWrite
                Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt ComplianceLambdaLogGroup.Arn
              - Sid: ExplicitDenyDangerousActions
                Effect: Deny
                Action:
                  - 'iam:DeleteRole*'
                  - 'iam:DeletePolicy*'
                  - 'iam:DetachRolePolicy'
                  - 'iam:DetachUserPolicy'
                  - 'iam:DetachGroupPolicy'
                  - 'kms:ScheduleKeyDeletion'
                  - 'kms:Delete*'
                  - 's3:DeleteBucket*'
                  - 'dynamodb:DeleteTable'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ComplianceConfigServiceRole
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
        - PolicyName: ConfigServicePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource:
                  - !GetAtt ComplianceLogBucket.Arn
                  - !Sub '${ComplianceLogBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ComplianceKMSKey.Arn
              - Effect: Deny
                Action:
                  - 'config:DeleteConfigurationRecorder'
                  - 'config:DeleteDeliveryChannel'
                  - 'config:StopConfigurationRecorder'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  CrossAccountScannerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ComplianceCrossAccountScannerRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !GetAtt ComplianceLambdaRole.Arn
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': !Ref CrossAccountExternalId
      Policies:
        - PolicyName: CrossAccountScannerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: ReadOnlyAccess
                Effect: Allow
                Action:
                  - 'cloudformation:Describe*'
                  - 'cloudformation:List*'
                  - 'cloudformation:Get*'
                  - 'cloudformation:ValidateTemplate'
                  - 'iam:Get*'
                  - 'iam:List*'
                  - 'iam:SimulateCustomPolicy'
                  - 'iam:SimulatePrincipalPolicy'
                  - 's3:Get*'
                  - 's3:List*'
                  - 'tag:Get*'
                Resource: '*'
              - Sid: DenyDangerousActions
                Effect: Deny
                Action:
                  - '*:Delete*'
                  - '*:Remove*'
                  - '*:Terminate*'
                  - '*:Stop*'
                  - '*:Shutdown*'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  # ========================================
  # Lambda Function for Compliance Scanning
  # ========================================
  ComplianceScannerFunction:
    Type: AWS::Lambda::Function
    DependsOn: ComplianceLambdaLogGroup
    Properties:
      FunctionName: ComplianceTemplateScanner
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt ComplianceLambdaRole.Arn
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          VIOLATIONS_TABLE: !Ref ComplianceViolationsTable
          SNS_TOPIC_ARN: !Ref ComplianceNotificationTopic
          CROSS_ACCOUNT_ROLE_ARN: !GetAtt CrossAccountScannerRole.Arn
          EXTERNAL_ID: !Ref CrossAccountExternalId
          PARAMETER_PREFIX: '/compliance/rules/'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import uuid
          import time
          from datetime import datetime, timedelta
          import yaml
          import traceback

          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          sns_client = boto3.client('sns')
          ssm_client = boto3.client('ssm')
          cfn_client = boto3.client('cloudformation')

          def lambda_handler(event, context):
              """Main handler for compliance scanning"""
              try:
                  # Extract S3 event details
                  bucket = event['Records'][0]['s3']['bucket']['name']
                  key = event['Records'][0]['s3']['object']['key']
                  
                  # Get the template from S3
                  response = s3_client.get_object(Bucket=bucket, Key=key)
                  template_content = response['Body'].read().decode('utf-8')
                  
                  # Parse template (YAML or JSON)
                  try:
                      template = yaml.safe_load(template_content)
                  except yaml.YAMLError:
                      template = json.loads(template_content)
                  
                  # Validate template syntax
                  try:
                      cfn_client.validate_template(TemplateBody=template_content)
                  except Exception as e:
                      record_violation('SYNTAX_ERROR', str(e), bucket, key)
                      return
                  
                  # Load compliance rules from Parameter Store
                  rules = load_compliance_rules()
                  
                  # Perform compliance checks
                  violations = []
                  
                  # Check for required tags
                  violations.extend(check_required_tags(template, rules))
                  
                  # Check S3 encryption
                  violations.extend(check_s3_encryption(template, rules))
                  
                  # Check IAM policies
                  violations.extend(check_iam_policies(template, rules))
                  
                  # Check for public resources
                  violations.extend(check_public_access(template, rules))
                  
                  # Record violations
                  for violation in violations:
                      record_violation(
                          violation['type'],
                          violation['message'],
                          bucket,
                          key,
                          violation.get('resource'),
                          violation.get('severity', 'HIGH')
                      )
                  
                  # Send notification if violations found
                  if violations:
                      send_notification(bucket, key, violations)
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Compliance scan completed',
                          'violations': len(violations)
                      })
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  print(traceback.format_exc())
                  record_violation('SCAN_ERROR', str(e), bucket, key)
                  raise

          def load_compliance_rules():
              """Load compliance rules from Parameter Store"""
              prefix = os.environ['PARAMETER_PREFIX']
              try:
                  response = ssm_client.get_parameters_by_path(
                      Path=prefix,
                      Recursive=True,
                      WithDecryption=True
                  )
                  rules = {}
                  for param in response.get('Parameters', []):
                      key = param['Name'].replace(prefix, '')
                      rules[key] = json.loads(param['Value'])
                  return rules
              except:
                  # Return default rules if Parameter Store is empty
                  return {
                      'required_tags': ['Environment', 'CostCenter', 'Owner'],
                      's3_encryption_required': True,
                      'iam_wildcard_prohibited': True,
                      'public_access_prohibited': True
                  }

          def check_required_tags(template, rules):
              """Check if resources have required tags"""
              violations = []
              required_tags = rules.get('required_tags', [])
              
              for resource_name, resource in template.get('Resources', {}).items():
                  tags = resource.get('Properties', {}).get('Tags', [])
                  tag_keys = [tag.get('Key') for tag in tags] if isinstance(tags, list) else []
                  
                  missing_tags = [tag for tag in required_tags if tag not in tag_keys]
                  if missing_tags:
                      violations.append({
                          'type': 'MISSING_TAGS',
                          'resource': resource_name,
                          'message': f"Resource {resource_name} missing required tags: {missing_tags}",
                          'severity': 'MEDIUM'
                      })
              
              return violations

          def check_s3_encryption(template, rules):
              """Check S3 buckets for encryption"""
              violations = []
              if not rules.get('s3_encryption_required', True):
                  return violations
              
              for resource_name, resource in template.get('Resources', {}).items():
                  if resource.get('Type') == 'AWS::S3::Bucket':
                      encryption = resource.get('Properties', {}).get('BucketEncryption')
                      if not encryption:
                          violations.append({
                              'type': 'S3_ENCRYPTION_MISSING',
                              'resource': resource_name,
                              'message': f"S3 bucket {resource_name} does not have encryption enabled",
                              'severity': 'HIGH'
                          })
              
              return violations

          def check_iam_policies(template, rules):
              """Check IAM policies for security issues"""
              violations = []
              if not rules.get('iam_wildcard_prohibited', True):
                  return violations
              
              for resource_name, resource in template.get('Resources', {}).items():
                  if 'Policy' in resource.get('Type', ''):
                      policy_doc = resource.get('Properties', {}).get('PolicyDocument', {})
                      for statement in policy_doc.get('Statement', []):
                          if statement.get('Effect') == 'Allow':
                              actions = statement.get('Action', [])
                              if isinstance(actions, str):
                                  actions = [actions]
                              if any('*' in action for action in actions):
                                  violations.append({
                                      'type': 'IAM_WILDCARD_ACTION',
                                      'resource': resource_name,
                                      'message': f"IAM policy {resource_name} contains wildcard actions",
                                      'severity': 'HIGH'
                                  })
              
              return violations

          def check_public_access(template, rules):
              """Check for publicly accessible resources"""
              violations = []
              if not rules.get('public_access_prohibited', True):
                  return violations
              
              for resource_name, resource in template.get('Resources', {}).items():
                  resource_type = resource.get('Type', '')
                  
                  # Check S3 bucket policies
                  if resource_type == 'AWS::S3::BucketPolicy':
                      policy = resource.get('Properties', {}).get('PolicyDocument', {})
                      for statement in policy.get('Statement', []):
                          principal = statement.get('Principal', {})
                          if principal == '*' or (isinstance(principal, dict) and principal.get('AWS') == '*'):
                              violations.append({
                                  'type': 'PUBLIC_S3_ACCESS',
                                  'resource': resource_name,
                                  'message': f"S3 bucket policy {resource_name} allows public access",
                                  'severity': 'CRITICAL'
                              })
              
              return violations

          def record_violation(violation_type, message, bucket, key, resource=None, severity='HIGH'):
              """Record violation in DynamoDB"""
              table = dynamodb.Table(os.environ['VIOLATIONS_TABLE'])
              
              violation_id = str(uuid.uuid4())
              timestamp = int(datetime.now().timestamp())
              ttl = int((datetime.now() + timedelta(days=90)).timestamp())
              
              item = {
                  'ViolationId': violation_id,
                  'AccountId': boto3.client('sts').get_caller_identity()['Account'],
                  'Timestamp': timestamp,
                  'TTL': ttl,
                  'ViolationType': violation_type,
                  'Message': message,
                  'Bucket': bucket,
                  'Key': key,
                  'Severity': severity
              }
              
              if resource:
                  item['Resource'] = resource
              
              table.put_item(Item=item)

          def send_notification(bucket, key, violations):
              """Send SNS notification for violations"""
              message = f"Compliance violations detected in template: s3://{bucket}/{key}\n\n"
              message += f"Total violations: {len(violations)}\n\n"
              
              for v in violations[:10]:  # Limit to first 10 violations
                  message += f"- [{v['severity']}] {v['type']}: {v['message']}\n"
              
              if len(violations) > 10:
                  message += f"\n... and {len(violations) - 10} more violations"
              
              sns_client.publish(
                  TopicArn=os.environ['SNS_TOPIC_ARN'],
                  Subject=f"Compliance Alert: {len(violations)} violations found",
                  Message=message
              )
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt ComplianceScannerFunction.Arn
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !Sub 'arn:aws:s3:::compliance-cfn-templates-${AWS::AccountId}'

  # ========================================
  # AWS Config Configuration
  # ========================================
  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !FindInMap [RegionConfig, !Ref 'AWS::Region', ConfigRecorderName]
      RoleArn: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  DeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !FindInMap [RegionConfig, !Ref 'AWS::Region', DeliveryChannelName]
      S3BucketName: !Ref ComplianceLogBucket
      S3KeyPrefix: config-logs/
      SnsTopicARN: !Ref ComplianceNotificationTopic
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: TwentyFour_Hours

  ConfigRecorderStatus:
    Type: AWS::Config::ConfigurationRecorderStatus
    Properties:
      ConfigurationRecorderName: !Ref ConfigurationRecorder
      IsEnabled: true
    DependsOn:
      - DeliveryChannel
      - ConfigurationRecorder

  # ========================================
  # AWS Config Rules
  # ========================================
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Description: Checks if S3 buckets have server-side encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket
      MaximumExecutionFrequency: Fifteen_Minutes

  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: required-tags-compliance
      Description: Checks if resources have required tags
      InputParameters: |
        {
          "tag1Key": "Environment",
          "tag2Key": "CostCenter",
          "tag3Key": "Owner"
        }
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance
          - AWS::S3::Bucket
          - AWS::Lambda::Function
      MaximumExecutionFrequency: Fifteen_Minutes

  IAMPolicyNoWildcardRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: iam-policy-no-statements-with-admin-access
      Description: Checks if IAM policies grant admin access
      Source:
        Owner: AWS
        SourceIdentifier: IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS
      Scope:
        ComplianceResourceTypes:
          - AWS::IAM::Policy
      MaximumExecutionFrequency: Fifteen_Minutes

  S3PublicAccessBlockRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorderStatus
    Properties:
      ConfigRuleName: s3-account-level-public-access-blocks
      Description: Checks if S3 public access is blocked at account level
      Source:
        Owner: AWS
        SourceIdentifier: S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS
      MaximumExecutionFrequency: Fifteen_Minutes

  # ========================================
  # CloudWatch Alarms
  # ========================================
  HighViolationCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ComplianceHighViolationCount
      AlarmDescription: Alert when violation count exceeds threshold
      MetricName: ViolationCount
      Namespace: Compliance
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref ComplianceNotificationTopic
      TreatMissingData: notBreaching

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ComplianceLambdaErrors
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ComplianceScannerFunction
      AlarmActions:
        - !Ref ComplianceNotificationTopic
      TreatMissingData: notBreaching

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ComplianceDynamoDBThrottle
      AlarmDescription: Alert on DynamoDB throttling
      MetricName: ThrottledRequests
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref ComplianceViolationsTable
      AlarmActions:
        - !Ref ComplianceNotificationTopic
      TreatMissingData: notBreaching

  # ========================================
  # Systems Manager Parameter Store
  # ========================================
  ComplianceRulesParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /compliance/rules/required_tags
      Type: String
      Value: !Sub |
        ["Environment", "CostCenter", "Owner"]
      Description: Required tags for all resources
      Tags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        Owner: !Ref Owner

  S3EncryptionRuleParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /compliance/rules/s3_encryption_required
      Type: String
      Value: 'true'
      Description: S3 encryption requirement flag
      Tags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        Owner: !Ref Owner

  IAMWildcardRuleParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /compliance/rules/iam_wildcard_prohibited
      Type: String
      Value: 'true'
      Description: IAM wildcard action prohibition flag
      Tags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        Owner: !Ref Owner

  PublicAccessRuleParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: /compliance/rules/public_access_prohibited
      Type: String
      Value: 'true'
      Description: Public access prohibition flag
      Tags:
        Environment: !Ref Environment
        CostCenter: !Ref CostCenter
        Owner: !Ref Owner

Outputs:
  TemplateBucketName:
    Description: S3 bucket for uploading CloudFormation templates
    Value: !Ref ComplianceTemplateBucket
    Export:
      Name: !Sub '${AWS::StackName}-TemplateBucket'

  ViolationsTableName:
    Description: DynamoDB table storing compliance violations
    Value: !Ref ComplianceViolationsTable
    Export:
      Name: !Sub '${AWS::StackName}-ViolationsTable'

  NotificationTopicArn:
    Description: SNS topic for compliance alerts
    Value: !Ref ComplianceNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-NotificationTopic'

  CrossAccountRoleArn:
    Description: IAM role for cross-account scanning
    Value: !GetAtt CrossAccountScannerRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CrossAccountRole'

  ExternalId:
    Description: External ID for cross-account access
    Value: !Ref CrossAccountExternalId
    Export:
      Name: !Sub '${AWS::StackName}-ExternalId'

  LambdaFunctionArn:
    Description: Compliance scanner Lambda function ARN
    Value: !GetAtt ComplianceScannerFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  KMSKeyId:
    Description: KMS key for encryption
    Value: !Ref ComplianceKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKey'
```

## Key Features & Implementation Details

### 🔒 **Security Architecture**

- **KMS Encryption**: All data at rest uses customer-managed KMS keys
- **SecureTransport**: Enforced via bucket and SNS policies
- **Least Privilege**: IAM roles with explicit deny statements for dangerous operations
- **Cross-Account Security**: External ID validation for assume role operations

### 📊 **Compliance Checking**

- **Automated Scanning**: Lambda triggers on S3 object creation
- **Multiple Validation Types**:
  - Required tags validation
  - S3 encryption verification
  - IAM wildcard action detection
  - Public access prevention
  - CloudFormation syntax validation

### 🔍 **AWS Config Rules** (15-minute evaluation)

1. S3 server-side encryption enabled
2. Required tags compliance
3. IAM policy admin access restrictions
4. S3 public access blocks

### 📈 **Monitoring & Alerting**

- **CloudWatch Alarms**: High violation counts, Lambda errors, DynamoDB throttling
- **SNS Notifications**: Encrypted, email-based alerts
- **Audit Logs**: 30-day retention with KMS encryption
- **DynamoDB TTL**: 90-day automatic cleanup

### 🔧 **Dynamic Configuration**

- **Parameter Store**: Runtime rule configuration without code changes
- **Extensible Rules**: JSON-based rule definitions

### 🏗️ **Production-Ready Features**

- **Point-in-Time Recovery**: DynamoDB backup enabled
- **Versioning**: S3 bucket versioning with lifecycle policies
- **Error Handling**: Comprehensive exception management in Lambda
- **Scalability**: On-demand DynamoDB billing, serverless architecture

## Deployment Instructions

1. **Save the template** as `compliance-infrastructure.yaml`

2. **Deploy the stack**:

```bash
aws cloudformation create-stack \
  --stack-name compliance-infrastructure \
  --template-body file://compliance-infrastructure.yaml \
  --parameters \
    ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
    ParameterKey=Environment,ParameterValue=Production \
    ParameterKey=CostCenter,ParameterValue=Security \
    ParameterKey=Owner,ParameterValue=SecurityTeam \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **For cross-account scanning**, share the `CrossAccountRoleArn` and `ExternalId` outputs with target accounts

4. **Create Service Control Policies (SCPs)** in AWS Organizations to prevent deletion:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "cloudformation:DeleteStack",
        "s3:DeleteBucket*",
        "dynamodb:DeleteTable",
        "config:DeleteConfigurationRecorder"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:PrincipalArn": "arn:aws:iam::*:role/Compliance*"
        }
      }
    }
  ]
}
```

## Usage

1. **Upload CloudFormation templates** to the compliance S3 bucket
2. **Monitor violations** in DynamoDB and via email notifications
3. **Configure rules** dynamically via Parameter Store
4. **Review compliance** through AWS Config dashboard
5. **Analyze trends** using CloudWatch metrics and logs

This infrastructure provides a robust, secure, and scalable solution for CloudFormation compliance validation across your AWS environment.
