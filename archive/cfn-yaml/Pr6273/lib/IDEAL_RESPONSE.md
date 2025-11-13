# ideal_response.md

## Functional scope (build everything new)

* Build a brand-new, serverless transaction anomaly detection stack in **us-east-1** with no reliance on pre-existing resources.
* Core services: **API Gateway (REST)** for webhook ingestion, **AWS Lambda** for processing, **Amazon DynamoDB** for storage.
* Optional service: **Amazon SQS** as a buffer between ingestion and detection.
* Centralized logging with 30-day retention, alarms on error rate, and a dashboard for latency and capacity visibility.
* All resource names include **ENVIRONMENT_SUFFIX** to ensure multi-env isolation.

## Constraints & mandatory requirements

* **TapStack.yml** must be a single CloudFormation **YAML** file containing all parameters, defaults, logic, and outputs.
* **EnvironmentSuffix** is validated via a safe **regex** (no hard AllowedValues) and is embedded in every created resource name.
* **DynamoDB** uses **on-demand** billing; partition key `transactionId` (S) and sort key `timestamp` (N), with PITR and SSE enabled.
* **API Gateway** exposes a **POST /webhook** endpoint using Lambda proxy integration and stage-level **throttling** at **1000 RPS** and appropriate burst.
* All **Lambda** functions: **ARM64** architecture, **X-Ray tracing** enabled, **Reserved concurrency ≥ 100** per function, DLQs with **14-day** retention, and least-privilege IAM.
* **CloudWatch**: 30-day log retention, a dashboard (API latency p95, Lambda invocations/duration p95, DynamoDB consumed capacity), and **alarms when Lambda error rate > 1%** (robust math expressions).
* **SNS** topic with an email subscription for risk alerts.
* All resources tagged with **Environment**, **CostCenter**, and **Owner**.

## Implementation overview

* **Ingestion path**: API Gateway → Lambda (validate/parse) → write initial record to DynamoDB → publish original payload to SQS (optional buffer).
* **Detection path**: Lambda consumes SQS messages → rule-based anomaly check → writes results back to DynamoDB → emits alerts via SNS (future rule-based expansion).
* **Scheduled analysis**: EventBridge rule triggers a Lambda every 15 minutes for pattern analysis and enrichment.
* **Observability**: Explicit log groups with retention, alarms using safe `IF(invocations>0, ...)` expressions, and a dashboard for at-a-glance health.

## Security & compliance

* IAM roles scoped to **only** the required actions (e.g., `dynamodb:PutItem`, `sqs:SendMessage`, `sqs:ReceiveMessage/DeleteMessage`, `logs:*` via managed basic exec role).
* Explicit SQS QueuePolicies allowing Lambda service and EventBridge to send to DLQs (source-ARN constrained).
* API access logging enabled and stage-level metrics on API Gateway.
* Serverless-centric design aligning with the **AWS Well-Architected Framework** (Ops Excellence, Security, Reliability, Performance, Cost).

## Deliverable

* **TapStack.yml**: a complete, deployable CloudFormation YAML template that creates all modules end-to-end, with parameters, conditions (if any), resources, outputs, tags, throttling, alarms, log retention, DLQs, and X-Ray enabled.
* The template compiles cleanly with **cfn-lint** and deploys without additional manual steps.

## Validation & acceptance

* Deployment completes with API stage online, DynamoDB table active, SQS/DLQs created with 14-day retention, Lambdas reporting traces, and CloudWatch dashboard present.
* Posting a valid transaction to `/webhook` returns 200, stores the record in DynamoDB, enqueues to SQS, and the detection Lambda writes an anomaly flag back to DynamoDB.
* Error-rate alarms create and enter `OK` state initially; dashboard displays metrics within 5–10 minutes of activity.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Serverless transaction anomaly detection (brand-new stack).
  Core: API Gateway (REST), Lambda, DynamoDB. Optional: SQS buffer.
  Implements throttled POST webhook ingestion, validation/parsing, SQS buffering,
  SQS-driven anomaly detection, scheduled pattern analysis, SNS alerting,
  CloudWatch dashboards/alarms/logs, X-Ray tracing, DLQs (14 days), and least-privilege IAM.
  Region target: us-east-1.

Metadata:
  cfn-lint:
    config:
      regions: [us-east-1]

Parameters:
  ProjectName:
    Type: String
    Default: 'tapstack'
    Description: "Short, lower-case slug for the project (letters, numbers, hyphens)."
    AllowedPattern: '^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$'
    ConstraintDescription: 'Use lower-case letters, numbers, hyphens; 1-30 chars; cannot start/end with a hyphen.'
  EnvironmentSuffix:
    Type: String
    Default: 'prod-us'
    Description: "Environment suffix used in all names (e.g., prod-us, staging-us, qa, dev-eu1)."
    AllowedPattern: '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$'
    ConstraintDescription: '2-32 chars; lower-case letters, numbers, hyphens; cannot start/end with a hyphen.'
  Owner:
    Type: String
    Default: 'risk-eng'
    Description: 'Owner tag value.'
  CostCenter:
    Type: String
    Default: 'cc-1234'
    Description: 'Cost center tag value.'
  AlertEmail:
    Type: String
    Default: 'alerts@example.com'
    Description: 'Email address for SNS alerts subscription.'
  ApiThrottleRps:
    Type: Number
    Default: 1000
    MinValue: 50
    MaxValue: 5000
    Description: 'API Gateway steady-state requests per second limit (stage/method).'
  ApiThrottleBurst:
    Type: Number
    Default: 2000
    MinValue: 100
    MaxValue: 10000
    Description: 'API Gateway burst limit.'
  LambdaReservedConcurrency:
    Type: Number
    Default: 100
    MinValue: 1
    MaxValue: 1000
    Description: 'Reserved concurrent executions for each Lambda.'
  LambdaMemoryIngestion:
    Type: Number
    Default: 512
    AllowedValues: [128, 256, 512, 1024, 1536, 2048, 3072]
    Description: 'Memory size (MB) for ingestion Lambda.'
  LambdaTimeoutIngestion:
    Type: Number
    Default: 60
    MinValue: 1
    MaxValue: 900
    Description: 'Timeout (seconds) for ingestion Lambda.'
  SqsVisibilityTimeoutSeconds:
    Type: Number
    Default: 300
    MinValue: 30
    MaxValue: 43200
    Description: 'SQS visibility timeout for transaction queue (seconds).'

Mappings: {}

Resources:

  ########################################
  # DynamoDB — Transactions Table
  ########################################
  TransactionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${EnvironmentSuffix}-transactions'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # SQS — Primary Queue + DLQ
  ########################################
  TransactionsDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-txq-dlq'
      MessageRetentionPeriod: 1209600 # 14 days
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  TransactionsQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-txq'
      VisibilityTimeout: !Ref SqsVisibilityTimeoutSeconds
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt TransactionsDLQ.Arn
        maxReceiveCount: 5
      MessageRetentionPeriod: 1209600 # 14 days
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # SNS — Alerts Topic + Email Subscription
  ########################################
  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-alerts'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  AlertsSubscriptionEmail:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AlertsTopic
      Protocol: email
      Endpoint: !Ref AlertEmail

  ########################################
  # CloudWatch Log Groups (explicit, 30-day retention)
  ########################################
  IngestionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-ingestion'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DetectionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-detection'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ScheduledAnalysisLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-scheduled-analysis'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ApiAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${EnvironmentSuffix}-access'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # IAM Roles — Lambda Execution (least privilege + X-Ray)
  ########################################
  IngestionLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: LambdaTrust
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion-ddb-sqs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: DdbWrite
                Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DescribeTable
                Resource: !GetAtt TransactionsTable.Arn
              - Sid: SqsSendToMainQueue
                Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt TransactionsQueue.Arn
              - Sid: SqsSendToDLQ
                Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt IngestionLambdaDLQ.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DetectionLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-detection-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: LambdaTrust
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-detection-ddb-sqs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: SqsReceive
                Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                  - sqs:ChangeMessageVisibility
                Resource: !GetAtt TransactionsQueue.Arn
              - Sid: DdbWrite
                Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DescribeTable
                Resource: !GetAtt TransactionsTable.Arn
              - Sid: SqsSendToDLQ
                Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt DetectionLambdaDLQ.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ScheduledAnalysisLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-scheduled-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: LambdaTrust
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-scheduled-ddb-sqs'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: DdbReadWrite
                Effect: Allow
                Action:
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                  - dynamodb:PutItem
                  - dynamodb:DescribeTable
                Resource: !GetAtt TransactionsTable.Arn
              - Sid: SqsSendToDLQ
                Effect: Allow
                Action:
                  - sqs:SendMessage
                Resource: !GetAtt ScheduledAnalysisLambdaDLQ.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # SQS — Dedicated DLQs for Lambdas (14 days)
  ########################################
  IngestionLambdaDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion-dlq'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  DetectionLambdaDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-detection-dlq'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ScheduledAnalysisLambdaDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-scheduled-dlq'
      MessageRetentionPeriod: 1209600
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # SQS Queue Policies — allow Lambda service & EventBridge to send to DLQs
  ########################################
  IngestionDLQPolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref IngestionLambdaDLQ
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowLambdaServiceToSendIngestionDLQ
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sqs:SendMessage
            Resource: !GetAtt IngestionLambdaDLQ.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !GetAtt IngestionFunction.Arn

  DetectionDLQPolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref DetectionLambdaDLQ
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowLambdaServiceToSendDetectionDLQ
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sqs:SendMessage
            Resource: !GetAtt DetectionLambdaDLQ.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !GetAtt DetectionFunction.Arn

  ScheduledDLQPolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref ScheduledAnalysisLambdaDLQ
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowLambdaServiceToSendScheduledDLQ
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sqs:SendMessage
            Resource: !GetAtt ScheduledAnalysisLambdaDLQ.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !GetAtt ScheduledAnalysisFunction.Arn
          - Sid: AllowEventBridgeToSendScheduledDLQ
            Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: sqs:SendMessage
            Resource: !GetAtt ScheduledAnalysisLambdaDLQ.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !GetAtt ScheduledRuleQuarterHour.Arn

  ########################################
  # Lambda — Ingestion (API proxy)
  ########################################
  IngestionFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
      Architectures: [ arm64 ]
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt IngestionLambdaRole.Arn
      MemorySize: !Ref LambdaMemoryIngestion
      Timeout: !Ref LambdaTimeoutIngestion
      TracingConfig:
        Mode: Active
      ReservedConcurrentExecutions: !Ref LambdaReservedConcurrency
      Environment:
        Variables:
          TABLE_NAME: !Ref TransactionsTable
          TABLE_ARN: !GetAtt TransactionsTable.Arn
          TX_QUEUE_URL: !Ref TransactionsQueue
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
      DeadLetterConfig:
        TargetArn: !GetAtt IngestionLambdaDLQ.Arn
      Code:
        ZipFile: |
          import json, os, time, boto3
          ddb = boto3.client('dynamodb')
          sqs = boto3.client('sqs')
          TABLE_NAME = os.getenv('TABLE_NAME')
          TX_QUEUE_URL = os.getenv('TX_QUEUE_URL')
          def handler(event, context):
              try:
                  body = event.get('body') or '{}'
                  data = json.loads(body)
                  txn_id = data.get('transactionId')
                  ts = data.get('timestamp') or int(time.time()*1000)
                  if not txn_id:
                      return {"statusCode": 400, "body": json.dumps({"error":"transactionId required"})}
                  ddb.put_item(
                      TableName=TABLE_NAME,
                      Item={
                          'transactionId': {'S': str(txn_id)},
                          'timestamp': {'N': str(int(ts))},
                          'payload': {'S': json.dumps(data)}
                      }
                  )
                  sqs.send_message(QueueUrl=TX_QUEUE_URL, MessageBody=json.dumps(data))
                  return {"statusCode": 200, "body": json.dumps({"ok": True, "transactionId": txn_id})}
              except Exception as e:
                  raise
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner
    DependsOn:
      - IngestionLogGroup

  ########################################
  # Lambda — Detection (SQS consumer)
  ########################################
  DetectionFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-detection'
      Architectures: [ arm64 ]
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt DetectionLambdaRole.Arn
      MemorySize: 512
      Timeout: 60
      TracingConfig:
        Mode: Active
      ReservedConcurrentExecutions: !Ref LambdaReservedConcurrency
      Environment:
        Variables:
          TABLE_NAME: !Ref TransactionsTable
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
      DeadLetterConfig:
        TargetArn: !GetAtt DetectionLambdaDLQ.Arn
      Code:
        ZipFile: |
          import json, os, boto3
          ddb = boto3.client('dynamodb')
          TABLE_NAME = os.getenv('TABLE_NAME')
          def is_anomalous(txn):
              amount = float(txn.get('amount', 0))
              return amount > 10000.0 or (txn.get('country') and txn['country'] not in ['US','CA','GB'])
          def handler(event, context):
              for record in event.get('Records', []):
                  payload = json.loads(record['body'])
                  anomalous = is_anomalous(payload)
                  ddb.put_item(
                      TableName=TABLE_NAME,
                      Item={
                          'transactionId': {'S': str(payload.get('transactionId'))},
                          'timestamp': {'N': str(payload.get('timestamp', 0))},
                          'anomaly': {'S': 'yes' if anomalous else 'no'}
                      }
                  )
              return {"ok": True}
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner
    DependsOn:
      - DetectionLogGroup

  DetectionEventSource:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt TransactionsQueue.Arn
      FunctionName: !Ref DetectionFunction
      BatchSize: 10
      MaximumBatchingWindowInSeconds: 5
      Enabled: true

  ########################################
  # Lambda — Scheduled Pattern Analysis (every 15 min)
  ########################################
  ScheduledAnalysisFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-scheduled-analysis'
      Architectures: [ arm64 ]
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt ScheduledAnalysisLambdaRole.Arn
      MemorySize: 512
      Timeout: 120
      TracingConfig:
        Mode: Active
      ReservedConcurrentExecutions: !Ref LambdaReservedConcurrency
      Environment:
        Variables:
          TABLE_NAME: !Ref TransactionsTable
          PROJECT_NAME: !Ref ProjectName
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
      DeadLetterConfig:
        TargetArn: !GetAtt ScheduledAnalysisLambdaDLQ.Arn
      Code:
        ZipFile: |
          import os, time
          def handler(event, context):
              return {"ok": True, "ts": int(time.time())}
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner
    DependsOn:
      - ScheduledAnalysisLogGroup

  ScheduledRuleQuarterHour:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-quarter-hour'
      ScheduleExpression: 'cron(0/15 * * * ? *)'
      State: ENABLED
      Targets:
        - Id: ScheduledAnalysisTarget
          Arn: !GetAtt ScheduledAnalysisFunction.Arn
          DeadLetterConfig:
            Arn: !GetAtt ScheduledAnalysisLambdaDLQ.Arn

  PermissionEventsToScheduledAnalysis:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ScheduledAnalysisFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ScheduledRuleQuarterHour.Arn

  ########################################
  # API Gateway — REST API with POST /webhook (Lambda Proxy)
  ########################################
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      EndpointConfiguration:
        Types: [REGIONAL]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  RestApiWebhookResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: webhook

  IngestionInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref IngestionFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/*/POST/webhook'

  RestApiMethodPostWebhook:
    Type: AWS::ApiGateway::Method
    DependsOn:
      - IngestionInvokePermission  # ensure invoke permission exists before integration
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref RestApiWebhookResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Join
          - ''
          - - 'arn:aws:apigateway:'
            - !Ref AWS::Region
            - ':lambda:path/2015-03-31/functions/'
            - !GetAtt IngestionFunction.Arn
            - '/invocations'
      MethodResponses:
        - StatusCode: '200'

  RestApiDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref RestApi
      Description: !Sub 'Deployment for ${ProjectName}-${EnvironmentSuffix}'
    DependsOn:
      - RestApiMethodPostWebhook

  RestApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      StageName: !Ref EnvironmentSuffix
      DeploymentId: !Ref RestApiDeployment
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          ThrottlingBurstLimit: !Ref ApiThrottleBurst
          ThrottlingRateLimit: !Ref ApiThrottleRps
          MetricsEnabled: true
          DataTraceEnabled: false
          LoggingLevel: INFO
      AccessLogSetting:
        DestinationArn: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${ApiAccessLogGroup}'
        Format: |
          { "requestId":"$context.requestId","ip":"$context.identity.sourceIp","caller":"$context.identity.caller","user":"$context.identity.user","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength","integrationLatency":"$context.integrationLatency","requestLatency":"$context.requestLatency" }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref Owner

  ########################################
  # CloudWatch Dashboards & Alarms
  ########################################
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ProjectName}-${EnvironmentSuffix}-dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "width": 24,
              "height": 6,
              "properties": {
                "title": "API Latency (p95) — ${ProjectName}-${EnvironmentSuffix}",
                "metrics": [
                  [ "AWS/ApiGateway", "Latency", "ApiName", "${ProjectName}-${EnvironmentSuffix}-api", "Stage", "${EnvironmentSuffix}", { "stat": "p95" } ]
                ],
                "period": 60,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "width": 24,
              "height": 6,
              "properties": {
                "title": "Lambda Invocations & Duration — Ingestion / Detection",
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${ProjectName}-${EnvironmentSuffix}-ingestion" ],
                  [ ".", "Duration", ".", ".", { "stat": "p95" } ],
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${ProjectName}-${EnvironmentSuffix}-detection" ],
                  [ ".", "Duration", ".", ".", { "stat": "p95" } ]
                ],
                "period": 60,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "width": 24,
              "height": 6,
              "properties": {
                "title": "DynamoDB Consumed Capacity",
                "metrics": [
                  [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${ProjectName}-${EnvironmentSuffix}-transactions" ],
                  [ ".", "ConsumedWriteCapacityUnits", ".", "." ]
                ],
                "period": 60,
                "region": "${AWS::Region}",
                "view": "timeSeries"
              }
            }
          ]
        }

  # Alarm: Ingestion Lambda error rate > 1% (uses IF to avoid divide-by-zero)
  AlarmIngestionErrorRate:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion-error-rate'
      AlarmDescription: 'Triggers when ingestion Lambda error rate exceeds 1% over 5 minutes.'
      ComparisonOperator: GreaterThanThreshold
      Threshold: 1
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: notBreaching
      Metrics:
        - Id: e
          Label: 'ErrorRate%'
          Expression: 'IF(invocations>0,(errors/invocations)*100,0)'
          ReturnData: true
        - Id: errors
          MetricStat:
            Metric:
              Namespace: 'AWS/Lambda'
              MetricName: 'Errors'
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
            Period: 300
            Stat: Sum
          ReturnData: false
        - Id: invocations
          MetricStat:
            Metric:
              Namespace: 'AWS/Lambda'
              MetricName: 'Invocations'
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
            Period: 300
            Stat: Sum
          ReturnData: false
      AlarmActions:
        - !Ref AlertsTopic
      OKActions:
        - !Ref AlertsTopic

  # Alarm: Detection Lambda error rate > 1% (uses IF to avoid divide-by-zero)
  AlarmDetectionErrorRate:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-detection-error-rate'
      AlarmDescription: 'Triggers when detection Lambda error rate exceeds 1% over 5 minutes.'
      ComparisonOperator: GreaterThanThreshold
      Threshold: 1
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: notBreaching
      Metrics:
        - Id: e
          Label: 'ErrorRate%'
          Expression: 'IF(invocations>0,(errors/invocations)*100,0)'
          ReturnData: true
        - Id: errors
          MetricStat:
            Metric:
              Namespace: 'AWS/Lambda'
              MetricName: 'Errors'
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-detection'
            Period: 300
            Stat: Sum
          ReturnData: false
        - Id: invocations
          MetricStat:
            Metric:
              Namespace: 'AWS/Lambda'
              MetricName: 'Invocations'
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-detection'
            Period: 300
            Stat: Sum
          ReturnData: false
      AlarmActions:
        - !Ref AlertsTopic
      OKActions:
        - !Ref AlertsTopic

Outputs:
  ApiId:
    Description: REST API ID
    Value: !Ref RestApi
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api-id'

  ApiInvokeUrl:
    Description: Invoke URL for the API stage
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/webhook'
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api-url'

  ApiStageName:
    Description: API stage name
    Value: !Ref EnvironmentSuffix

  TransactionsTableName:
    Description: DynamoDB Transactions table name
    Value: !Ref TransactionsTable

  TransactionsTableArn:
    Description: DynamoDB Transactions table ARN
    Value: !GetAtt TransactionsTable.Arn

  TransactionsQueueUrl:
    Description: SQS Transactions queue URL
    Value: !Ref TransactionsQueue

  TransactionsQueueArn:
    Description: SQS Transactions queue ARN
    Value: !GetAtt TransactionsQueue.Arn

  AlertsTopicArn:
    Description: SNS Alerts topic ARN
    Value: !Ref AlertsTopic

  IngestionFunctionArn:
    Description: Ingestion Lambda ARN
    Value: !GetAtt IngestionFunction.Arn

  DetectionFunctionArn:
    Description: Detection Lambda ARN
    Value: !GetAtt DetectionFunction.Arn

  ScheduledAnalysisFunctionArn:
    Description: Scheduled Analysis Lambda ARN
    Value: !GetAtt ScheduledAnalysisFunction.Arn

  DashboardName:
    Description: CloudWatch Dashboard name
    Value: !Ref MonitoringDashboard

  IngestionAlarmName:
    Description: Ingestion Lambda error-rate alarm
    Value: !Ref AlarmIngestionErrorRate

  DetectionAlarmName:
    Description: Detection Lambda error-rate alarm
    Value: !Ref AlarmDetectionErrorRate
```