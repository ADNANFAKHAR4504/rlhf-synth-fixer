### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates an infrastructure analysis and compliance validation system. Let me break down the requirements:

1. **Lambda Functions (Python 3.12)**:
   - Analyzer function: Enumerates stacks, validates security policies, produces JSON reports, writes to S3, publishes to SNS
   - Periodic-scan function: Runs on schedule for missed events
   - Both need: Python 3.12 runtime, 300s timeout, 512-1024MB memory, encrypted env vars, DLQ, dedicated log groups

2. **EventBridge Rules**:
   - Event-driven triggers for stack lifecycle
   - Scheduled rule (5-10 minutes)

3. **S3 Storage**:
   - Two buckets for compliance reports and analysis results
   - Versioning enabled, Block Public Access, SSE-KMS with CMK
   - Lifecycle policy: Glacier after 90 days

4. **CloudWatch Logs**:
   - Dedicated log groups per function
   - 365 days retention
   - KMS encrypted

5. **KMS**:
   - Single CMK for all encryption needs
   - Proper key policy

6. **SNS**:
   - Topic for violations
   - Email subscription
   - KMS encrypted

7. **IAM**:
   - Least privilege roles
   - Explicit deny statements

8. **Compliance Checks**:
   - Unencrypted resources
   - Public access
   - Missing tags
   - Cross-stack references

9. **Traceability**:
   - Comprehensive JSON reports

10. **Parameters and Outputs**:
   - Various configuration parameters
   - Output all major resource ARNs

This is a complex template, but I'll create a comprehensive CloudFormation YAML that implements all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template for your infrastructure analysis and compliance validation system. This is a complex implementation that includes all the components you specified.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated Infrastructure Analysis and Compliance Validation System for Financial Services'

Parameters:
  NotificationEmail:
    Type: String
    Description: 'Email address for compliance violation notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

  RequiredTags:
    Type: CommaDelimitedList
    Description: 'Comma-separated list of required tags for compliance'
    Default: 'Owner,CostCenter,Environment,DataClassification,ComplianceLevel'

  PublicEndpointAllowlist:
    Type: CommaDelimitedList
    Description: 'Comma-separated list of ARNs allowed to have public access'
    Default: ''

  ComplianceReportsBucketName:
    Type: String
    Description: 'Name for compliance reports bucket (leave empty for auto-generated)'
    Default: ''

  AnalysisResultsBucketName:
    Type: String
    Description: 'Name for analysis results bucket (leave empty for auto-generated)'
    Default: ''

  KMSKeyAlias:
    Type: String
    Description: 'Alias for the KMS key'
    Default: 'compliance-validation-key'
    AllowedPattern: '^[a-zA-Z0-9/_-]+$'

  ScanScheduleRate:
    Type: String
    Description: 'Schedule rate for periodic compliance scans'
    Default: 'rate(10 minutes)'
    AllowedValues:
      - 'rate(5 minutes)'
      - 'rate(10 minutes)'
      - 'rate(15 minutes)'

  AlertSeverityThreshold:
    Type: String
    Description: 'Minimum severity level to trigger alerts'
    Default: 'MEDIUM'
    AllowedValues:
      - 'LOW'
      - 'MEDIUM'
      - 'HIGH'
      - 'CRITICAL'

Conditions:
  CreateComplianceReportsBucket: !Equals [!Ref ComplianceReportsBucketName, '']
  CreateAnalysisResultsBucket: !Equals [!Ref AnalysisResultsBucketName, '']

Resources:
  # ===========================
  # KMS Customer Managed Key
  # ===========================
  ComplianceKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer managed key for compliance validation system encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Id: 'compliance-key-policy'
        Statement:
          # Allow root account full access (for administration)
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          
          # Allow CloudWatch Logs to use the key
          - Sid: 'Allow CloudWatch Logs'
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
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
          
          # Allow SNS to use the key
          - Sid: 'Allow SNS'
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          
          # Allow Lambda to use the key for environment encryption
          - Sid: 'Allow Lambda'
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Purpose
          Value: ComplianceValidation
        - Key: ManagedBy
          Value: CloudFormation

  ComplianceKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${KMSKeyAlias}'
      TargetKeyId: !Ref ComplianceKMSKey

  # ===========================
  # S3 Buckets
  # ===========================
  ComplianceReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - CreateComplianceReportsBucket
        - !Sub 'compliance-reports-${AWS::AccountId}-${AWS::Region}'
        - !Ref ComplianceReportsBucketName
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKMSKey
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      Tags:
        - Key: Purpose
          Value: ComplianceReports
        - Key: DataRetention
          Value: LongTerm

  AnalysisResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - CreateAnalysisResultsBucket
        - !Sub 'analysis-results-${AWS::AccountId}-${AWS::Region}'
        - !Ref AnalysisResultsBucketName
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKMSKey
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
      Tags:
        - Key: Purpose
          Value: AnalysisResults
        - Key: DataRetention
          Value: LongTerm

  # Bucket policies for least privilege access
  ComplianceReportsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ComplianceReportsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ComplianceReportsBucket.Arn
              - !Sub '${ComplianceReportsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowAnalyzerFunctionAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt AnalyzerFunctionRole.Arn
            Action:
              - 's3:PutObject'
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt ComplianceReportsBucket.Arn
              - !Sub '${ComplianceReportsBucket.Arn}/*'

  AnalysisResultsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AnalysisResultsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt AnalysisResultsBucket.Arn
              - !Sub '${AnalysisResultsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowAnalyzerFunctionAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt AnalyzerFunctionRole.Arn
            Action:
              - 's3:PutObject'
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt AnalysisResultsBucket.Arn
              - !Sub '${AnalysisResultsBucket.Arn}/*'

  # ===========================
  # SNS Topic
  # ===========================
  ComplianceViolationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'compliance-violations-${AWS::StackName}'
      DisplayName: 'Compliance Violations Alert'
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags:
        - Key: Purpose
          Value: ComplianceAlerts

  ComplianceViolationsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref ComplianceViolationsTopic
      Endpoint: !Ref NotificationEmail

  # ===========================
  # SQS Dead Letter Queues
  # ===========================
  AnalyzerDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'analyzer-dlq-${AWS::StackName}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags:
        - Key: Purpose
          Value: AnalyzerDLQ

  PeriodicScanDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'periodic-scan-dlq-${AWS::StackName}'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags:
        - Key: Purpose
          Value: PeriodicScanDLQ

  # ===========================
  # CloudWatch Log Groups
  # ===========================
  AnalyzerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/compliance-analyzer-${AWS::StackName}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn

  PeriodicScanLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/periodic-scan-${AWS::StackName}'
      RetentionInDays: 365
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn

  # ===========================
  # IAM Roles
  # ===========================
  AnalyzerFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'compliance-analyzer-role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: AnalyzerExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt AnalyzerLogGroup.Arn
              
              # CloudFormation read permissions
              - Effect: Allow
                Action:
                  - 'cloudformation:DescribeStacks'
                  - 'cloudformation:GetTemplate'
                  - 'cloudformation:GetTemplateSummary'
                  - 'cloudformation:ListStacks'
                  - 'cloudformation:ListStackResources'
                  - 'cloudformation:ListExports'
                Resource: '*'
              
              # Tagging API permissions
              - Effect: Allow
                Action:
                  - 'tag:GetResources'
                  - 'tag:GetTagKeys'
                  - 'tag:GetTagValues'
                Resource: '*'
              
              # S3 permissions for report buckets
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !Sub '${ComplianceReportsBucket.Arn}/*'
                  - !GetAtt AnalysisResultsBucket.Arn
                  - !Sub '${AnalysisResultsBucket.Arn}/*'
              
              # KMS permissions for encryption
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:Encrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ComplianceKMSKey.Arn
              
              # SNS publish permissions
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref ComplianceViolationsTopic
              
              # SQS permissions for DLQ
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt AnalyzerDLQ.Arn
              
              # Read permissions for various services to inspect
              - Effect: Allow
                Action:
                  - 's3:GetBucketEncryption'
                  - 's3:GetBucketPublicAccessBlock'
                  - 's3:GetBucketVersioning'
                  - 's3:ListAllMyBuckets'
                  - 'ec2:DescribeInstances'
                  - 'ec2:DescribeVolumes'
                  - 'rds:DescribeDBInstances'
                  - 'elasticloadbalancing:DescribeLoadBalancers'
                Resource: '*'
              
              # Explicit deny statements for dangerous actions
              - Effect: Deny
                Action:
                  - 'kms:ScheduleKeyDeletion'
                  - 'kms:DisableKey'
                  - 's3:DeleteBucket'
                  - 's3:DeleteBucketPolicy'
                  - 's3:PutBucketAcl'
                  - 's3:PutObjectAcl'
                  - 'iam:PassRole'
                Resource: '*'
      Tags:
        - Key: Purpose
          Value: ComplianceAnalyzer

  PeriodicScanFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'periodic-scan-role-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: PeriodicScanExecutionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt PeriodicScanLogGroup.Arn
              
              # Lambda invoke permissions
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource: !GetAtt AnalyzerFunction.Arn
              
              # CloudFormation list permissions
              - Effect: Allow
                Action:
                  - 'cloudformation:ListStacks'
                Resource: '*'
              
              # KMS permissions for environment encryption
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt ComplianceKMSKey.Arn
              
              # SQS permissions for DLQ
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource: !GetAtt PeriodicScanDLQ.Arn
              
              # Explicit deny statements
              - Effect: Deny
                Action:
                  - 'kms:ScheduleKeyDeletion'
                  - 'kms:DisableKey'
                  - 'iam:PassRole'
                Resource: '*'
      Tags:
        - Key: Purpose
          Value: PeriodicScan

  # ===========================
  # Lambda Functions
  # ===========================
  AnalyzerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'compliance-analyzer-${AWS::StackName}'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt AnalyzerFunctionRole.Arn
      Timeout: 300
      MemorySize: 1024
      DeadLetterConfig:
        TargetArn: !GetAtt AnalyzerDLQ.Arn
      Environment:
        Variables:
          COMPLIANCE_BUCKET: !Ref ComplianceReportsBucket
          ANALYSIS_BUCKET: !Ref AnalysisResultsBucket
          SNS_TOPIC_ARN: !Ref ComplianceViolationsTopic
          REQUIRED_TAGS: !Join [',', !Ref RequiredTags]
          PUBLIC_ALLOWLIST: !Join [',', !Ref PublicEndpointAllowlist]
          SEVERITY_THRESHOLD: !Ref AlertSeverityThreshold
          KMS_KEY_ID: !Ref ComplianceKMSKey
      KmsKeyArn: !GetAtt ComplianceKMSKey.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import hashlib
          import datetime
          import uuid
          from typing import Dict, List, Any

          # Initialize AWS clients
          cfn = boto3.client('cloudformation')
          s3 = boto3.client('s3')
          sns = boto3.client('sns')
          tag_client = boto3.client('resourcegroupstaggingapi')

          # Environment variables
          COMPLIANCE_BUCKET = os.environ['COMPLIANCE_BUCKET']
          ANALYSIS_BUCKET = os.environ['ANALYSIS_BUCKET']
          SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
          REQUIRED_TAGS = os.environ['REQUIRED_TAGS'].split(',')
          PUBLIC_ALLOWLIST = os.environ.get('PUBLIC_ALLOWLIST', '').split(',')
          SEVERITY_THRESHOLD = os.environ['SEVERITY_THRESHOLD']
          KMS_KEY_ID = os.environ['KMS_KEY_ID']

          SEVERITY_LEVELS = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}

          def handler(event, context):
              """Main handler for compliance analysis"""
              print(f"Processing event: {json.dumps(event)}")
              
              evaluation_id = str(uuid.uuid4())
              timestamp = datetime.datetime.utcnow().isoformat()
              
              # Get account and region
              account_id = context.invoked_function_arn.split(':')[4]
              region = os.environ['AWS_REGION']
              
              # Determine event source
              event_source = event.get('source', 'scheduled')
              trigger_type = 'event-driven' if 'detail' in event else 'scheduled'
              
              # Get stacks to analyze
              stacks = get_stacks(event)
              
              all_findings = []
              violations = []
              
              for stack in stacks:
                  findings = analyze_stack(stack, account_id, region)
                  all_findings.extend(findings)
                  
                  # Filter violations based on severity
                  for finding in findings:
                      if SEVERITY_LEVELS.get(finding['severity'], 0) >= SEVERITY_LEVELS[SEVERITY_THRESHOLD]:
                          violations.append(finding)
              
              # Create reports
              summary_report = create_summary_report(
                  evaluation_id, account_id, region, all_findings, 
                  timestamp, trigger_type, event
              )
              
              detailed_report = create_detailed_report(
                  evaluation_id, account_id, region, all_findings, 
                  timestamp, trigger_type, event
              )
              
              # Store reports
              report_key = f"{account_id}/{region}/{datetime.datetime.utcnow().strftime('%Y/%m/%d')}/{evaluation_id}"
              
              # Save summary
              s3.put_object(
                  Bucket=COMPLIANCE_BUCKET,
                  Key=f"{report_key}/summary.json",
                  Body=json.dumps(summary_report),
                  ServerSideEncryption='aws:kms',
                  SSEKMSKeyId=KMS_KEY_ID,
                  ContentType='application/json'
              )
              
              # Save detailed report
              s3.put_object(
                  Bucket=ANALYSIS_BUCKET,
                  Key=f"{report_key}/detailed.json",
                  Body=json.dumps(detailed_report),
                  ServerSideEncryption='aws:kms',
                  SSEKMSKeyId=KMS_KEY_ID,
                  ContentType='application/json'
              )
              
              # Send SNS notification if violations found
              if violations:
                  send_violation_notification(
                      violations, evaluation_id, report_key
                  )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'evaluationId': evaluation_id,
                      'findingsCount': len(all_findings),
                      'violationsCount': len(violations)
                  })
              }

          def get_stacks(event):
              """Get list of stacks to analyze"""
              stacks = []
              
              # If specific stack in event, analyze it
              if 'detail' in event and 'stack-name' in event['detail']:
                  stack_name = event['detail']['stack-name']
                  try:
                      response = cfn.describe_stacks(StackName=stack_name)
                      stacks.extend(response['Stacks'])
                  except Exception as e:
                      print(f"Error describing stack {stack_name}: {str(e)}")
              else:
                  # Get all active stacks
                  paginator = cfn.get_paginator('list_stacks')
                  for page in paginator.paginate(
                      StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE']
                  ):
                      for stack_summary in page['StackSummaries']:
                          try:
                              response = cfn.describe_stacks(
                                  StackName=stack_summary['StackName']
                              )
                              stacks.extend(response['Stacks'])
                          except Exception as e:
                              print(f"Error describing stack: {str(e)}")
              
              return stacks

          def analyze_stack(stack, account_id, region):
              """Analyze a CloudFormation stack for compliance"""
              findings = []
              stack_name = stack['StackName']
              stack_id = stack['StackId']
              
              # Get template
              try:
                  template_response = cfn.get_template(StackName=stack_name)
                  template_body = template_response['TemplateBody']
                  if isinstance(template_body, str):
                      template = json.loads(template_body)
                  else:
                      template = template_body
                  template_hash = hashlib.sha256(
                      json.dumps(template, sort_keys=True).encode()
                  ).hexdigest()
              except Exception as e:
                  print(f"Error getting template: {str(e)}")
                  template = {}
                  template_hash = 'unknown'
              
              # Check required tags
              stack_tags = {tag['Key']: tag['Value'] for tag in stack.get('Tags', [])}
              for required_tag in REQUIRED_TAGS:
                  if required_tag not in stack_tags:
                      findings.append({
                          'stackName': stack_name,
                          'stackId': stack_id,
                          'resourceArn': stack_id,
                          'checkType': 'MISSING_TAG',
                          'severity': 'HIGH',
                          'finding': f'Missing required tag: {required_tag}',
                          'remediation': f'Add tag {required_tag} to the stack'
                      })
              
              # Get stack resources
              try:
                  resources_response = cfn.list_stack_resources(StackName=stack_name)
                  resources = resources_response['StackResourceSummaries']
                  
                  for resource in resources:
                      resource_findings = check_resource_compliance(
                          resource, stack_name, stack_id
                      )
                      findings.extend(resource_findings)
              except Exception as e:
                  print(f"Error listing resources: {str(e)}")
              
              # Check cross-stack references
              if 'Outputs' in template:
                  for output in template.get('Outputs', {}).values():
                      if 'Export' in output:
                          # This stack exports values
                          export_name = output['Export'].get('Name', '')
                          print(f"Stack exports: {export_name}")
              
              # Check ImportValue usage
              import_findings = check_import_values(template, stack_name, stack_id)
              findings.extend(import_findings)
              
              return findings

          def check_resource_compliance(resource, stack_name, stack_id):
              """Check individual resource for compliance violations"""
              findings = []
              resource_type = resource['ResourceType']
              logical_id = resource['LogicalResourceId']
              physical_id = resource.get('PhysicalResourceId', '')
              
              # Check S3 buckets
              if resource_type == 'AWS::S3::Bucket' and physical_id:
                  findings.extend(check_s3_bucket_compliance(
                      physical_id, stack_name, stack_id, logical_id
                  ))
              
              # Check RDS instances
              elif resource_type == 'AWS::RDS::DBInstance' and physical_id:
                  findings.extend(check_rds_compliance(
                      physical_id, stack_name, stack_id, logical_id
                  ))
              
              return findings

          def check_s3_bucket_compliance(bucket_name, stack_name, stack_id, logical_id):
              """Check S3 bucket compliance"""
              findings = []
              bucket_arn = f"arn:aws:s3:::{bucket_name}"
              
              try:
                  # Check encryption
                  encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                  rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                  if not rules or not any(
                      rule.get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm') == 'aws:kms'
                      for rule in rules
                  ):
                      findings.append({
                          'stackName': stack_name,
                          'stackId': stack_id,
                          'resourceArn': bucket_arn,
                          'logicalId': logical_id,
                          'checkType': 'ENCRYPTION',
                          'severity': 'CRITICAL',
                          'finding': 'S3 bucket not using KMS encryption',
                          'remediation': 'Enable SSE-KMS encryption on the bucket'
                      })
              except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                  findings.append({
                      'stackName': stack_name,
                      'stackId': stack_id,
                      'resourceArn': bucket_arn,
                      'logicalId': logical_id,
                      'checkType': 'ENCRYPTION',
                      'severity': 'CRITICAL',
                      'finding': 'S3 bucket has no encryption configured',
                      'remediation': 'Enable SSE-KMS encryption on the bucket'
                  })
              except Exception as e:
                  print(f"Error checking bucket encryption: {str(e)}")
              
              # Check public access
              try:
                  public_block = s3.get_public_access_block(Bucket=bucket_name)
                  config = public_block['PublicAccessBlockConfiguration']
                  if not all([
                      config.get('BlockPublicAcls', False),
                      config.get('BlockPublicPolicy', False),
                      config.get('IgnorePublicAcls', False),
                      config.get('RestrictPublicBuckets', False)
                  ]):
                      if bucket_arn not in PUBLIC_ALLOWLIST:
                          findings.append({
                              'stackName': stack_name,
                              'stackId': stack_id,
                              'resourceArn': bucket_arn,
                              'logicalId': logical_id,
                              'checkType': 'PUBLIC_ACCESS',
                              'severity': 'CRITICAL',
                              'finding': 'S3 bucket allows public access',
                              'remediation': 'Enable all public access block settings'
                          })
              except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                  if bucket_arn not in PUBLIC_ALLOWLIST:
                      findings.append({
                          'stackName': stack_name,
                          'stackId': stack_id,
                          'resourceArn': bucket_arn,
                          'logicalId': logical_id,
                          'checkType': 'PUBLIC_ACCESS',
                          'severity': 'CRITICAL',
                          'finding': 'S3 bucket has no public access block configuration',
                          'remediation': 'Enable public access block configuration'
                      })
              except Exception as e:
                  print(f"Error checking public access: {str(e)}")
              
              return findings

          def check_rds_compliance(db_instance_id, stack_name, stack_id, logical_id):
              """Check RDS instance compliance"""
              findings = []
              rds = boto3.client('rds')
              
              try:
                  response = rds.describe_db_instances(DBInstanceIdentifier=db_instance_id)
                  db_instance = response['DBInstances'][0]
                  db_arn = db_instance['DBInstanceArn']
                  
                  # Check encryption
                  if not db_instance.get('StorageEncrypted', False):
                      findings.append({
                          'stackName': stack_name,
                          'stackId': stack_id,
                          'resourceArn': db_arn,
                          'logicalId': logical_id,
                          'checkType': 'ENCRYPTION',
                          'severity': 'CRITICAL',
                          'finding': 'RDS instance storage is not encrypted',
                          'remediation': 'Enable storage encryption for the RDS instance'
                      })
                  
                  # Check public accessibility
                  if db_instance.get('PubliclyAccessible', False):
                      if db_arn not in PUBLIC_ALLOWLIST:
                          findings.append({
                              'stackName': stack_name,
                              'stackId': stack_id,
                              'resourceArn': db_arn,
                              'logicalId': logical_id,
                              'checkType': 'PUBLIC_ACCESS',
                              'severity': 'HIGH',
                              'finding': 'RDS instance is publicly accessible',
                              'remediation': 'Disable public accessibility for the RDS instance'
                          })
              except Exception as e:
                  print(f"Error checking RDS compliance: {str(e)}")
              
              return findings

          def check_import_values(template, stack_name, stack_id):
              """Check cross-stack references (ImportValue)"""
              findings = []
              
              # Get all exports in the account/region
              try:
                  exports_response = cfn.list_exports()
                  available_exports = {
                      export['Name']: export['Value'] 
                      for export in exports_response.get('Exports', [])
                  }
              except Exception as e:
                  print(f"Error listing exports: {str(e)}")
                  available_exports = {}
              
              # Recursively search template for Fn::ImportValue
              import_refs = find_import_values(template)
              
              for import_name in import_refs:
                  if import_name not in available_exports:
                      findings.append({
                          'stackName': stack_name,
                          'stackId': stack_id,
                          'resourceArn': stack_id,
                          'checkType': 'CROSS_STACK_REFERENCE',
                          'severity': 'HIGH',
                          'finding': f'ImportValue references non-existent export: {import_name}',
                          'remediation': f'Ensure export {import_name} exists or update the reference'
                      })
              
              return findings

          def find_import_values(obj, imports=None):
              """Recursively find all Fn::ImportValue references in template"""
              if imports is None:
                  imports = set()
              
              if isinstance(obj, dict):
                  if 'Fn::ImportValue' in obj:
                      import_value = obj['Fn::ImportValue']
                      if isinstance(import_value, str):
                          imports.add(import_value)
                      elif isinstance(import_value, dict) and 'Fn::Sub' in import_value:
                          # Handle substituted import values
                          imports.add(import_value['Fn::Sub'])
                  else:
                      for value in obj.values():
                          find_import_values(value, imports)
              elif isinstance(obj, list):
                  for item in obj:
                      find_import_values(item, imports)
              
              return imports

          def create_summary_report(evaluation_id, account_id, region, findings, 
                                   timestamp, trigger_type, event):
              """Create summary compliance report"""
              severity_counts = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0}
              check_type_counts = {}
              
              for finding in findings:
                  severity_counts[finding['severity']] += 1
                  check_type = finding['checkType']
                  check_type_counts[check_type] = check_type_counts.get(check_type, 0) + 1
              
              return {
                  'evaluationId': evaluation_id,
                  'accountId': account_id,
                  'region': region,
                  'timestamp': timestamp,
                  'triggerType': trigger_type,
                  'eventSource': event.get('source', 'manual'),
                  'summary': {
                      'totalFindings': len(findings),
                      'severityCounts': severity_counts,
                      'checkTypeCounts': check_type_counts
                  }
              }

          def create_detailed_report(evaluation_id, account_id, region, findings, 
                                    timestamp, trigger_type, event):
              """Create detailed compliance report"""
              return {
                  'evaluationId': evaluation_id,
                  'accountId': account_id,
                  'region': region,
                  'timestamp': timestamp,
                  'triggerType': trigger_type,
                  'eventSource': event.get('source', 'manual'),
                  'eventDetails': event,
                  'findings': findings
              }

          def send_violation_notification(violations, evaluation_id, report_key):
              """Send SNS notification for violations"""
              violation_summary = f"Compliance violations detected\n\n"
              violation_summary += f"Evaluation ID: {evaluation_id}\n"
              violation_summary += f"Total violations: {len(violations)}\n\n"
              
              # Group by severity
              by_severity = {}
              for v in violations:
                  severity = v['severity']
                  if severity not in by_severity:
                      by_severity[severity] = []
                  by_severity[severity].append(v)
              
              for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
                  if severity in by_severity:
                      violation_summary += f"\n{severity}: {len(by_severity[severity])} violations\n"
                      for v in by_severity[severity][:3]:  # Show first 3
                          violation_summary += f"  - {v['stackName']}: {v['finding']}\n"
              
              violation_summary += f"\n\nFull report: s3://{COMPLIANCE_BUCKET}/{report_key}/summary.json"
              
              sns.publish(
                  TopicArn=SNS_TOPIC_ARN,
                  Subject='Compliance Violation Alert',
                  Message=violation_summary
              )
      Tags:
        - Key: Purpose
          Value: ComplianceAnalyzer

  PeriodicScanFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'periodic-scan-${AWS::StackName}'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt PeriodicScanFunctionRole.Arn
      Timeout: 300
      MemorySize: 512
      DeadLetterConfig:
        TargetArn: !GetAtt PeriodicScanDLQ.Arn
      Environment:
        Variables:
          ANALYZER_FUNCTION_ARN: !GetAtt AnalyzerFunction.Arn
      KmsKeyArn: !GetAtt ComplianceKMSKey.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          lambda_client = boto3.client('lambda')
          cfn = boto3.client('cloudformation')

          ANALYZER_FUNCTION_ARN = os.environ['ANALYZER_FUNCTION_ARN']

          def handler(event, context):
              """Periodic scan handler to ensure all stacks are evaluated"""
              print(f"Starting periodic scan: {json.dumps(event)}")
              
              # Get all active stacks
              stacks_to_scan = []
              paginator = cfn.get_paginator('list_stacks')
              
              for page in paginator.paginate(
                  StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
              ):
                  for stack_summary in page['StackSummaries']:
                      # Check last modified time
                      last_updated = stack_summary.get('LastUpdatedTime', stack_summary['CreationTime'])
                      stacks_to_scan.append({
                          'StackName': stack_summary['StackName'],
                          'LastUpdated': str(last_updated)
                      })
              
              print(f"Found {len(stacks_to_scan)} stacks to scan")
              
              # Invoke analyzer function
              payload = {
                  'source': 'periodic-scan',
                  'triggerType': 'scheduled',
                  'scanTime': datetime.utcnow().isoformat(),
                  'stackCount': len(stacks_to_scan)
              }
              
              try:
                  response = lambda_client.invoke(
                      FunctionName=ANALYZER_FUNCTION_ARN,
                      InvocationType='Event',  # Asynchronous invocation
                      Payload=json.dumps(payload)
                  )
                  
                  print(f"Analyzer invoked successfully: {response['StatusCode']}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Periodic scan initiated',
                          'stackCount': len(stacks_to_scan),
                          'analyzerInvoked': True
                      })
                  }
              except Exception as e:
                  print(f"Error invoking analyzer: {str(e)}")
                  raise
      Tags:
        - Key: Purpose
          Value: PeriodicScan

  # ===========================
  # EventBridge Rules
  # ===========================
  StackChangeEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'stack-change-rule-${AWS::StackName}'
      Description: 'Trigger compliance analysis on stack changes'
      EventPattern:
        source:
          - aws.cloudformation
        detail-type:
          - CloudFormation Stack Status Change
        detail:
          status-details:
            status:
              - CREATE_COMPLETE
              - UPDATE_COMPLETE
              - UPDATE_ROLLBACK_COMPLETE
      State: ENABLED
      Targets:
        - Arn: !GetAtt AnalyzerFunction.Arn
          Id: AnalyzerTarget
          Input: !Sub |
            {
              "source": "cloudformation-event",
              "triggerType": "event-driven",
              "account": "${AWS::AccountId}",
              "region": "${AWS::Region}"
            }

  AnalyzerEventPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AnalyzerFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt StackChangeEventRule.Arn

  PeriodicScanScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'periodic-scan-rule-${AWS::StackName}'
      Description: 'Periodic compliance scan to ensure evaluations within 15 minutes'
      ScheduleExpression: !Ref ScanScheduleRate
      State: ENABLED
      Targets:
        - Arn: !GetAtt PeriodicScanFunction.Arn
          Id: PeriodicScanTarget
          Input: !Sub |
            {
              "source": "scheduled",
              "triggerType": "scheduled",
              "account": "${AWS::AccountId}",
              "region": "${AWS::Region}"
            }

  PeriodicScanEventPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref PeriodicScanFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt PeriodicScanScheduleRule.Arn

# ===========================
# Outputs
# ===========================
Outputs:
  ComplianceReportsBucketArn:
    Description: 'ARN of the compliance reports S3 bucket'
    Value: !GetAtt ComplianceReportsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceReportsBucketArn'

  ComplianceReportsBucketName:
    Description: 'Name of the compliance reports S3 bucket'
    Value: !Ref ComplianceReportsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceReportsBucketName'

  AnalysisResultsBucketArn:
    Description: 'ARN of the analysis results S3 bucket'
    Value: !GetAtt AnalysisResultsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisResultsBucketArn'

  AnalysisResultsBucketName:
    Description: 'Name of the analysis results S3 bucket'
    Value: !Ref AnalysisResultsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisResultsBucketName'

  ComplianceViolationsTopicArn:
    Description: 'ARN of the SNS topic for compliance violations'
    Value: !Ref ComplianceViolationsTopic
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceViolationsTopicArn'

  AnalyzerFunctionArn:
    Description: 'ARN of the compliance analyzer Lambda function'
    Value: !GetAtt AnalyzerFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalyzerFunctionArn'

  PeriodicScanFunctionArn:
    Description: 'ARN of the periodic scan Lambda function'
    Value: !GetAtt PeriodicScanFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PeriodicScanFunctionArn'

  KMSKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref ComplianceKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyAlias:
    Description: 'Alias of the KMS key'
    Value: !Ref ComplianceKMSKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'

  ReportsBaseURI:
    Description: 'Base S3 URI for compliance reports'
    Value: !Sub 's3://${ComplianceReportsBucket}/'
    Export:
      Name: !Sub '${AWS::StackName}-ReportsBaseURI'

  StackChangeEventRuleArn:
    Description: 'ARN of the EventBridge rule for stack changes'
    Value: !GetAtt StackChangeEventRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-StackChangeEventRuleArn'

  PeriodicScanScheduleRuleArn:
    Description: 'ARN of the EventBridge rule for periodic scans'
    Value: !GetAtt PeriodicScanScheduleRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PeriodicScanScheduleRuleArn'
```

## Key Features Implemented

### 1. **Security & Encryption**
- Customer-managed KMS key for all encryption (S3, SNS, SQS, CloudWatch Logs, Lambda environment)
- S3 buckets with versioning, lifecycle policies (Glacier after 90 days), and block public access
- Encrypted dead letter queues for Lambda functions
- 365-day retention for CloudWatch Logs

### 2. **Compliance Validation Logic**
The analyzer Lambda function performs:
- **Encryption checks**: Validates S3 buckets and RDS instances use KMS encryption
- **Public access checks**: Identifies resources with public exposure not on the allowlist
- **Tag compliance**: Verifies required tags are present
- **Cross-stack reference validation**: Checks ImportValue references resolve to existing exports

### 3. **Event-Driven Architecture**
- EventBridge rules trigger on CloudFormation stack changes (CREATE_COMPLETE, UPDATE_COMPLETE)
- Periodic scan ensures evaluations occur within 15 minutes even if events are missed
- Asynchronous Lambda invocations for scalability

### 4. **Comprehensive Reporting**
- JSON reports with evaluation IDs, timestamps, findings, severity levels, and remediation hints
- Two-tier storage: summary reports in compliance bucket, detailed reports in analysis bucket
- S3 path structure: `account/region/yyyy/mm/dd/evaluationId/`

### 5. **IAM Security**
- Least-privilege roles for each Lambda function
- Explicit deny statements for dangerous actions (KMS deletion, public S3 ACLs, etc.)
- Resource-level permissions where applicable

### 6. **Parameterization**
- Configurable required tags, public endpoint allowlist, scan schedule
- Adjustable severity threshold for alerts
- Optional custom bucket names

## Deployment Instructions

1. **Save the template** as `compliance-validation.yaml`

2. **Deploy via AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name compliance-validation-system \
  --template-body file://compliance-validation.yaml \
  --parameters \
    ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
    ParameterKey=RequiredTags,ParameterValue="Owner,CostCenter,Environment" \
    ParameterKey=ScanScheduleRate,ParameterValue="rate(10 minutes)" \
    ParameterKey=AlertSeverityThreshold,ParameterValue=MEDIUM \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-1
```

3. **Confirm SNS subscription** via the email you receive

4. **Monitor outputs** in CloudFormation console for resource ARNs and S3 URIs

## Example Compliance Report Structure

```json
{
  "evaluationId": "abc123-def456-789012",
  "accountId": "123456789012",
  "region": "eu-central-1",
  "timestamp": "2024-01-15T10:30:00Z",
  "triggerType": "event-driven",
  "findings": [
    {
      "stackName": "production-app",
      "stackId": "arn:aws:cloudformation:...",
      "resourceArn": "arn:aws:s3:::my-bucket",
      "checkType": "ENCRYPTION",
      "severity": "CRITICAL",
      "finding": "S3 bucket not using KMS encryption",
      "remediation": "Enable SSE-KMS encryption on the bucket"
    }
  ]
}
```

This template provides a production-ready compliance validation system that meets financial services requirements while avoiding dependency on managed compliance services like AWS Config or Security Hub.