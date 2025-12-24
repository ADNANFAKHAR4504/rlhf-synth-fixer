**ideal_response.md**

# TapStack – Async Financial Message Processing (Design & Acceptance)

## Functional scope (build everything new):

* Provision brand-new, region-scoped infrastructure for asynchronous trade/event processing using **SQS FIFO**, **AWS Lambda**, **DynamoDB (PAY_PER_REQUEST)**, **EventBridge**, **CloudWatch (alarms + dashboard)**, and **SSM Parameter Store**.
* No dependencies on pre-existing resources; every module is created within the template.
* Cross-region DR strategy by deploying the same template in a secondary region and wiring a replication Lambda to the DR queue URL stored in SSM.

## Deliverable:

* A single **CloudFormation YAML** file named **TapStack.yml** containing: Parameters, Conditions, Resources, and Outputs.
* All **resource names include `EnvironmentSuffix`** to prevent collisions.
* **No hard environment AllowedValues**; enforce a **safe regex** on `EnvironmentSuffix`.
* Outputs publish URLs/ARNs needed by downstream services (queues, Lambdas, table name, dashboard).
* Clear comments and best-practice defaults to pass **cfn-lint** and deploy cleanly.

## Architecture overview:

* **Primary SQS FIFO** (`orders-ENV.fifo`) with **DLQ** (`orders-dlq-ENV.fifo`), content-based deduplication, and redrive policy with `maxReceiveCount: 3`.
* **Primary Lambda** (reserved concurrency to protect downstreams) consumes from primary queue; idempotent writes to **DynamoDB** (`message-state-ENV`) for processed tracking.
* **Replication Lambda** consumes from primary queue and **sends to DR FIFO** (`orders-dr-ENV.fifo`) resolved via **SSM** path; preserves `MessageGroupId`/dedup.
* **EventBridge** routes DLQ alarm state changes to **SNS** for notifications.
* **CloudWatch**: alarms on queue depth/DLQ depth, and a dashboard showing queue depth & Lambda invocations/errors.
* **SSM parameters** publish queue URLs/ARNs, visibility timeout, and optional trusted role ARN.

## Regions & deployment order:

* Two regions: **Primary: us-east-1**, **DR: us-west-2**.
* **Deploy DR first** (creates DR queue + SSM entries), then **deploy Primary** and point replication to the DR SSM path.

## Mandatory requirements mapping:

1. **FIFO SQS + content-based dedup**: primary and DR queues are FIFO with dedup; DLQs defined with `maxReceiveCount: 3`.
2. **DLQs + alarms**: DLQs attached; CloudWatch alarms thresholded by parameters.
3. **Lambda concurrency**: reserved concurrency parameters for primary and replication processors.
4. **DynamoDB PAY_PER_REQUEST**: state tracking table with GSI and conditional write for idempotency.
5. **EventBridge routing of failures**: alarm state changes routed to SNS via EventBridge rule.
6. **Cross-region replication**: replication Lambda pushes to DR queue URL resolved from SSM.
7. **CloudWatch dashboard**: queue depth and Lambda metrics visualized.
8. **Queue policy for trusted accounts**: optional, gated by presence of `TrustedRoleArn`.
9. **Automatic purge for non-prod**: EventBridge schedule + Lambda (guarded by non-prod condition).
10. **SSM parameters**: publish queue URLs/ARNs and configuration knobs.

## Naming & constraints:

* All names include **`EnvironmentSuffix`**.
* `EnvironmentSuffix` validated by **regex** (lowercase letters, digits, hyphens), not hardcoded enumerations.
* IAM global-name collisions prevented by appending **region** to IAM role/policy names or letting CFN autoname.

## Security & best practices:

* Least-privilege policies for Lambdas and queues; optional **cross-account** access through explicit principal ARN.
* DLQ for every consumer path; alarms for visibility spikes.
* Small Lambda batch size for FIFO ordering; **no batching window** (unsupported on FIFO).

## Acceptance criteria:

* `cfn-lint` passes with zero errors.
* Stacks deploy cleanly in **us-west-2 (DR) then us-east-1 (Primary)**.
* Primary queue consumes and writes idempotently to DynamoDB; DLQ receives failed items after 3 attempts.
* Replication Lambda pushes to DR queue using SSM-resolved URL.
* Dashboard and alarms visible; SSM parameters populated.
* Queue purge scheduling active only when non-prod flag is enabled.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: "TapStack - Async financial processing (SQS FIFO, Lambda, DynamoDB, EventBridge, CloudWatch, SSM). All names include EnvironmentSuffix. Security-hardened & production-ready."

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod-us'
    Description: "Suffix used in resource names (e.g., prod-us, production, qa). Lowercase letters, digits, hyphens only."
    AllowedPattern: '^[a-z0-9-]{2,20}$'
    MinLength: 2
    MaxLength: 20

  PrimaryRegion:
    Type: String
    Description: "Primary region for dashboard rendering and SSM ARNs."
    Default: "us-east-1"
    AllowedValues:
      - us-east-1
      - us-west-2

  IsProduction:
    Type: String
    Description: "true to disable auto-purge; false enables non-prod purge (when flag below is true)."
    Default: "false"
    AllowedValues: ["true", "false"]

  QueueVisibilityTimeoutSeconds:
    Type: Number
    Description: "Default SQS visibility timeout (seconds)."
    Default: 60
    MinValue: 1
    MaxValue: 43200

  PrimaryLambdaReservedConcurrency:
    Type: Number
    Description: "Reserved concurrency for primary processor Lambda."
    Default: 50
    MinValue: 1
    MaxValue: 10000

  ReplicationLambdaReservedConcurrency:
    Type: Number
    Description: "Reserved concurrency for replication Lambda."
    Default: 10
    MinValue: 1
    MaxValue: 1000

  DlqAlarmThreshold:
    Type: Number
    Description: "DLQ visible messages alarm threshold."
    Default: 10
    MinValue: 1
    MaxValue: 100000

  QueueDepthAlarmThreshold:
    Type: Number
    Description: "Primary queue visible messages alarm threshold."
    Default: 1000
    MinValue: 1
    MaxValue: 1000000

  TrustedRoleArn:
    Type: String
    Description: "Optional IAM role ARN from a trusted account for least-privileged queue access. Leave blank to skip."
    Default: ""
    AllowedPattern: '^$|^arn:aws:iam::[0-9]{12}:role\/[A-Za-z0-9+=,.@_\-\/]+$'

  EnableAutoPurgeNonProd:
    Type: String
    Description: "Enable scheduled queue purging in non-production (true/false)."
    Default: "true"
    AllowedValues: ["true", "false"]

  QueuePurgeScheduleExpression:
    Type: String
    Description: "EventBridge schedule for purge (cron() or rate()). Used only if non-prod and enabled."
    Default: "cron(0 3 ? * SUN *)"
    AllowedPattern: '^(cron\(.+\)|rate\(.+\))$'

Conditions:
  IsProdEnv: !Equals [!Ref IsProduction, "true"]
  HasTrustedRole: !Not [!Equals [!Ref TrustedRoleArn, ""]]
  AutoPurgeActive: !And
    - !Equals [!Ref EnableAutoPurgeNonProd, "true"]
    - !Not [!Condition IsProdEnv]

Resources:

  # ---------------- SQS (Primary + DLQ) ----------------
  PrimaryDlqQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "orders-dlq-${EnvironmentSuffix}.fifo"
      FifoQueue: true
      ContentBasedDeduplication: true
      VisibilityTimeout: !Ref QueueVisibilityTimeoutSeconds
      ReceiveMessageWaitTimeSeconds: 10
      SqsManagedSseEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  PrimaryFifoQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "orders-${EnvironmentSuffix}.fifo"
      FifoQueue: true
      ContentBasedDeduplication: true
      VisibilityTimeout: !Ref QueueVisibilityTimeoutSeconds
      ReceiveMessageWaitTimeSeconds: 10
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt PrimaryDlqQueue.Arn
        maxReceiveCount: 3
      SqsManagedSseEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  # ---------------- SQS (DR pattern in same region) ----------------
  DrDlqQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "orders-dr-dlq-${EnvironmentSuffix}.fifo"
      FifoQueue: true
      ContentBasedDeduplication: true
      VisibilityTimeout: !Ref QueueVisibilityTimeoutSeconds
      ReceiveMessageWaitTimeSeconds: 10
      SqsManagedSseEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  DrFifoQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "orders-dr-${EnvironmentSuffix}.fifo"
      FifoQueue: true
      ContentBasedDeduplication: true
      VisibilityTimeout: !Ref QueueVisibilityTimeoutSeconds
      ReceiveMessageWaitTimeSeconds: 10
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt DrDlqQueue.Arn
        maxReceiveCount: 3
      SqsManagedSseEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  # ---------------- Queue Policies (optional trusted role) ----------------
  QueuePolicyPrimary:
    Type: AWS::SQS::QueuePolicy
    Condition: HasTrustedRole
    Properties:
      Queues: [!Ref PrimaryFifoQueue]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowTrustedRoleAccessPrimary
            Effect: Allow
            Principal: { AWS: !Ref TrustedRoleArn }
            Action:
              - sqs:SendMessage
              - sqs:ReceiveMessage
              - sqs:GetQueueAttributes
              - sqs:GetQueueUrl
              - sqs:DeleteMessage
              - sqs:ChangeMessageVisibility
            Resource: !GetAtt PrimaryFifoQueue.Arn

  QueuePolicyPrimaryDlq:
    Type: AWS::SQS::QueuePolicy
    Condition: HasTrustedRole
    Properties:
      Queues: [!Ref PrimaryDlqQueue]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowTrustedRoleReadPrimaryDlq
            Effect: Allow
            Principal: { AWS: !Ref TrustedRoleArn }
            Action:
              - sqs:ReceiveMessage
              - sqs:GetQueueAttributes
              - sqs:GetQueueUrl
            Resource: !GetAtt PrimaryDlqQueue.Arn

  QueuePolicyDr:
    Type: AWS::SQS::QueuePolicy
    Condition: HasTrustedRole
    Properties:
      Queues: [!Ref DrFifoQueue]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowTrustedRoleAccessDr
            Effect: Allow
            Principal: { AWS: !Ref TrustedRoleArn }
            Action:
              - sqs:SendMessage
              - sqs:ReceiveMessage
              - sqs:GetQueueAttributes
              - sqs:GetQueueUrl
              - sqs:DeleteMessage
              - sqs:ChangeMessageVisibility
            Resource: !GetAtt DrFifoQueue.Arn

  QueuePolicyDrDlq:
    Type: AWS::SQS::QueuePolicy
    Condition: HasTrustedRole
    Properties:
      Queues: [!Ref DrDlqQueue]
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowTrustedRoleReadDrDlq
            Effect: Allow
            Principal: { AWS: !Ref TrustedRoleArn }
            Action:
              - sqs:ReceiveMessage
              - sqs:GetQueueAttributes
              - sqs:GetQueueUrl
            Resource: !GetAtt DrDlqQueue.Arn

  # ---------------- IAM Managed Policy for Lambda logs (scoped to log groups) ----------------
  LambdaExecutionManagedPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "lambda-exec-base-${EnvironmentSuffix}-${AWS::Region}"
      Description: "Base policy for Lambda logs (scoped to specific log groups)"
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: LogsCore
            Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
              - logs:DescribeLogStreams
            Resource:
              - !Sub "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/primary-processor-${EnvironmentSuffix}:*"
              - !Sub "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/queue-replication-${EnvironmentSuffix}:*"
              - !Sub "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/queue-purge-${EnvironmentSuffix}:*"

  # ---------------- IAM Roles ----------------
  PrimaryProcessorLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "primary-processor-role-${EnvironmentSuffix}-${AWS::Region}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns: [!Ref LambdaExecutionManagedPolicy]
      Policies:
        - PolicyName: !Sub "primary-processor-inline-${EnvironmentSuffix}-${AWS::Region}"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:ChangeMessageVisibility
                  - sqs:GetQueueAttributes
                Resource: !GetAtt PrimaryFifoQueue.Arn
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                  - dynamodb:ConditionCheckItem
                Resource: !GetAtt MessageStateTable.Arn
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                Resource: !Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/async/${EnvironmentSuffix}/*"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  ReplicationLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "replication-lambda-role-${EnvironmentSuffix}-${AWS::Region}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns: [!Ref LambdaExecutionManagedPolicy]
      Policies:
        - PolicyName: !Sub "replication-inline-${EnvironmentSuffix}-${AWS::Region}"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt PrimaryFifoQueue.Arn
              - Effect: Allow
                Action: [sqs:SendMessage]
                Resource: !GetAtt DrFifoQueue.Arn
              - Effect: Allow
                Action: [cloudwatch:PutMetricData]
                Resource: "*"
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                Resource: !Sub "arn:${AWS::Partition}:ssm:${AWS::Region}:${AWS::AccountId}:parameter/async/${EnvironmentSuffix}/*"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  QueuePurgeLambdaRole:
    Type: AWS::IAM::Role
    Condition: AutoPurgeActive
    Properties:
      RoleName: !Sub "queue-purge-role-${EnvironmentSuffix}-${AWS::Region}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns: [!Ref LambdaExecutionManagedPolicy]
      Policies:
        - PolicyName: !Sub "queue-purge-inline-${EnvironmentSuffix}-${AWS::Region}"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - sqs:PurgeQueue
                  - sqs:GetQueueAttributes
                Resource:
                  - !GetAtt PrimaryFifoQueue.Arn
                  - !GetAtt PrimaryDlqQueue.Arn
                  - !GetAtt DrFifoQueue.Arn
                  - !GetAtt DrDlqQueue.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  # ---------------- Lambda Log Groups (retention) ----------------
  PrimaryProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/primary-processor-${EnvironmentSuffix}"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  ReplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/queue-replication-${EnvironmentSuffix}"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  QueuePurgeLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: AutoPurgeActive
    Properties:
      LogGroupName: !Sub "/aws/lambda/queue-purge-${EnvironmentSuffix}"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  # ---------------- Lambdas ----------------
  PrimaryProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "primary-processor-${EnvironmentSuffix}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt PrimaryProcessorLambdaRole.Arn
      Timeout: 30
      MemorySize: 512
      ReservedConcurrentExecutions: !Ref PrimaryLambdaReservedConcurrency
      Environment:
        Variables:
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
          PRIMARY_QUEUE_URL_SSM: !Ref PrimaryQueueUrlParameter
          PRIMARY_DLQ_URL_SSM: !Ref PrimaryDlqUrlParameter
          MESSAGE_TABLE_NAME: !Ref MessageStateTable
      Code:
        ZipFile: |
          import os
          import json
          import boto3
          from botocore.exceptions import ClientError
          from datetime import datetime, timezone

          ddb = boto3.client('dynamodb')

          def handler(event, context):
              table = os.environ.get('MESSAGE_TABLE_NAME')
              now = datetime.now(timezone.utc).isoformat()
              for record in event.get('Records', []):
                  msg_id = record.get('messageId')
                  body = record.get('body', '')
                  try:
                      ddb.put_item(
                          TableName=table,
                          Item={
                              'MessageId': {'S': msg_id},
                              'ProcessedAt': {'S': now},
                              'Payload': {'S': body},
                              'Status': {'S': 'PROCESSED'}
                          },
                          ConditionExpression='attribute_not_exists(MessageId)'
                      )
                  except ClientError as e:
                      error_code = e.response.get('Error', {}).get('Code')
                      if error_code != 'ConditionalCheckFailedException':
                          print(f"DynamoDB error: {error_code} - {e}")
                          raise
                      print(f"Duplicate message detected: {msg_id}")
              return {'statusCode': 200}
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  PrimaryProcessorEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      FunctionName: !Ref PrimaryProcessorLambda
      EventSourceArn: !GetAtt PrimaryFifoQueue.Arn
      Enabled: true
      BatchSize: 5

  ReplicationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "queue-replication-${EnvironmentSuffix}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt ReplicationLambdaRole.Arn
      Timeout: 30
      MemorySize: 256
      ReservedConcurrentExecutions: !Ref ReplicationLambdaReservedConcurrency
      Environment:
        Variables:
          DEST_QUEUE_URL_PARAM: !Ref DrQueueUrlParameter
      Code:
        ZipFile: |
          import os
          import boto3
          from botocore.exceptions import ClientError
          sqs = boto3.client('sqs')
          ssm = boto3.client('ssm')

          def _resolve_dest(param_or_url):
              if not param_or_url:
                  return None
              if param_or_url.startswith('/'):
                  try:
                      return ssm.get_parameter(Name=param_or_url)['Parameter']['Value']
                  except ClientError as e:
                      print(f"SSM get_parameter failed: {e}")
                      return None
              return param_or_url

          def handler(event, context):
              dest = _resolve_dest(os.environ.get('DEST_QUEUE_URL_PARAM')) or os.environ.get('DEST_QUEUE_URL')
              if not dest:
                  raise ValueError('Destination queue not configured')

              for record in event.get('Records', []):
                  body = record.get('body', '')
                  attrs = record.get('attributes', {}) or {}
                  group_id = attrs.get('MessageGroupId')
                  if not group_id:
                      raise ValueError(f"Missing MessageGroupId for message {record.get('messageId')}")
                  dedup = attrs.get('MessageDeduplicationId') or record.get('messageId')
                  try:
                      sqs.send_message(
                          QueueUrl=dest,
                          MessageBody=body,
                          MessageGroupId=group_id,
                          MessageDeduplicationId=dedup
                      )
                  except ClientError as exc:
                      print('Replication send failed', exc)
                      raise
              return {'statusCode': 200}
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  ReplicationEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      FunctionName: !Ref ReplicationLambda
      EventSourceArn: !GetAtt PrimaryFifoQueue.Arn
      Enabled: true
      BatchSize: 5

  QueuePurgeLambda:
    Type: AWS::Lambda::Function
    Condition: AutoPurgeActive
    Properties:
      FunctionName: !Sub "queue-purge-${EnvironmentSuffix}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt QueuePurgeLambdaRole.Arn
      Timeout: 60
      MemorySize: 128
      Environment:
        Variables:
          PRIMARY_QUEUE_URL: !Ref PrimaryFifoQueue
          PRIMARY_DLQ_URL: !Ref PrimaryDlqQueue
          DR_QUEUE_URL: !Ref DrFifoQueue
          DR_DLQ_URL: !Ref DrDlqQueue
      Code:
        ZipFile: |
          import os
          import boto3
          from botocore.exceptions import ClientError
          sqs = boto3.client('sqs')

          def _purge(url):
              if not url:
                  return
              try:
                  sqs.purge_queue(QueueUrl=url)
                  print('Purged:', url)
              except ClientError as e:
                  print('Purge failed:', e)

          def handler(event, context):
              for u in [os.environ.get('PRIMARY_QUEUE_URL'),
                        os.environ.get('PRIMARY_DLQ_URL'),
                        os.environ.get('DR_QUEUE_URL'),
                        os.environ.get('DR_DLQ_URL')]:
                  _purge(u)
              return {'status': 'ok'}
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  QueuePurgeSchedule:
    Type: AWS::Events::Rule
    Condition: AutoPurgeActive
    Properties:
      Name: !Sub "queue-purge-schedule-${EnvironmentSuffix}"
      ScheduleExpression: !Ref QueuePurgeScheduleExpression
      State: ENABLED
      Targets:
        - Id: !Sub "queue-purge-target-${EnvironmentSuffix}"
          Arn: !GetAtt QueuePurgeLambda.Arn

  QueuePurgeLambdaPermission:
    Type: AWS::Lambda::Permission
    Condition: AutoPurgeActive
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref QueuePurgeLambda
      Principal: events.amazonaws.com
      SourceArn: !GetAtt QueuePurgeSchedule.Arn

  # ---------------- DynamoDB ----------------
  MessageStateTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "message-state-${EnvironmentSuffix}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: MessageId
          AttributeType: S
        - AttributeName: ProcessingKey
          AttributeType: S
      KeySchema:
        - AttributeName: MessageId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ProcessingKeyIndex
          KeySchema:
            - AttributeName: ProcessingKey
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: FinancialProcessing
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: AsyncMessageProcessing

  # ---------------- CloudWatch Alarms ----------------
  PrimaryQueueDepthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "primary-queue-depth-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Primary FIFO queue depth exceeds ${QueueDepthAlarmThreshold} (${EnvironmentSuffix})"
      Namespace: AWS/SQS
      MetricName: ApproximateNumberOfMessagesVisible
      Dimensions:
        - Name: QueueName
          Value: !GetAtt PrimaryFifoQueue.QueueName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: !Ref QueueDepthAlarmThreshold
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  PrimaryDlqDepthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "primary-dlq-depth-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Primary DLQ depth exceeds ${DlqAlarmThreshold} (${EnvironmentSuffix})"
      Namespace: AWS/SQS
      MetricName: ApproximateNumberOfMessagesVisible
      Dimensions:
        - Name: QueueName
          Value: !GetAtt PrimaryDlqQueue.QueueName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: !Ref DlqAlarmThreshold
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  DrQueueDepthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "dr-queue-depth-${EnvironmentSuffix}"
      AlarmDescription: !Sub "DR FIFO queue depth exceeds ${QueueDepthAlarmThreshold} (${EnvironmentSuffix})"
      Namespace: AWS/SQS
      MetricName: ApproximateNumberOfMessagesVisible
      Dimensions:
        - Name: QueueName
          Value: !GetAtt DrFifoQueue.QueueName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: !Ref QueueDepthAlarmThreshold
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  DrDlqDepthAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "dr-dlq-depth-${EnvironmentSuffix}"
      AlarmDescription: !Sub "DR DLQ depth exceeds ${DlqAlarmThreshold} (${EnvironmentSuffix})"
      Namespace: AWS/SQS
      MetricName: ApproximateNumberOfMessagesVisible
      Dimensions:
        - Name: QueueName
          Value: !GetAtt DrDlqQueue.QueueName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: !Ref DlqAlarmThreshold
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  PrimaryProcessorThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "primary-processor-throttles-${EnvironmentSuffix}"
      Namespace: AWS/Lambda
      MetricName: Throttles
      Dimensions:
        - Name: FunctionName
          Value: !Ref PrimaryProcessorLambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  ReplicationThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "replication-throttles-${EnvironmentSuffix}"
      Namespace: AWS/Lambda
      MetricName: Throttles
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReplicationLambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  ReplicationLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "replication-lambda-errors-${EnvironmentSuffix}"
      AlarmDescription: "Replication Lambda errors"
      Namespace: AWS/Lambda
      MetricName: Errors
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReplicationLambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: missing

  # ---------------- CloudWatch Dashboard ----------------
  ProcessingDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Primary Queue Depth (${EnvironmentSuffix})",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/SQS","ApproximateNumberOfMessagesVisible","QueueName","${PrimaryFifoQueue.QueueName}"]
                ]
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Primary DLQ Depth (${EnvironmentSuffix})",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/SQS","ApproximateNumberOfMessagesVisible","QueueName","${PrimaryDlqQueue.QueueName}"]
                ]
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "Primary Processor Lambda",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/Lambda","Invocations","FunctionName","${PrimaryProcessorLambda}"],
                  [".","Errors",".","."],
                  [".","Throttles",".","."]
                ]
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "Replication Lambda",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/Lambda","Invocations","FunctionName","${ReplicationLambda}"],
                  [".","Errors",".","."],
                  [".","Throttles",".","."]
                ]
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 12, "width": 12, "height": 6,
              "properties": {
                "title": "DR Queue Depth (${EnvironmentSuffix})",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/SQS","ApproximateNumberOfMessagesVisible","QueueName","${DrFifoQueue.QueueName}"]
                ]
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 12, "width": 12, "height": 6,
              "properties": {
                "title": "DR DLQ Depth (${EnvironmentSuffix})",
                "view": "timeSeries",
                "stacked": false,
                "region": "${PrimaryRegion}",
                "metrics": [
                  ["AWS/SQS","ApproximateNumberOfMessagesVisible","QueueName","${DrDlqQueue.QueueName}"]
                ]
              }
            }
          ]
        }

  # ---------------- SNS + EventBridge (DLQ alarm notifications) ----------------
  DlqNotifierTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "dlq-notifier-${EnvironmentSuffix}"
      DisplayName: !Sub "DLQ Notifications - ${EnvironmentSuffix}"

  DlqNotifierTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics: [!GetAtt DlqNotifierTopic.TopicArn]
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AllowEventsToPublish
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sns:Publish
            Resource: !GetAtt DlqNotifierTopic.TopicArn

  DlqAlarmStateChangeRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "dlq-state-change-${EnvironmentSuffix}"
      EventPattern:
        source: ["aws.cloudwatch"]
        detail-type: ["CloudWatch Alarm State Change"]
        detail:
          alarmName: [!Sub "primary-dlq-depth-${EnvironmentSuffix}"]
      State: ENABLED
      Targets:
        - Id: !Sub "dlq-target-${EnvironmentSuffix}"
          Arn: !GetAtt DlqNotifierTopic.TopicArn

  # ---------------- SSM Parameters ----------------
  PrimaryQueueUrlParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/primary-queue-url"
      Type: String
      Value: !Ref PrimaryFifoQueue

  PrimaryQueueArnParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/primary-queue-arn"
      Type: String
      Value: !GetAtt PrimaryFifoQueue.Arn

  PrimaryDlqUrlParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/primary-dlq-url"
      Type: String
      Value: !Ref PrimaryDlqQueue

  PrimaryDlqArnParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/primary-dlq-arn"
      Type: String
      Value: !GetAtt PrimaryDlqQueue.Arn

  DrQueueUrlParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/dr-queue-url"
      Type: String
      Value: !Ref DrFifoQueue

  DrQueueArnParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/dr-queue-arn"
      Type: String
      Value: !GetAtt DrFifoQueue.Arn

  VisibilityTimeoutParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/visibility-timeout-seconds"
      Type: String
      Value: !Ref QueueVisibilityTimeoutSeconds

  TrustedRoleParameter:
    Condition: HasTrustedRole
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/async/${EnvironmentSuffix}/trusted-role-arn"
      Type: String
      Value: !Ref TrustedRoleArn

Outputs:
  PrimaryQueueUrl:
    Description: "Primary FIFO queue URL"
    Value: !Ref PrimaryFifoQueue
    Export:
      Name: !Sub "primary-queue-url-${EnvironmentSuffix}"

  PrimaryQueueArn:
    Description: "Primary FIFO queue ARN"
    Value: !GetAtt PrimaryFifoQueue.Arn
    Export:
      Name: !Sub "primary-queue-arn-${EnvironmentSuffix}"

  PrimaryDlqUrl:
    Description: "Primary DLQ FIFO queue URL"
    Value: !Ref PrimaryDlqQueue
    Export:
      Name: !Sub "primary-dlq-url-${EnvironmentSuffix}"

  PrimaryDlqArn:
    Description: "Primary DLQ FIFO queue ARN"
    Value: !GetAtt PrimaryDlqQueue.Arn
    Export:
      Name: !Sub "primary-dlq-arn-${EnvironmentSuffix}"

  DrQueueUrl:
    Description: "DR FIFO queue URL"
    Value: !Ref DrFifoQueue
    Export:
      Name: !Sub "dr-queue-url-${EnvironmentSuffix}"

  DrQueueArn:
    Description: "DR FIFO queue ARN"
    Value: !GetAtt DrFifoQueue.Arn
    Export:
      Name: !Sub "dr-queue-arn-${EnvironmentSuffix}"

  PrimaryProcessorLambdaArn:
    Description: "Primary processor Lambda ARN"
    Value: !GetAtt PrimaryProcessorLambda.Arn
    Export:
      Name: !Sub "primary-processor-lambda-arn-${EnvironmentSuffix}"

  ReplicationLambdaArn:
    Description: "Replication Lambda ARN"
    Value: !GetAtt ReplicationLambda.Arn
    Export:
      Name: !Sub "replication-lambda-arn-${EnvironmentSuffix}"

  MessageStateTableName:
    Description: "DynamoDB table for message state"
    Value: !Ref MessageStateTable
    Export:
      Name: !Sub "message-state-table-name-${EnvironmentSuffix}"

  ProcessingDashboardName:
    Description: "CloudWatch dashboard logical name"
    Value: !Ref ProcessingDashboard
```