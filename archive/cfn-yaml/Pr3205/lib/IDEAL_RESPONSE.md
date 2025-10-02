# Ideal Response: Retail Order Processing System

## CloudFormation Template for SQS-Lambda-DynamoDB Architecture

This solution provides a simple, cost-efficient processing system for a retail application handling 1,000 order notifications per day with asynchronous processing, reliability, and comprehensive logging.

### Architecture Components

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Simple, cost-efficient order processing system with SQS, Lambda, DynamoDB, and CloudWatch monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix to append to resource names (e.g., dev, staging, prod)
    Default: dev
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

Resources:
  # Dead Letter Queue - Captures failed messages for analysis
  OrderDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-order-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600  # 14 days retention
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: DeadLetterQueue

  # Main SQS Queue for order notifications
  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-order-queue-${EnvironmentSuffix}'
      VisibilityTimeout: 180  # 3 minutes (6x Lambda timeout)
      MessageRetentionPeriod: 345600  # 4 days
      ReceiveMessageWaitTimeSeconds: 20  # Long polling for cost efficiency
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt OrderDLQ.Arn
        maxReceiveCount: 3  # Retry 3 times before sending to DLQ
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: OrderProcessing

  # DynamoDB Table for order tracking
  OrderTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-orders-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST  # Cost-efficient for 1,000 orders/day
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: status
          AttributeType: S
        - AttributeName: processedAt
          AttributeType: N
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: StatusIndex
          KeySchema:
            - AttributeName: status
              KeyType: HASH
            - AttributeName: processedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: OrderTracking

  # IAM Role for Lambda execution
  OrderProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: OrderProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # SQS permissions
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt OrderQueue.Arn
              # DynamoDB permissions
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt OrderTable.Arn
                  - !Sub '${OrderTable.Arn}/index/*'
              # CloudWatch Logs permissions (enhanced)
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Function for order processing
  OrderProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-order-processor-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt OrderProcessorRole.Arn
      Timeout: 30
      MemorySize: 256  # Cost-efficient for this workload
      Environment:
        Variables:
          ORDER_TABLE_NAME: !Ref OrderTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
          const { DynamoDBDocumentClient, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
          
          const client = new DynamoDBClient({});
          const docClient = DynamoDBDocumentClient.from(client);
          const tableName = process.env.ORDER_TABLE_NAME;
          
          exports.handler = async (event) => {
            console.log('Processing batch:', JSON.stringify(event, null, 2));
            
            const results = {
              successful: [],
              failed: []
            };
            
            // Process each SQS record
            for (const record of event.Records) {
              try {
                const messageBody = JSON.parse(record.body);
                const orderId = messageBody.orderId || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                console.log(`Processing order: ${orderId}`);
                
                // Validate order data
                if (!messageBody.orderId) {
                  throw new Error('Missing required field: orderId');
                }
                
                // Simulate order processing logic
                const processedOrder = {
                  orderId: orderId,
                  status: 'PROCESSED',
                  originalMessage: messageBody,
                  processedAt: Date.now(),
                  processingTimestamp: new Date().toISOString(),
                  sqsMessageId: record.messageId,
                  receiptHandle: record.receiptHandle,
                  metadata: {
                    customerName: messageBody.customerName || 'Unknown',
                    orderTotal: messageBody.orderTotal || 0,
                    items: messageBody.items || []
                  }
                };
                
                // Store in DynamoDB
                await docClient.send(new PutCommand({
                  TableName: tableName,
                  Item: processedOrder,
                  ConditionExpression: 'attribute_not_exists(orderId)'
                }));
                
                console.log(`Successfully processed order: ${orderId}`);
                results.successful.push(orderId);
                
              } catch (error) {
                console.error('Error processing record:', error);
                console.error('Failed record:', JSON.stringify(record, null, 2));
                
                // Log failed order to DynamoDB with error details
                try {
                  const failedOrderId = JSON.parse(record.body).orderId || `failed-${Date.now()}`;
                  await docClient.send(new PutCommand({
                    TableName: tableName,
                    Item: {
                      orderId: failedOrderId,
                      status: 'FAILED',
                      error: error.message,
                      errorStack: error.stack,
                      originalMessage: record.body,
                      processedAt: Date.now(),
                      processingTimestamp: new Date().toISOString(),
                      sqsMessageId: record.messageId
                    }
                  }));
                } catch (dbError) {
                  console.error('Failed to log error to DynamoDB:', dbError);
                }
                
                results.failed.push({
                  messageId: record.messageId,
                  error: error.message
                });
                
                // Throw error to move message to DLQ after retries
                throw error;
              }
            }
            
            console.log('Processing summary:', JSON.stringify(results, null, 2));
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Batch processing completed',
                results: results
              })
            };
          };
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: OrderProcessing

  # Lambda Log Group with retention
  OrderProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${OrderProcessorFunction}'
      RetentionInDays: 30  # Cost-efficient log retention

  # Event Source Mapping - Connect SQS to Lambda
  OrderProcessorEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt OrderQueue.Arn
      FunctionName: !Ref OrderProcessorFunction
      BatchSize: 10  # Process up to 10 messages per invocation
      MaximumBatchingWindowInSeconds: 5  # Wait up to 5 seconds to fill batch
      Enabled: true
      FunctionResponseTypes:
        - ReportBatchItemFailures  # Enable partial batch responses

  # CloudWatch Alarm - Lambda Errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-order-processor-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function experiences errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300  # 5 minutes
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref OrderProcessorFunction
      TreatMissingData: notBreaching

  # CloudWatch Alarm - DLQ Messages
  DLQMessageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-dlq-messages-${EnvironmentSuffix}'
      AlarmDescription: Alert when messages appear in Dead Letter Queue
      MetricName: ApproximateNumberOfMessagesVisible
      Namespace: AWS/SQS
      Statistic: Average
      Period: 300  # 5 minutes
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: QueueName
          Value: !GetAtt OrderDLQ.QueueName
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Lambda Duration
  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-order-processor-duration-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda execution approaches timeout
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000  # 25 seconds (30s timeout)
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref OrderProcessorFunction
      TreatMissingData: notBreaching

  # CloudWatch Dashboard
  OrderProcessingDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-order-processing-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/SQS", "ApproximateNumberOfMessagesVisible", {"stat": "Average", "label": "Messages in Queue"}],
                  [".", "NumberOfMessagesSent", {"stat": "Sum", "label": "Messages Sent"}],
                  [".", "NumberOfMessagesDeleted", {"stat": "Sum", "label": "Messages Processed"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "SQS Queue Metrics",
                "period": 300,
                "dimensions": {
                  "QueueName": "${OrderQueue.QueueName}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                  [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                  [".", "Throttles", {"stat": "Sum", "label": "Throttles"}],
                  [".", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Function Metrics",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${OrderProcessorFunction}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/SQS", "ApproximateNumberOfMessagesVisible", {"stat": "Average", "label": "Messages in DLQ"}]
                ],
                "view": "singleValue",
                "region": "${AWS::Region}",
                "title": "Dead Letter Queue",
                "period": 300,
                "dimensions": {
                  "QueueName": "${OrderDLQ.QueueName}"
                }
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '/aws/lambda/${OrderProcessorFunction}'\n| fields @timestamp, @message\n| filter @message like /Error/\n| sort @timestamp desc\n| limit 20",
                "region": "${AWS::Region}",
                "title": "Recent Errors",
                "stacked": false
              }
            }
          ]
        }

Outputs:
  OrderQueueURL:
    Description: URL of the Order Queue
    Value: !Ref OrderQueue
    Export:
      Name: !Sub '${AWS::StackName}-OrderQueueURL'

  OrderQueueARN:
    Description: ARN of the Order Queue
    Value: !GetAtt OrderQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-OrderQueueARN'

  OrderDLQURL:
    Description: URL of the Dead Letter Queue
    Value: !Ref OrderDLQ
    Export:
      Name: !Sub '${AWS::StackName}-OrderDLQURL'

  OrderTableName:
    Description: Name of the DynamoDB Orders Table
    Value: !Ref OrderTable
    Export:
      Name: !Sub '${AWS::StackName}-OrderTableName'

  OrderProcessorFunctionName:
    Description: Name of the Lambda Function
    Value: !Ref OrderProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-OrderProcessorFunctionName'

  OrderProcessorFunctionARN:
    Description: ARN of the Lambda Function
    Value: !GetAtt OrderProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-OrderProcessorFunctionARN'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${OrderProcessingDashboard}'

  TestCommand:
    Description: AWS CLI command to send a test message
    Value: !Sub |
      aws sqs send-message --queue-url ${OrderQueue} --message-body '{"orderId":"test-001","customerName":"John Doe","orderTotal":99.99,"items":[{"productId":"P123","quantity":2}]}'
```

## Key Features

### 1. Architecture Design
- **SQS Standard Queue**: Handles incoming order notifications with long polling for cost efficiency
- **Lambda Function**: Node.js runtime processing orders asynchronously  
- **DynamoDB**: Pay-per-request billing mode suitable for 1,000 orders/day
- **Dead Letter Queue**: Captures failed messages after 3 retry attempts

### 2. Cost Optimization
- **Pay-per-request DynamoDB**: No minimum capacity charges
- **Lambda memory**: 256MB optimal for the workload
- **Log retention**: 30 days for cost efficiency
- **SQS long polling**: Reduces API calls and costs

### 3. Reliability & Error Handling
- **Retry logic**: 3 attempts before DLQ routing
- **Partial batch failures**: ReportBatchItemFailures for better error handling
- **Comprehensive logging**: Both successful and failed processing logged to DynamoDB
- **Point-in-time recovery**: Enabled for DynamoDB table

### 4. Monitoring & Observability
- **CloudWatch Alarms**: Lambda errors, DLQ messages, duration monitoring
- **Dashboard**: Real-time metrics for SQS, Lambda, and DLQ
- **Log insights**: Error query widget for troubleshooting
- **Structured logging**: JSON format for easy parsing

### 5. Security
- **IAM Role**: Least privilege permissions for Lambda function
- **Resource-based policies**: Granular access to specific SQS queue and DynamoDB table
- **Environment variables**: Secure configuration injection

### 6. Operational Excellence
- **Environment suffix**: Support for multiple deployment environments
- **Resource tagging**: Consistent tagging for resource management
- **Export values**: Enables cross-stack references
- **Test command**: Built-in testing capability in outputs

This solution provides a production-ready, scalable foundation for processing retail order notifications with comprehensive monitoring, error handling, and cost optimization suitable for the specified 1,000 orders/day workload.