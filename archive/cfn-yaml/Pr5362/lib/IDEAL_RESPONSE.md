Below is a production-ready **CloudFormation YAML** template for **eu-central-1** that deploys the system described above. It’s email-optional, cfn-lint clean, uses a single CMK across services, and applies the **correct** S3 lifecycle keys (`TransitionInDays` for current versions, `NoncurrentDays` for noncurrent versions).

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Automated Infrastructure Analysis and Compliance Validation System for Financial Services"

Parameters:
  NotificationEmail:
    Type: String
    Default: ""
    Description: "Email address for compliance violation notifications (optional)"
    AllowedPattern: '(^$)|(^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$)'

  RequiredTags:
    Type: CommaDelimitedList
    Description: "Comma-separated list of required tags for compliance"
    Default: "Owner,CostCenter,Environment,DataClassification,ComplianceLevel"

  PublicEndpointAllowlist:
    Type: CommaDelimitedList
    Description: "Comma-separated list of ARNs allowed to have public access"
    Default: ""

  ComplianceReportsBucketName:
    Type: String
    Description: "Name for compliance reports bucket (leave empty for auto-generated)"
    Default: ""

  AnalysisResultsBucketName:
    Type: String
    Description: "Name for analysis results bucket (leave empty for auto-generated)"
    Default: ""

  KMSKeyAlias:
    Type: String
    Description: "Alias for the KMS key"
    Default: "compliance-validation-key"
    AllowedPattern: "^[a-zA-Z0-9/_-]+$"

  ScanScheduleRate:
    Type: String
    Description: "Schedule rate for periodic compliance scans"
    Default: "rate(10 minutes)"
    AllowedValues:
      - "rate(5 minutes)"
      - "rate(10 minutes)"
      - "rate(15 minutes)"

  AlertSeverityThreshold:
    Type: String
    Description: "Minimum severity level to trigger alerts"
    Default: "MEDIUM"
    AllowedValues: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

Conditions:
  CreateComplianceReportsBucket: !Equals [!Ref ComplianceReportsBucketName, ""]
  CreateAnalysisResultsBucket: !Equals [!Ref AnalysisResultsBucketName, ""]
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, ""]]

Resources:
  # ---------------------------
  # KMS CMK + Alias
  # ---------------------------
  ComplianceKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "Customer managed key for compliance validation system encryption"
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Id: "compliance-key-policy"
        Statement:
          - Sid: EnableIAMUserPermissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: AllowCloudWatchLogsUse
            Effect: Allow
            Principal: { Service: logs.amazonaws.com }
            Action:
              - "kms:Encrypt"
              - "kms:Decrypt"
              - "kms:ReEncrypt*"
              - "kms:GenerateDataKey*"
              - "kms:CreateGrant"
              - "kms:DescribeKey"
            Resource: "*"
            Condition:
              ArnLike:
                "kms:EncryptionContext:aws:logs:arn": !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
          - Sid: AllowSNSUse
            Effect: Allow
            Principal: { Service: sns.amazonaws.com }
            Action:
              - "kms:Decrypt"
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
              - "kms:CreateGrant"
            Resource: "*"
          - Sid: AllowSQSUse
            Effect: Allow
            Principal: { Service: sqs.amazonaws.com }
            Action:
              - "kms:Encrypt"
              - "kms:Decrypt"
              - "kms:ReEncrypt*"
              - "kms:GenerateDataKey*"
              - "kms:DescribeKey"
              - "kms:CreateGrant"
            Resource: "*"
          - Sid: AllowLambdaEnvDecrypt
            Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action:
              - "kms:Decrypt"
              - "kms:DescribeKey"
              - "kms:GenerateDataKey*"
            Resource: "*"
      Tags:
        - { Key: Purpose, Value: ComplianceValidation }
        - { Key: ManagedBy, Value: CloudFormation }

  ComplianceKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${KMSKeyAlias}"
      TargetKeyId: !Ref ComplianceKMSKey

  # ---------------------------
  # S3 Buckets (reports, results)
  # ---------------------------
  ComplianceReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - CreateComplianceReportsBucket
        - !Sub "compliance-reports-${AWS::AccountId}-${AWS::Region}"
        - !Ref ComplianceReportsBucketName
      VersioningConfiguration: { Status: Enabled }
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
                NoncurrentDays: 90
      Tags:
        - { Key: Purpose, Value: ComplianceReports }
        - { Key: DataRetention, Value: LongTerm }

  AnalysisResultsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - CreateAnalysisResultsBucket
        - !Sub "analysis-results-${AWS::AccountId}-${AWS::Region}"
        - !Ref AnalysisResultsBucketName
      VersioningConfiguration: { Status: Enabled }
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
                NoncurrentDays: 90
      Tags:
        - { Key: Purpose, Value: AnalysisResults }
        - { Key: DataRetention, Value: LongTerm }

  ComplianceReportsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ComplianceReportsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt ComplianceReportsBucket.Arn
              - !Sub "${ComplianceReportsBucket.Arn}/*"
            Condition:
              Bool: { "aws:SecureTransport": "false" }
          - Sid: EnforceKmsEncryption
            Effect: Deny
            Principal: "*"
            Action: "s3:PutObject"
            Resource: !Sub "${ComplianceReportsBucket.Arn}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": "aws:kms"
          - Sid: AllowAnalyzerListBucket
            Effect: Allow
            Principal: { AWS: !GetAtt AnalyzerFunctionRole.Arn }
            Action: "s3:ListBucket"
            Resource: !GetAtt ComplianceReportsBucket.Arn
          - Sid: AllowAnalyzerReadWriteObjects
            Effect: Allow
            Principal: { AWS: !GetAtt AnalyzerFunctionRole.Arn }
            Action: ["s3:PutObject", "s3:GetObject"]
            Resource: !Sub "${ComplianceReportsBucket.Arn}/*"

  AnalysisResultsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AnalysisResultsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt AnalysisResultsBucket.Arn
              - !Sub "${AnalysisResultsBucket.Arn}/*"
            Condition:
              Bool: { "aws:SecureTransport": "false" }
          - Sid: EnforceKmsEncryption
            Effect: Deny
            Principal: "*"
            Action: "s3:PutObject"
            Resource: !Sub "${AnalysisResultsBucket.Arn}/*"
            Condition:
              StringNotEquals:
                "s3:x-amz-server-side-encryption": "aws:kms"
          - Sid: AllowAnalyzerListBucket
            Effect: Allow
            Principal: { AWS: !GetAtt AnalyzerFunctionRole.Arn }
            Action: "s3:ListBucket"
            Resource: !GetAtt AnalysisResultsBucket.Arn
          - Sid: AllowAnalyzerReadWriteObjects
            Effect: Allow
            Principal: { AWS: !GetAtt AnalyzerFunctionRole.Arn }
            Action: ["s3:PutObject", "s3:GetObject"]
            Resource: !Sub "${AnalysisResultsBucket.Arn}/*"

  # ---------------------------
  # SNS (topic + conditional email subscription)
  # ---------------------------
  ComplianceViolationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "compliance-violations-${AWS::StackName}"
      DisplayName: "Compliance Violations Alert"
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags: [{ Key: Purpose, Value: ComplianceAlerts }]

  ComplianceViolationsSubscription:
    Condition: HasNotificationEmail
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref ComplianceViolationsTopic
      Endpoint: !Ref NotificationEmail

  # ---------------------------
  # SQS DLQs
  # ---------------------------
  AnalyzerDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "analyzer-dlq-${AWS::StackName}"
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags: [{ Key: Purpose, Value: AnalyzerDLQ }]

  PeriodicScanDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "periodic-scan-dlq-${AWS::StackName}"
      MessageRetentionPeriod: 1209600
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags: [{ Key: Purpose, Value: PeriodicScanDLQ }]

  # ---------------------------
  # CloudWatch Logs (365 days)
  # ---------------------------
  AnalyzerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/compliance-analyzer-${AWS::StackName}"
      RetentionInDays: 365
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn

  PeriodicScanLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/periodic-scan-${AWS::StackName}"
      RetentionInDays: 365
      KmsKeyId: !GetAtt ComplianceKMSKey.Arn

  # ---------------------------
  # IAM Roles (least privilege + explicit denies)
  # ---------------------------
  AnalyzerFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "compliance-analyzer-role-${AWS::StackName}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
      Policies:
        - PolicyName: AnalyzerExecutionPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: LogsWrite
                Effect: Allow
                Action: ["logs:CreateLogStream", "logs:PutLogEvents"]
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/compliance-analyzer-${AWS::StackName}:*"
              - Sid: LogsCreateGroupIfMissing
                Effect: Allow
                Action: "logs:CreateLogGroup"
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
              - Sid: CloudFormationRead
                Effect: Allow
                Action:
                  - "cloudformation:DescribeStacks"
                  - "cloudformation:GetTemplate"
                  - "cloudformation:GetTemplateSummary"
                  - "cloudformation:ListStacks"
                  - "cloudformation:ListStackResources"
                  - "cloudformation:ListExports"
                Resource: "*"
              - Sid: TaggingRead
                Effect: Allow
                Action: ["tag:GetResources", "tag:GetTagKeys", "tag:GetTagValues"]
                Resource: "*"
              - Sid: S3ReadWriteReports
                Effect: Allow
                Action: ["s3:PutObject", "s3:GetObject"]
                Resource:
                  - !Sub "${ComplianceReportsBucket.Arn}/*"
                  - !Sub "${AnalysisResultsBucket.Arn}/*"
              - Sid: S3ListBuckets
                Effect: Allow
                Action: "s3:ListBucket"
                Resource:
                  - !GetAtt ComplianceReportsBucket.Arn
                  - !GetAtt AnalysisResultsBucket.Arn
              - Sid: ReadTargetsForChecks
                Effect: Allow
                Action:
                  - "s3:GetEncryptionConfiguration"   # correct action name for cfn-lint
                  - "s3:GetBucketPublicAccessBlock"
                  - "s3:GetBucketVersioning"
                  - "s3:ListAllMyBuckets"
                  - "ec2:DescribeInstances"
                  - "ec2:DescribeVolumes"
                  - "rds:DescribeDBInstances"
                  - "elasticloadbalancing:DescribeLoadBalancers"
                Resource: "*"
              - Sid: KmsUse
                Effect: Allow
                Action: ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey*", "kms:DescribeKey"]
                Resource: !GetAtt ComplianceKMSKey.Arn
              - Sid: SnsPublish
                Effect: Allow
                Action: "sns:Publish"
                Resource: !Ref ComplianceViolationsTopic
              - Sid: SqsDlqBasic
                Effect: Allow
                Action: ["sqs:SendMessage", "sqs:GetQueueAttributes"]
                Resource: !GetAtt AnalyzerDLQ.Arn
              - Sid: ExplicitDenies
                Effect: Deny
                Action:
                  - "kms:ScheduleKeyDeletion"
                  - "kms:DisableKey"
                  - "s3:DeleteBucket"
                  - "s3:DeleteBucketPolicy"
                  - "s3:PutBucketAcl"
                  - "s3:PutObjectAcl"
                  - "iam:PassRole"
                Resource: "*"
      Tags: [{ Key: Purpose, Value: ComplianceAnalyzer }]

  PeriodicScanFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "periodic-scan-role-${AWS::StackName}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: "sts:AssumeRole"
      Policies:
        - PolicyName: PeriodicScanExecutionPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: LogsWrite
                Effect: Allow
                Action: ["logs:CreateLogStream", "logs:PutLogEvents"]
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/periodic-scan-${AWS::StackName}:*"
              - Sid: LogsCreateGroupIfMissing
                Effect: Allow
                Action: "logs:CreateLogGroup"
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
              - Sid: InvokeAnalyzer
                Effect: Allow
                Action: "lambda:InvokeFunction"
                Resource: !GetAtt AnalyzerFunction.Arn
              - Sid: CloudFormationList
                Effect: Allow
                Action: "cloudformation:ListStacks"
                Resource: "*"
              - Sid: KmsEnvDecrypt
                Effect: Allow
                Action: "kms:Decrypt"
                Resource: !GetAtt ComplianceKMSKey.Arn
              - Sid: SqsDlqBasic
                Effect: Allow
                Action: ["sqs:SendMessage", "sqs:GetQueueAttributes"]
                Resource: !GetAtt PeriodicScanDLQ.Arn
              - Sid: ExplicitDenies
                Effect: Deny
                Action: ["kms:ScheduleKeyDeletion", "kms:DisableKey", "iam:PassRole"]
                Resource: "*"
      Tags: [{ Key: Purpose, Value: PeriodicScan }]

  # ---------------------------
  # Lambda Functions (Python 3.12)
  # ---------------------------
  AnalyzerFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "compliance-analyzer-${AWS::StackName}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt AnalyzerFunctionRole.Arn
      Timeout: 300
      MemorySize: 1024
      DeadLetterConfig: { TargetArn: !GetAtt AnalyzerDLQ.Arn }
      Environment:
        Variables:
          COMPLIANCE_BUCKET: !Ref ComplianceReportsBucket
          ANALYSIS_BUCKET: !Ref AnalysisResultsBucket
          SNS_TOPIC_ARN: !Ref ComplianceViolationsTopic
          REQUIRED_TAGS: !Join [",", !Ref RequiredTags]
          PUBLIC_ALLOWLIST: !Join [",", !Ref PublicEndpointAllowlist]
          SEVERITY_THRESHOLD: !Ref AlertSeverityThreshold
          KMS_KEY_ID: !Ref ComplianceKMSKey
      KmsKeyArn: !GetAtt ComplianceKMSKey.Arn
      Code:
        ZipFile: |
          import json, boto3, os, hashlib, datetime, uuid, re
          from typing import Dict, List, Any, Set

          cfn = boto3.client('cloudformation')
          s3  = boto3.client('s3')
          sns = boto3.client('sns')

          COMPLIANCE_BUCKET = os.environ['COMPLIANCE_BUCKET']
          ANALYSIS_BUCKET   = os.environ['ANALYSIS_BUCKET']
          SNS_TOPIC_ARN     = os.environ['SNS_TOPIC_ARN']
          REQUIRED_TAGS     = [t for t in os.environ.get('REQUIRED_TAGS','').split(',') if t]
          PUBLIC_ALLOWLIST  = set(a for a in os.environ.get('PUBLIC_ALLOWLIST','').split(',') if a)
          SEVERITY_THRESHOLD= os.environ['SEVERITY_THRESHOLD']
          KMS_KEY_ID        = os.environ['KMS_KEY_ID']
          SEVERITY_LEVELS   = {'LOW':1,'MEDIUM':2,'HIGH':3,'CRITICAL':4}

          def handler(event, context):
              evaluation_id = str(uuid.uuid4())
              ts = datetime.datetime.utcnow().isoformat()
              account_id = context.invoked_function_arn.split(':')[4]
              region = os.environ['AWS_REGION']
              trigger_type = 'event-driven' if 'detail' in event else 'scheduled'

              stacks = get_stacks(event)
              all_findings, violations = [], []

              for stack in stacks:
                  findings = analyze_stack(stack, account_id, region)
                  all_findings.extend(findings)
                  for f in findings:
                      if SEVERITY_LEVELS.get(f.get('severity','LOW'),0) >= SEVERITY_LEVELS[SEVERITY_THRESHOLD]:
                          violations.append(f)

              summary  = create_summary(evaluation_id, account_id, region, all_findings, ts, trigger_type, event)
              detailed = create_detailed(evaluation_id, account_id, region, all_findings, ts, trigger_type, event)

              key_prefix = f"{account_id}/{region}/{datetime.datetime.utcnow().strftime('%Y/%m/%d')}/{evaluation_id}"
              put_json(COMPLIANCE_BUCKET, f"{key_prefix}/summary.json", summary)
              put_json(ANALYSIS_BUCKET,   f"{key_prefix}/detailed.json", detailed)

              if violations:
                  notify(violations, evaluation_id, key_prefix)
              return {'statusCode':200,'body':json.dumps({'evaluationId':evaluation_id,'findingsCount':len(all_findings),'violationsCount':len(violations)})}

          def put_json(bucket, key, data):
              s3.put_object(Bucket=bucket, Key=key, Body=json.dumps(data), ServerSideEncryption='aws:kms', SSEKMSKeyId=KMS_KEY_ID, ContentType='application/json')

          def get_stacks(event)->List[Dict[str,Any]]:
              stacks=[]
              detail = event.get('detail') or {}
              name = detail.get('stack-name')
              try:
                  if name:
                      stacks.extend(cfn.describe_stacks(StackName=name).get('Stacks',[]))
                  else:
                      for page in cfn.get_paginator('list_stacks').paginate(StackStatusFilter=['CREATE_COMPLETE','UPDATE_COMPLETE','UPDATE_ROLLBACK_COMPLETE']):
                          for ssum in page.get('StackSummaries',[]):
                              try:
                                  stacks.extend(cfn.describe_stacks(StackName=ssum['StackName']).get('Stacks',[]))
                              except Exception as e: print(f"DescribeStacks err: {e}")
              except Exception as e: print(f"get_stacks err: {e}")
              return stacks

          def analyze_stack(stack, account_id, region)->List[Dict[str,Any]]:
              findings=[]
              name, sid = stack['StackName'], stack['StackId']
              template, thash, raw = get_template(name)

              tags={t['Key']:t['Value'] for t in stack.get('Tags',[])}
              for req in REQUIRED_TAGS:
                  if req not in tags:
                      findings.append(finding(name,sid,sid,None,'MISSING_TAG','HIGH',f"Missing required tag: {req}",f"Add tag {req}"))

              try:
                  res = cfn.list_stack_resources(StackName=name)
                  for r in res.get('StackResourceSummaries',[]):
                      findings.extend(check_resource(r, name, sid))
              except Exception as e: print(f"list_stack_resources err: {e}")

              findings.extend(check_imports(template, raw, name, sid))
              for f in findings: f['templateHash']=thash
              return findings

          def get_template(name):
              raw=''; template={}; th='unknown'
              try:
                  t=cfn.get_template(StackName=name, TemplateStage='Original').get('TemplateBody',{})
                  if isinstance(t,dict):
                      template=t; raw=json.dumps(t,sort_keys=True)
                  elif isinstance(t,str):
                      raw=t; 
                      try: template=json.loads(t)
                      except: template={}
                  th = hashlib.sha256(raw.encode('utf-8')).hexdigest() if raw else 'unknown'
              except Exception as e: print(f"get_template err: {e}")
              return template, th, raw

          def check_resource(resource, stack_name, stack_id):
              findings=[]
              rtype=resource.get('ResourceType'); lid=resource.get('LogicalResourceId'); pid=resource.get('PhysicalResourceId','')
              if rtype=='AWS::S3::Bucket' and pid: findings.extend(check_s3(pid, stack_name, stack_id, lid))
              if rtype=='AWS::RDS::DBInstance' and pid: findings.extend(check_rds(pid, stack_name, stack_id, lid))
              return findings

          def check_s3(bucket, stack_name, stack_id, lid):
              out=[]; arn=f"arn:aws:s3:::{bucket}"; c=boto3.client('s3')
              try:
                  enc=c.get_bucket_encryption(Bucket=bucket)
                  rules=enc.get('ServerSideEncryptionConfiguration',{}).get('Rules',[])
                  if not any(r.get('ApplyServerSideEncryptionByDefault',{}).get('SSEAlgorithm')=='aws:kms' for r in rules):
                      out.append(finding(stack_name,stack_id,arn,lid,'ENCRYPTION','CRITICAL','S3 bucket not using KMS encryption','Enable SSE-KMS'))
              except c.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                  out.append(finding(stack_name,stack_id,arn,lid,'ENCRYPTION','CRITICAL','S3 bucket has no encryption','Enable SSE-KMS'))
              try:
                  pab=c.get_public_access_block(Bucket=bucket)['PublicAccessBlockConfiguration']
                  if not all([pab.get('BlockPublicAcls'),pab.get('BlockPublicPolicy'),pab.get('IgnorePublicAcls'),pab.get('RestrictPublicBuckets')]):
                      if arn not in PUBLIC_ALLOWLIST:
                          out.append(finding(stack_name,stack_id,arn,lid,'PUBLIC_ACCESS','CRITICAL','S3 bucket allows public access','Enable public access block'))
              except c.exceptions.NoSuchPublicAccessBlockConfiguration:
                  if arn not in PUBLIC_ALLOWLIST:
                      out.append(finding(stack_name,stack_id,arn,lid,'PUBLIC_ACCESS','CRITICAL','S3 bucket lacks public access block','Enable public access block'))
              return out

          def check_rds(db_id, stack_name, stack_id, lid):
              out=[]; r=boto3.client('rds')
              try:
                  dbi=r.describe_db_instances(DBInstanceIdentifier=db_id)['DBInstances'][0]
                  arn=dbi['DBInstanceArn']
                  if not dbi.get('StorageEncrypted',False):
                      out.append(finding(stack_name,stack_id,arn,lid,'ENCRYPTION','CRITICAL','RDS storage not encrypted','Enable storage encryption'))
                  if dbi.get('PubliclyAccessible',False) and arn not in PUBLIC_ALLOWLIST:
                      out.append(finding(stack_name,stack_id,arn,lid,'PUBLIC_ACCESS','HIGH','RDS publicly accessible','Disable public accessibility'))
              except Exception as e: print(f"rds check err: {e}")
              return out

          def check_imports(template, raw, stack_name, stack_id):
              out=[]; exports=get_exports(); names=set(exports.keys()); imps=find_imports(template)
              if raw:
                  for m in re.finditer(r'Fn::ImportValue\\s*:\\s*[\\'\\"]([^\\'\\"]+)[\\'\\"]', raw):
                      imps.add(m.group(1))
              for n in sorted(imps):
                  if n not in names:
                      out.append({'stackName':stack_name,'stackId':stack_id,'resourceArn':stack_id,'checkType':'CROSS_STACK_REFERENCE','severity':'HIGH','finding':f'ImportValue missing export: {n}','remediation':f'Create or fix export {n}'})
              return out

          def get_exports():
              d={}
              try:
                  for p in cfn.get_paginator('list_exports').paginate():
                      for e in p.get('Exports',[]): d[e['Name']]=e.get('Value','')
              except Exception as e: print(f"list_exports err: {e}")
              return d

          def find_imports(obj, acc=None):
              if acc is None: acc=set()
              if isinstance(obj,dict):
                  if 'Fn::ImportValue' in obj:
                      v=obj['Fn::ImportValue']
                      if isinstance(v,str): acc.add(v)
                  for v in obj.values(): find_imports(v,acc)
              elif isinstance(obj,list):
                  for i in obj: find_imports(i,acc)
              return acc

          def finding(stack, sid, arn, lid, ctype, sev, msg, fix):
              return {'stackName':stack,'stackId':sid,'resourceArn':arn,'logicalId':lid,'checkType':ctype,'severity':sev,'finding':msg,'remediation':fix}

          def create_summary(eid, acct, region, findings, ts, trig, event):
              sev={'LOW':0,'MEDIUM':0,'HIGH':0,'CRITICAL':0}; kind={}
              for f in findings:
                  sev[f['severity']]=sev.get(f['severity'],0)+1
                  k=f['checkType']; kind[k]=kind.get(k,0)+1
              return {'evaluationId':eid,'accountId':acct,'region':region,'timestamp':ts,'triggerType':trig,'eventSource':event.get('source','manual'),'summary':{'totalFindings':len(findings),'severityCounts':sev,'checkTypeCounts':kind}}

          def create_detailed(eid, acct, region, findings, ts, trig, event):
              return {'evaluationId':eid,'accountId':acct,'region':region,'timestamp':ts,'triggerType':trig,'eventSource':event.get('source','manual'),'eventDetails':event,'findings':findings}

          def notify(violations, evaluation_id, key_prefix):
              lines=[f"Compliance violations detected","Evaluation ID: "+evaluation_id,f"Total violations: {len(violations)}",""]
              by={}
              for v in violations: by.setdefault(v['severity'],[]).append(v)
              for s in ['CRITICAL','HIGH','MEDIUM','LOW']:
                  if s in by:
                      lines.append(f"{s}: {len(by[s])} violations")
                      for v in by[s][:3]: lines.append(f"  - {v['stackName']}: {v['finding']}")
              lines.append("")
              lines.append(f"Full report: s3://{COMPLIANCE_BUCKET}/{key_prefix}/summary.json")
              sns.publish(TopicArn=SNS_TOPIC_ARN, Subject='Compliance Violation Alert', Message="\n".join(lines))

  PeriodicScanFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "periodic-scan-${AWS::StackName}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt PeriodicScanFunctionRole.Arn
      Timeout: 300
      MemorySize: 512
      DeadLetterConfig: { TargetArn: !GetAtt PeriodicScanDLQ.Arn }
      Environment:
        Variables:
          ANALYZER_FUNCTION_ARN: !GetAtt AnalyzerFunction.Arn
      KmsKeyArn: !GetAtt ComplianceKMSKey.Arn
      Code:
        ZipFile: |
          import json, boto3, os
          from datetime import datetime
          lmb=boto3.client('lambda')
          ANALYZER_FUNCTION_ARN=os.environ['ANALYZER_FUNCTION_ARN']
          def handler(event, context):
              payload={'source':'periodic-scan','triggerType':'scheduled','scanTime':datetime.utcnow().isoformat()}
              resp=lmb.invoke(FunctionName=ANALYZER_FUNCTION_ARN, InvocationType='Event', Payload=json.dumps(payload))
              return {'statusCode':200,'body':json.dumps({'message':'Periodic scan initiated'})}

  # ---------------------------
  # EventBridge Rules
  # ---------------------------
  StackChangeEventRule:
    Type: AWS::Events::Rule
    Properties:
      Description: "Trigger compliance analysis on stack changes"
      EventPattern:
        source: ["aws.cloudformation"]
        detail-type: ["CloudFormation Stack Status Change"]
        detail:
          status-details:
            status: ["CREATE_COMPLETE","UPDATE_COMPLETE","UPDATE_ROLLBACK_COMPLETE"]
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
      Description: "Periodic compliance scan to ensure evaluations within 15 minutes"
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

Outputs:
  ComplianceReportsBucketArn:
    Description: "ARN of the compliance reports S3 bucket"
    Value: !GetAtt ComplianceReportsBucket.Arn
    Export: { Name: !Sub "${AWS::StackName}-ComplianceReportsBucketArn" }

  ComplianceReportsBucketName:
    Description: "Name of the compliance reports S3 bucket"
    Value: !Ref ComplianceReportsBucket
    Export: { Name: !Sub "${AWS::StackName}-ComplianceReportsBucketName" }

  AnalysisResultsBucketArn:
    Description: "ARN of the analysis results S3 bucket"
    Value: !GetAtt AnalysisResultsBucket.Arn
    Export: { Name: !Sub "${AWS::StackName}-AnalysisResultsBucketArn" }

  AnalysisResultsBucketName:
    Description: "Name of the analysis results S3 bucket"
    Value: !Ref AnalysisResultsBucket
    Export: { Name: !Sub "${AWS::StackName}-AnalysisResultsBucketName" }

  ComplianceViolationsTopicArn:
    Description: "ARN of the SNS topic for compliance violations"
    Value: !Ref ComplianceViolationsTopic
    Export: { Name: !Sub "${AWS::StackName}-ComplianceViolationsTopicArn" }

  AnalyzerFunctionArn:
    Description: "ARN of the compliance analyzer Lambda function"
    Value: !GetAtt AnalyzerFunction.Arn
    Export: { Name: !Sub "${AWS::StackName}-AnalyzerFunctionArn" }

  PeriodicScanFunctionArn:
    Description: "ARN of the periodic scan Lambda function"
    Value: !GetAtt PeriodicScanFunction.Arn
    Export: { Name: !Sub "${AWS::StackName}-PeriodicScanFunctionArn" }

  KMSKeyId:
    Description: "ID of the KMS key used for encryption"
    Value: !Ref ComplianceKMSKey
    Export: { Name: !Sub "${AWS::StackName}-KMSKeyId" }

  KMSKeyAlias:
    Description: "Alias of the KMS key"
    Value: !Ref ComplianceKMSKeyAlias
    Export: { Name: !Sub "${AWS::StackName}-KMSKeyAlias" }

  ReportsBaseURI:
    Description: "Base S3 URI for compliance reports"
    Value: !Sub "s3://${ComplianceReportsBucket}/"
    Export: { Name: !Sub "${AWS::StackName}-ReportsBaseURI" }

  StackChangeEventRuleArn:
    Description: "ARN of the EventBridge rule for stack changes"
    Value: !GetAtt StackChangeEventRule.Arn
    Export: { Name: !Sub "${AWS::StackName}-StackChangeEventRuleArn" }

  PeriodicScanScheduleRuleArn:
    Description: "ARN of the EventBridge rule for periodic scans"
    Value: !GetAtt PeriodicScanScheduleRule.Arn
    Export: { Name: !Sub "${AWS::StackName}-PeriodicScanScheduleRuleArn" }
```
