**ideal_response.md**

# Objective

Deliver a single, deployable CloudFormation YAML file (`TapStack.yml`) that provisions a brand-new, serverless transaction processing system in `us-east-1`. All resource names include the `EnvironmentSuffix` to ensure isolation across environments. The stack is self-contained and compliant with the stated functional, security, observability, and operational requirements.

# Functional scope (build everything new)

* Ingest merchant CSV files from an S3 bucket (prefix `uploads/`) and trigger a Python 3.11 Lambda to parse and validate transactions.
* Persist validated transactions in a DynamoDB table using on-demand billing with point-in-time recovery.
* Detect suspicious transactions via a DynamoDB Streams–driven Lambda and send alerts to an SNS topic subscribed to the compliance email.
* Provide an API Gateway REST interface with GET and POST endpoints to read transaction status, protected by an API key and usage plan.
* Capture failures in a dedicated SQS dead-letter queue with a three-receive redrive policy.
* Enforce least-privilege IAM for each Lambda. Enable X-Ray tracing and CloudWatch alarms for error rate monitoring. Retain logs for thirty days.
* Ensure the S3 bucket has versioning and a ninety-day lifecycle retention policy.

# What the template delivers

* S3 bucket with event notifications filtered to `uploads/*.csv`, versioning enabled, and a ninety-day lifecycle rule.
* Ingestion Lambda (Python 3.11, 512 MB, reserved concurrency 10) with deterministic name, explicit environment variables, DLQ configuration, and X-Ray enabled.
* DynamoDB `Transactions` table with partition key `transactionId`, sort key `timestamp`, on-demand billing, streams enabled (`NEW_IMAGE`), and point-in-time recovery.
* Fraud detection Lambda subscribed to the table’s stream that publishes alerts for `amount > 10000` to an SNS topic with the compliance email subscription.
* SQS dead-letter queue with appropriate permissions for all Lambda functions to publish failures.
* REST API on API Gateway (`/transactions`) supporting GET and POST, with an API key, usage plan (1,000 requests per day), regional endpoint, deployment, and stage named by `EnvironmentSuffix`.
* Three CloudWatch alarms using metric-math for error rate (`Errors/Invocations > 1%` over five minutes) for each Lambda, with missing data treated as not breaching.
* Explicit CloudWatch log groups for each Lambda with thirty-day retention.
* X-Ray tracing enabled on all Lambdas and API Gateway stage.
* Outputs: ingest bucket name, transactions table ARN, and API base URL.

# Key implementation choices

* Circular dependency avoidance for S3 notifications by granting Lambda invoke permission without referencing the bucket ARN and wiring notifications from the bucket to the function with an explicit dependency.
* Least-privilege IAM with scoped ARNs for S3 object prefix, DynamoDB table and stream, SNS topic, SQS DLQ, CloudWatch Logs, and X-Ray.
* Deterministic naming via `!Sub` using `ProjectName` and `EnvironmentSuffix` to satisfy the requirement that all resource names include the environment suffix.

# Validation criteria

* Template passes static analysis and deploys cleanly in `us-east-1`.
* S3 upload of a `.csv` into `uploads/` results in new validated items in DynamoDB.
* Stream events with `amount > 10000` trigger fraud alerts via SNS to the compliance email.
* DLQ receives failed Lambda deliveries after three attempts.
* API reads latest or specific transaction records.
* Alarms evaluate error ratio based on metric math with exactly one return-data element per alarm.
* Outputs provide bucket name, table ARN, and API base URL.

# Operations and observability

* Error-rate alarms use five-minute periods with evaluation period one and not-breaching missing data to avoid false positives during idle windows.
* Reserved concurrency set to ten for all Lambdas to enforce predictable scaling and protect downstream services.
* Log retention standardized to thirty days for cost control and compliance with operational guidelines.

# Deliverable

* A single `TapStack.yml` that embodies the above scope, implements all mandatory requirements, and includes only YAML with complete parameters, resources, and outputs.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack.yml — Serverless transaction processing system (us-east-1).
  Ingest CSVs from S3 -> Lambda -> DynamoDB; fraud detection via DynamoDB Streams -> Lambda -> SNS;
  REST API for transaction status; DLQ, alarms (error-rate >1%/5m), X-Ray, and 30-day log retention.

Metadata:
  cfn-lint:
    config:
      regions: [us-east-1]
  AlarmsRationale: |
    Error-rate alarms use metric math (Errors/Invocations) over a 5-minute period with TreatMissingData=notBreaching
    to avoid alerting on idle periods while catching spikes.

Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    Description: Lowercase project identifier used in resource names.
    AllowedPattern: '^[a-z0-9-]+$'
  EnvironmentSuffix:
    Type: String
    Default: prod
    Description: >
      Lowercase environment suffix used in all resource names
      (e.g., dev, qa, uat, stage, staging, prod, production, sandbox).
      Must be lowercase letters, digits, or dashes only.
    AllowedPattern: '^[a-z0-9-]{2,32}$'
    ConstraintDescription: 'Use lowercase letters, digits, or dashes only (no spaces).'
  AlertEmail:
    Type: String
    Default: compliance@company.com
    Description: Email address to subscribe for fraud alerts.
    AllowedPattern: '^[^@]+@[^@]+\.[^@]+$'

Resources:

  ############################################
  # S3: Ingest Bucket (versioning + lifecycle)
  ############################################
  IngestBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingest-bucket'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: !Sub 'retention-90-days-${EnvironmentSuffix}'
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 90
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
                  - Name: suffix
                    Value: .csv
            Function: !GetAtt IngestionLambda.Arn
    DependsOn:
      - IngestionLambdaInvokePermissionFromS3

  IngestBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref IngestBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt IngestBucket.Arn
              - !Sub '${IngestBucket.Arn}/*'
            Condition:
              Bool:
                aws:SecureTransport: false

  ############################################
  # DynamoDB: Transactions table + Streams
  ############################################
  TransactionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${EnvironmentSuffix}-transactions'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_IMAGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true

  ############################################
  # SQS: Dead Letter Queue
  ############################################
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-${EnvironmentSuffix}-dlq'
      MessageRetentionPeriod: 1209600 # 14 days

  ############################################
  # SNS: Fraud Alerts (email subscription)
  ############################################
  FraudAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud-alerts'

  FraudAlertsSubscriptionEmail:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref FraudAlertsTopic
      Protocol: email
      Endpoint: !Ref AlertEmail

  ############################################
  # IAM Roles (least privilege)
  ############################################
  IngestionLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingest-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingest-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ReadUploads
                Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                # Deterministic name to avoid Ref-based cycles
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-${EnvironmentSuffix}-ingest-bucket/uploads/*'
              - Sid: DynamoDBPut
                Effect: Allow
                Action: dynamodb:PutItem
                Resource: !GetAtt TransactionsTable.Arn
              - Sid: DlqSend
                Effect: Allow
                Action: sqs:SendMessage
                Resource: !GetAtt DeadLetterQueue.Arn
              - Sid: LogsWrite
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-${EnvironmentSuffix}-ingestion:*'
              - Sid: LogsCreateGroupIfMissing
                Effect: Allow
                Action: logs:CreateLogGroup
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  FraudLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: StreamsRead
                Effect: Allow
                Action:
                  - dynamodb:DescribeStream
                  - dynamodb:GetRecords
                  - dynamodb:GetShardIterator
                  - dynamodb:ListStreams
                Resource: !GetAtt TransactionsTable.StreamArn
              - Sid: PublishFraudAlerts
                Effect: Allow
                Action: sns:Publish
                Resource: !Ref FraudAlertsTopic
              - Sid: DlqSend
                Effect: Allow
                Action: sqs:SendMessage
                Resource: !GetAtt DeadLetterQueue.Arn
              - Sid: LogsWrite
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-${EnvironmentSuffix}-fraud:*'
              - Sid: LogsCreateGroupIfMissing
                Effect: Allow
                Action: logs:CreateLogGroup
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  ApiLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${EnvironmentSuffix}-api-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-api-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: DynamoDBQuery
                Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:Query
                Resource: !GetAtt TransactionsTable.Arn
              - Sid: LogsWrite
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-${EnvironmentSuffix}-api:*'
              - Sid: LogsCreateGroupIfMissing
                Effect: Allow
                Action: logs:CreateLogGroup
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  ############################################
  # Lambda Functions + Log Groups
  ############################################
  IngestionLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
      Description: Parse uploaded CSV files from S3 and write validated transactions to DynamoDB.
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt IngestionLambdaRole.Arn
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Timeout: 60
      TracingConfig:
        Mode: Active
      DeadLetterConfig:
        TargetArn: !GetAtt DeadLetterQueue.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref TransactionsTable
      Code:
        ZipFile: |
          import os, csv, json, boto3, urllib.parse
          from datetime import datetime
          ddb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')
          table = ddb.Table(os.environ['TABLE_NAME'])
          def handler(event, context):
              for rec in event.get('Records', []):
                  if rec.get('eventSource') == 'aws:s3':
                      b = rec['s3']['bucket']['name']
                      k = urllib.parse.unquote_plus(rec['s3']['object']['key'])
                      if not (k.startswith('uploads/') and k.endswith('.csv')):
                          continue
                      obj = s3.get_object(Bucket=b, Key=k)
                      body = obj['Body'].read().decode('utf-8').splitlines()
                      reader = csv.DictReader(body)
                      for row in reader:
                          txid = row.get('transactionId')
                          ts = row.get('timestamp') or datetime.utcnow().isoformat()
                          amount_str = row.get('amount', '0')
                          try:
                              amount = float(amount_str)
                          except Exception:
                              amount = 0.0
                          status = row.get('status', 'PENDING')
                          if not txid:
                              continue
                          item = {
                              'transactionId': str(txid),
                              'timestamp': str(ts),
                              'amount': amount,
                              'status': status,
                              'raw': json.dumps(row)
                          }
                          table.put_item(Item=item)
              return {'ok': True}

  IngestionLambdaInvokePermissionFromS3:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref IngestionLambda
      Principal: s3.amazonaws.com
      Action: lambda:InvokeFunction
      SourceAccount: !Ref AWS::AccountId
      # SourceArn intentionally omitted to avoid circular dependency with bucket; name-level IAM scoping used above.

  IngestionLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-ingestion'
      RetentionInDays: 30

  FraudDetectionLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud'
      Description: Detect suspicious transactions (amount > 10000) from DynamoDB Streams and publish to SNS.
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt FraudLambdaRole.Arn
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Timeout: 60
      TracingConfig:
        Mode: Active
      DeadLetterConfig:
        TargetArn: !GetAtt DeadLetterQueue.Arn
      Environment:
        Variables:
          ALERT_TOPIC_ARN: !Ref FraudAlertsTopic
      Code:
        ZipFile: |
          import os, json, boto3, decimal
          sns = boto3.client('sns')
          THRESHOLD = 10000.0
          def _to_float(v):
              try:
                  if isinstance(v, (int, float)): return float(v)
                  if isinstance(v, decimal.Decimal): return float(v)
                  return float(str(v))
              except Exception:
                  return 0.0
          def handler(event, context):
              for rec in event.get('Records', []):
                  if rec.get('eventSource') == 'aws:dynamodb' and rec.get('eventName') in ('INSERT','MODIFY'):
                      new = rec['dynamodb'].get('NewImage', {})
                      txid = new.get('transactionId', {}).get('S')
                      ts = new.get('timestamp', {}).get('S') or new.get('timestamp', {}).get('N')
                      amount_attr = new.get('amount')
                      amount = 0.0
                      if amount_attr:
                          amount = _to_float(amount_attr.get('N') or amount_attr.get('S'))
                      if amount > THRESHOLD:
                          msg = f'Suspicious transaction detected: id={txid}, ts={ts}, amount={amount}'
                          sns.publish(TopicArn=os.environ['ALERT_TOPIC_ARN'], Message=msg, Subject='Fraud Alert')
              return {'ok': True}

  FraudStreamMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      BatchSize: 100
      Enabled: true
      EventSourceArn: !GetAtt TransactionsTable.StreamArn
      FunctionName: !Ref FraudDetectionLambda
      StartingPosition: LATEST

  FraudDetectionLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-fraud'
      RetentionInDays: 30

  ############################################
  # API Gateway (REST) + Usage Plan + API Key
  ############################################
  ApiLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      Description: API handler to query transaction status by transactionId (GET query or POST body).
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt ApiLambdaRole.Arn
      MemorySize: 512
      ReservedConcurrentExecutions: 10
      Timeout: 30
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          TABLE_NAME: !Ref TransactionsTable
      Code:
        ZipFile: |
          import os, json, boto3
          ddb = boto3.client('dynamodb')
          TABLE = os.environ['TABLE_NAME']
          def _resp(status, body):
              return {
                  "statusCode": status,
                  "headers": {"Content-Type": "application/json"},
                  "body": json.dumps(body)
              }
          def handler(event, context):
              method = (event.get('httpMethod') or '').upper()
              txid = None
              if method == 'GET':
                  params = event.get('queryStringParameters') or {}
                  txid = params.get('transactionId')
                  ts = params.get('timestamp')
              else:
                  try:
                      body = json.loads(event.get('body') or '{}')
                  except Exception:
                      body = {}
                  txid = body.get('transactionId')
                  ts = body.get('timestamp')
              if not txid:
                  return _resp(400, {"error":"transactionId required"})
              if ts:
                  res = ddb.get_item(
                      TableName=TABLE,
                      Key={"transactionId": {"S": str(txid)}, "timestamp": {"S": str(ts)}}
                  )
                  return _resp(200, {"item": res.get('Item')})
              res = ddb.query(
                  TableName=TABLE,
                  KeyConditionExpression='transactionId = :t',
                  ExpressionAttributeValues={':t': {'S': str(txid)}},
                  ScanIndexForward=False,
                  Limit=1
              )
              items = res.get('Items', [])
              return _resp(200, {"item": items[0] if items else None})

  ApiLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-${EnvironmentSuffix}-api'
      RetentionInDays: 30

  ApiGatewayRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      EndpointConfiguration:
        Types: [REGIONAL]
      MinimumCompressionSize: 10240

  ApiGatewayResourceTransactions:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
      PathPart: transactions

  ApiGatewayMethodGetTransaction:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResourceTransactions
      HttpMethod: GET
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${FuncArn}/invocations
          - { Region: !Ref AWS::Region, FuncArn: !GetAtt ApiLambda.Arn }

  ApiGatewayMethodPostTransaction:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResourceTransactions
      HttpMethod: POST
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${FuncArn}/invocations
          - { Region: !Ref AWS::Region, FuncArn: !GetAtt ApiLambda.Arn }

  ApiLambdaInvokePermissionFromApi:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiLambda
      Principal: apigateway.amazonaws.com
      Action: lambda:InvokeFunction
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*/*'

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      Description: !Sub 'Deployment for ${ProjectName}-${EnvironmentSuffix}'
    DependsOn:
      - ApiGatewayMethodGetTransaction
      - ApiGatewayMethodPostTransaction

  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: !Sub '${EnvironmentSuffix}'
      RestApiId: !Ref ApiGatewayRestApi
      DeploymentId: !Ref ApiGatewayDeployment
      TracingEnabled: true

  ApiGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub '${ProjectName}-${EnvironmentSuffix}-plan'
      ApiStages:
        - ApiId: !Ref ApiGatewayRestApi
          Stage: !Ref ApiGatewayStage
      Quota:
        Limit: 1000
        Period: DAY
      Throttle:
        RateLimit: 10
        BurstLimit: 20

  ApiGatewayApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-key'
      Enabled: true
      StageKeys:
        - RestApiId: !Ref ApiGatewayRestApi
          StageName: !Ref ApiGatewayStage

  ApiGatewayUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiGatewayApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiGatewayUsagePlan

  ############################################
  # CloudWatch Alarms (Error rate > 1% over 5m)
  ############################################
  IngestionLambdaErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion-error-rate'
      ComparisonOperator: GreaterThanThreshold
      Threshold: 0.01
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: notBreaching
      Metrics:
        - Id: err
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Errors
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
            Period: 300
            Stat: Sum
        - Id: inv
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Invocations
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ingestion'
            Period: 300
            Stat: Sum
        - Id: rate
          Expression: 'IF(inv>0, err/inv, 0)'
          Label: 'ErrorRate'
          ReturnData: true

  FraudLambdaErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud-error-rate'
      ComparisonOperator: GreaterThanThreshold
      Threshold: 0.01
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: notBreaching
      Metrics:
        - Id: err
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Errors
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud'
            Period: 300
            Stat: Sum
        - Id: inv
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Invocations
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-fraud'
            Period: 300
            Stat: Sum
        - Id: rate
          Expression: 'IF(inv>0, err/inv, 0)'
          Label: 'ErrorRate'
          ReturnData: true

  ApiLambdaErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${EnvironmentSuffix}-api-error-rate'
      ComparisonOperator: GreaterThanThreshold
      Threshold: 0.01
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: notBreaching
      Metrics:
        - Id: err
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Errors
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
            Period: 300
            Stat: Sum
        - Id: inv
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/Lambda
              MetricName: Invocations
              Dimensions:
                - Name: FunctionName
                  Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
            Period: 300
            Stat: Sum
        - Id: rate
          Expression: 'IF(inv>0, err/inv, 0)'
          Label: 'ErrorRate'
          ReturnData: true

Outputs:
  IngestBucketName:
    Value: !Ref IngestBucket
    Description: S3 bucket name for CSV uploads (prefix uploads/).
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-IngestBucketName'

  TransactionsTableArn:
    Value: !GetAtt TransactionsTable.Arn
    Description: ARN of the DynamoDB transactions table.
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-TransactionsTableArn'

  ApiBaseUrl:
    Value: !Sub 'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/transactions'
    Description: Base URL for the REST API transactions resource (API key required).
    Export:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-ApiBaseUrl'
```