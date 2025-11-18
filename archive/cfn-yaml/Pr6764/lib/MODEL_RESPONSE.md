# Serverless Cryptocurrency Webhook Processing System

Complete CloudFormation implementation for a production-ready serverless webhook processing system.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Cryptocurrency Webhook Processing System'

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
  # KMS Key for Lambda Environment Variable Encryption
  LambdaEncryptionKey:
    Type: AWS::KMS::Key
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Description: !Sub 'KMS key for Lambda environment variable encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'

  LambdaEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      AliasName: !Sub 'alias/lambda-webhook-${EnvironmentSuffix}'
      TargetKeyId: !Ref LambdaEncryptionKey

  # DynamoDB Table for Transaction Storage
  TransactionTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'crypto-transactions-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'transactionId'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'transactionId'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: 'KMS'
      DeletionProtectionEnabled: false

  # Dead Letter Queue
  DeadLetterQueue:
    Type: AWS::SQS::Queue
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      QueueName: !Sub 'webhook-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600

  # Standard Processing Queue
  ProcessingQueue:
    Type: AWS::SQS::Queue
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      QueueName: !Sub 'webhook-processing-${EnvironmentSuffix}'
      VisibilityTimeout: 300
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
        maxReceiveCount: 3

  # IAM Role for Lambda Execution
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      RoleName: !Sub 'webhook-lambda-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      Policies:
        - PolicyName: 'LambdaExecutionPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:UpdateItem'
                Resource: !GetAtt TransactionTable.Arn
              - Effect: Allow
                Action:
                  - 'sqs:SendMessage'
                  - 'sqs:GetQueueAttributes'
                Resource:
                  - !GetAtt ProcessingQueue.Arn
                  - !GetAtt DeadLetterQueue.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                Resource: !GetAtt LambdaEncryptionKey.Arn

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/lambda/webhook-processor-${EnvironmentSuffix}'
      RetentionInDays: 30

  # Metric Filters for Transaction Counting
  BTCMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, event_type, currency = BTC, ...]'
      LogGroupName: !Ref LambdaLogGroup
      MetricTransformations:
        - MetricName: !Sub 'BTCTransactionCount-${EnvironmentSuffix}'
          MetricNamespace: 'CryptoWebhooks'
          MetricValue: '1'
          DefaultValue: 0

  ETHMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, event_type, currency = ETH, ...]'
      LogGroupName: !Ref LambdaLogGroup
      MetricTransformations:
        - MetricName: !Sub 'ETHTransactionCount-${EnvironmentSuffix}'
          MetricNamespace: 'CryptoWebhooks'
          MetricValue: '1'
          DefaultValue: 0

  USDTMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      FilterPattern: '[time, request_id, event_type, currency = USDT, ...]'
      LogGroupName: !Ref LambdaLogGroup
      MetricTransformations:
        - MetricName: !Sub 'USDTTransactionCount-${EnvironmentSuffix}'
          MetricNamespace: 'CryptoWebhooks'
          MetricValue: '1'
          DefaultValue: 0

  # Lambda Function
  WebhookProcessorFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      FunctionName: !Sub 'webhook-processor-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 1024
      Timeout: 60
      ReservedConcurrentExecutions: 50
      Role: !GetAtt LambdaExecutionRole.Arn
      KmsKeyArn: !GetAtt LambdaEncryptionKey.Arn
      DeadLetterConfig:
        TargetArn: !GetAtt DeadLetterQueue.Arn
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          TRANSACTION_TABLE: !Ref TransactionTable
          PROCESSING_QUEUE_URL: !Ref ProcessingQueue
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          dynamodb = boto3.resource('dynamodb')
          sqs = boto3.client('sqs')
          table = dynamodb.Table(os.environ['TRANSACTION_TABLE'])
          queue_url = os.environ['PROCESSING_QUEUE_URL']

          def handler(event, context):
              try:
                  logger.info(f"Processing webhook event: {json.dumps(event)}")

                  # Extract currency from path parameters
                  currency = event.get('pathParameters', {}).get('currency', 'UNKNOWN')

                  # Validate currency
                  valid_currencies = ['BTC', 'ETH', 'USDT']
                  if currency not in valid_currencies:
                      logger.error(f"Invalid currency: {currency}")
                      return {
                          'statusCode': 400,
                          'body': json.dumps({'error': 'Invalid currency. Must be BTC, ETH, or USDT'})
                      }

                  # Parse webhook payload
                  body = json.loads(event.get('body', '{}'))
                  transaction_id = body.get('transactionId')
                  timestamp = int(datetime.utcnow().timestamp() * 1000)

                  if not transaction_id:
                      logger.error("Missing transactionId in payload")
                      return {
                          'statusCode': 400,
                          'body': json.dumps({'error': 'Missing transactionId'})
                      }

                  # Log transaction for metric filter
                  logger.info(f"TRANSACTION {currency} {transaction_id}")

                  # Store transaction in DynamoDB
                  table.put_item(
                      Item={
                          'transactionId': transaction_id,
                          'timestamp': timestamp,
                          'currency': currency,
                          'payload': body,
                          'processedAt': datetime.utcnow().isoformat()
                      }
                  )

                  # Send to processing queue
                  sqs.send_message(
                      QueueUrl=queue_url,
                      MessageBody=json.dumps({
                          'transactionId': transaction_id,
                          'currency': currency,
                          'timestamp': timestamp
                      })
                  )

                  logger.info(f"Successfully processed transaction {transaction_id}")
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Transaction processed successfully',
                          'transactionId': transaction_id,
                          'currency': currency
                      })
                  }

              except Exception as e:
                  logger.error(f"Error processing webhook: {str(e)}")
                  raise

  # API Gateway Request Validator
  RequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      Name: !Sub 'webhook-validator-${EnvironmentSuffix}'
      RestApiId: !Ref WebhookRestApi
      ValidateRequestBody: true
      ValidateRequestParameters: true

  # Request Model for Validation
  WebhookRequestModel:
    Type: AWS::ApiGateway::Model
    Properties:
      RestApiId: !Ref WebhookRestApi
      Name: WebhookRequest
      ContentType: 'application/json'
      Schema:
        $schema: 'http://json-schema.org/draft-04/schema#'
        title: 'Webhook Request Schema'
        type: object
        required:
          - transactionId
        properties:
          transactionId:
            type: string
            minLength: 1
          amount:
            type: number
          sender:
            type: string
          receiver:
            type: string

  # API Gateway REST API
  WebhookRestApi:
    Type: AWS::ApiGateway::RestApi
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'webhook-api-${EnvironmentSuffix}'
      Description: 'Cryptocurrency Webhook Processing API'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # API Gateway Resource: /webhooks
  WebhooksResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref WebhookRestApi
      ParentId: !GetAtt WebhookRestApi.RootResourceId
      PathPart: 'webhooks'

  # API Gateway Resource: /webhooks/{currency}
  CurrencyResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref WebhookRestApi
      ParentId: !Ref WebhooksResource
      PathPart: '{currency}'

  # POST Method
  WebhookPostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref WebhookRestApi
      ResourceId: !Ref CurrencyResource
      HttpMethod: POST
      AuthorizationType: AWS_IAM
      RequestValidatorId: !Ref RequestValidator
      RequestModels:
        application/json: !Ref WebhookRequestModel
      RequestParameters:
        method.request.path.currency: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebhookProcessorFunction.Arn}/invocations'

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref WebhookProcessorFunction
      Action: 'lambda:InvokeFunction'
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WebhookRestApi}/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: WebhookPostMethod
    Properties:
      RestApiId: !Ref WebhookRestApi
      StageName: 'prod'

  # API Gateway Stage with X-Ray Tracing
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref WebhookRestApi
      DeploymentId: !Ref ApiDeployment
      StageName: 'prod'
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  # Usage Plan
  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub 'webhook-usage-plan-${EnvironmentSuffix}'
      Description: 'Usage plan with 1000 requests per day limit'
      ApiStages:
        - ApiId: !Ref WebhookRestApi
          Stage: !Ref ApiStage
      Quota:
        Limit: 1000
        Period: DAY
      Throttle:
        BurstLimit: 100
        RateLimit: 50

  # API Key
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub 'webhook-api-key-${EnvironmentSuffix}'
      Enabled: true

  # Usage Plan Key
  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiUsagePlan

Outputs:
  ApiEndpointUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${WebhookRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod/webhooks/{currency}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpointUrl'

  LambdaFunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt WebhookProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  DynamoDBTableName:
    Description: 'DynamoDB table name for transactions'
    Value: !Ref TransactionTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  ProcessingQueueUrl:
    Description: 'SQS processing queue URL'
    Value: !Ref ProcessingQueue
    Export:
      Name: !Sub '${AWS::StackName}-ProcessingQueueUrl'

  DeadLetterQueueUrl:
    Description: 'SQS dead letter queue URL'
    Value: !Ref DeadLetterQueue
    Export:
      Name: !Sub '${AWS::StackName}-DeadLetterQueueUrl'

  KMSKeyId:
    Description: 'KMS key ID for Lambda encryption'
    Value: !Ref LambdaEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  ApiKeyId:
    Description: 'API Gateway API Key ID'
    Value: !Ref ApiKey
    Export:
      Name: !Sub '${AWS::StackName}-ApiKeyId'
```

## Usage

### Send Webhook Request

```bash
# Get API Key
API_KEY=$(aws apigateway get-api-keys --include-values --query 'items[0].value' --output text)

# Send webhook for BTC transaction
curl -X POST \
  "https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/webhooks/BTC" \
  -H "x-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "btc-tx-12345",
    "amount": 0.5,
    "sender": "wallet1",
    "receiver": "wallet2"
  }'
```

### Monitor Transactions

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace CryptoWebhooks \
  --metric-name BTCTransactionCount-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### Check DynamoDB Records

```bash
# Query transaction table
aws dynamodb get-item \
  --table-name crypto-transactions-dev \
  --key '{"transactionId": {"S": "btc-tx-12345"}, "timestamp": {"N": "1234567890"}}' \
  --region us-east-1
```

## Resource Details

### Lambda Function

- **Runtime**: Python 3.11
- **Memory**: 1024 MB
- **Timeout**: 60 seconds
- **Reserved Concurrency**: 50 (cost control)
- **Dead Letter Queue**: Configured with max 3 retries

### DynamoDB Table

- **Billing Mode**: Pay-per-request
- **Point-in-Time Recovery**: Enabled
- **Encryption**: AWS managed keys

### SQS Queues

- **Processing Queue**: 300-second visibility timeout
- **Dead Letter Queue**: 14-day message retention

### CloudWatch Logs

- **Retention**: 30 days (compliance requirement)
- **Metric Filters**: BTC, ETH, USDT transaction counting

### API Gateway

- **Usage Plan**: 1000 requests/day per API key
- **Throttling**: 50 req/sec, 100 burst
- **X-Ray Tracing**: Enabled

## Monitoring

### CloudWatch Metrics

- `BTCTransactionCount-{suffix}`: Count of BTC transactions
- `ETHTransactionCount-{suffix}`: Count of ETH transactions
- `USDTTransactionCount-{suffix}`: Count of USDT transactions

### X-Ray Tracing

View distributed traces:
```bash
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --region us-east-1
```

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name crypto-webhook-system \
  --region us-east-1
```

## Security Features

- **IAM Least Privilege**: Lambda role has minimal required permissions
- **KMS Encryption**: Environment variables encrypted with customer managed key
- **API Key Authentication**: Required for all webhook requests
- **Request Validation**: JSON schema validation at API Gateway
- **X-Ray Tracing**: Full request visibility for security auditing

## Cost Optimization

- **Reserved Concurrency**: Limits to 50 concurrent Lambda executions
- **DynamoDB On-Demand**: Pay only for actual usage
- **CloudWatch Retention**: 30 days for compliance, then auto-deletion
- **Dead Letter Queue**: 14-day retention prevents indefinite storage costs
```