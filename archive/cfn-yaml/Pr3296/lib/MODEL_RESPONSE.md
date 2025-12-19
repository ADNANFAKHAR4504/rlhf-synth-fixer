# Event-Driven Delivery App Infrastructure

Here's the complete CloudFormation template for your event-driven delivery app system:

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Event-driven delivery app infrastructure with S3, Lambda, EventBridge, DynamoDB, and CloudWatch

Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Environment name

Resources:
  # S3 Bucket for order uploads
  OrderUploadBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'delivery-app-orders-${Environment}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        EventBridgeConfiguration:
          EventBridgeEnabled: true

  # DynamoDB Table for processed orders
  ProcessedOrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'delivery-orders-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: processedTimestamp
          AttributeType: N
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: ProcessedTimestampIndex
          KeySchema:
            - AttributeName: processedTimestamp
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # IAM Role for Lambda function
  OrderProcessorLambdaRole:
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
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${OrderUploadBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt ProcessedOrdersTable.Arn
                  - !Sub '${ProcessedOrdersTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'

  # Lambda function for order processing
  OrderProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'order-processor-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 512
      Timeout: 60
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ProcessedOrdersTable
          ENVIRONMENT: !Ref Environment
          METRICS_NAMESPACE: DeliveryApp/OrderProcessing
      Role: !GetAtt OrderProcessorLambdaRole.Arn
      TracingConfig:
        Mode: Active
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import time
          from datetime import datetime
          from decimal import Decimal
          import logging
          from botocore.exceptions import ClientError

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          s3_client = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')

          table_name = os.environ['DYNAMODB_TABLE']
          metrics_namespace = os.environ['METRICS_NAMESPACE']
          environment = os.environ['ENVIRONMENT']

          def handler(event, context):
              start_time = time.time()
              processed_count = 0
              error_count = 0

              try:
                  # Parse CloudEvents format if present
                  if 'detail' in event and 'bucket' in event['detail']:
                      bucket_name = event['detail']['bucket']['name']
                      object_key = event['detail']['object']['key']
                  else:
                      # Fallback to standard EventBridge S3 event format
                      detail = event.get('detail', {})
                      bucket_name = detail.get('bucket', {}).get('name', '')
                      object_key = detail.get('object', {}).get('key', '')

                  if not bucket_name or not object_key:
                      logger.error('Missing bucket or object information in event')
                      raise ValueError('Invalid event structure')

                  logger.info(f'Processing file: s3://{bucket_name}/{object_key}')

                  # Read the file from S3
                  response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
                  file_content = response['Body'].read().decode('utf-8')

                  # Parse order data (assuming JSON format)
                  try:
                      orders = json.loads(file_content)
                      if not isinstance(orders, list):
                          orders = [orders]
                  except json.JSONDecodeError as e:
                      logger.error(f'Failed to parse JSON: {e}')
                      raise

                  # Process each order
                  table = dynamodb.Table(table_name)

                  for order in orders:
                      try:
                          # Validate required fields
                          if 'orderId' not in order:
                              logger.warning(f'Order missing orderId: {order}')
                              error_count += 1
                              continue

                          # Add processing metadata
                          order['processedTimestamp'] = int(datetime.now().timestamp())
                          order['processingDate'] = datetime.now().isoformat()
                          order['sourceFile'] = f's3://{bucket_name}/{object_key}'
                          order['environment'] = environment

                          # Convert float values to Decimal for DynamoDB
                          order = json.loads(json.dumps(order), parse_float=Decimal)

                          # Store in DynamoDB
                          table.put_item(Item=order)
                          processed_count += 1

                          logger.info(f'Successfully processed order: {order["orderId"]}')

                      except ClientError as e:
                          logger.error(f'DynamoDB error for order {order.get("orderId", "unknown")}: {e}')
                          error_count += 1
                      except Exception as e:
                          logger.error(f'Unexpected error processing order: {e}')
                          error_count += 1

                  # Calculate processing time
                  processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds

                  # Send metrics to CloudWatch
                  send_metrics(processed_count, error_count, processing_time)

                  # Return processing summary
                  result = {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Order processing completed',
                          'processedCount': processed_count,
                          'errorCount': error_count,
                          'processingTimeMs': processing_time,
                          'sourceFile': f's3://{bucket_name}/{object_key}'
                      })
                  }

                  logger.info(f'Processing complete: {result}')
                  return result

              except Exception as e:
                  logger.error(f'Fatal error in order processing: {e}')

                  # Send error metrics
                  send_error_metric()

                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e),
                          'message': 'Order processing failed'
                      })
                  }

          def send_metrics(processed_count, error_count, processing_time):
              try:
                  cloudwatch.put_metric_data(
                      Namespace=metrics_namespace,
                      MetricData=[
                          {
                              'MetricName': 'OrdersProcessed',
                              'Value': processed_count,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          },
                          {
                              'MetricName': 'OrderProcessingErrors',
                              'Value': error_count,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          },
                          {
                              'MetricName': 'ProcessingTime',
                              'Value': processing_time,
                              'Unit': 'Milliseconds',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          },
                          {
                              'MetricName': 'SuccessRate',
                              'Value': (processed_count / (processed_count + error_count)) * 100 if (processed_count + error_count) > 0 else 0,
                              'Unit': 'Percent',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f'Failed to send metrics: {e}')

          def send_error_metric():
              try:
                  cloudwatch.put_metric_data(
                      Namespace=metrics_namespace,
                      MetricData=[
                          {
                              'MetricName': 'ProcessingFailures',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f'Failed to send error metric: {e}')

  # EventBridge Rule for S3 uploads
  OrderUploadEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'order-upload-rule-${Environment}'
      Description: Trigger Lambda when new order files are uploaded to S3
      EventPattern:
        source:
          - aws.s3
        detail-type:
          - Object Created
        detail:
          bucket:
            name:
              - !Ref OrderUploadBucket
          object:
            key:
              - prefix: orders/
      State: ENABLED
      Targets:
        - Arn: !GetAtt OrderProcessorFunction.Arn
          Id: OrderProcessorTarget
          RetryPolicy:
            MaximumRetryAttempts: 2
            MaximumEventAge: 3600

  # Permission for EventBridge to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref OrderProcessorFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt OrderUploadEventRule.Arn

  # CloudWatch Dashboard
  OrderProcessingDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'delivery-app-orders-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["DeliveryApp/OrderProcessing", "OrdersProcessed", {"stat": "Sum", "label": "Orders Processed"}],
                  [".", "OrderProcessingErrors", {"stat": "Sum", "label": "Processing Errors"}],
                  [".", "ProcessingFailures", {"stat": "Sum", "label": "Processing Failures"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Order Processing Metrics",
                "view": "timeSeries",
                "stacked": false
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["DeliveryApp/OrderProcessing", "ProcessingTime", {"stat": "Average", "label": "Avg Processing Time (ms)"}],
                  [".", ".", {"stat": "Maximum", "label": "Max Processing Time (ms)"}],
                  [".", ".", {"stat": "Minimum", "label": "Min Processing Time (ms)"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Processing Performance",
                "view": "timeSeries"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["DeliveryApp/OrderProcessing", "SuccessRate", {"stat": "Average", "label": "Success Rate (%)"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Processing Success Rate",
                "view": "singleValue"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "dimensions": {"FunctionName": "${OrderProcessorFunction}"}}],
                  [".", "Errors", {"stat": "Sum", "dimensions": {"FunctionName": "${OrderProcessorFunction}"}}],
                  [".", "Duration", {"stat": "Average", "dimensions": {"FunctionName": "${OrderProcessorFunction}"}}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Function Metrics"
              }
            }
          ]
        }

  # CloudWatch Alarms
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'delivery-app-high-error-rate-${Environment}'
      AlarmDescription: Alert when order processing error rate is high
      MetricName: OrderProcessingErrors
      Namespace: DeliveryApp/OrderProcessing
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment

  ProcessingFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'delivery-app-processing-failures-${Environment}'
      AlarmDescription: Alert when Lambda function fails
      MetricName: ProcessingFailures
      Namespace: DeliveryApp/OrderProcessing
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment

Outputs:
  S3BucketName:
    Description: S3 bucket for order uploads
    Value: !Ref OrderUploadBucket
    Export:
      Name: !Sub '${AWS::StackName}-bucket'

  DynamoDBTableName:
    Description: DynamoDB table for processed orders
    Value: !Ref ProcessedOrdersTable
    Export:
      Name: !Sub '${AWS::StackName}-table'

  LambdaFunctionArn:
    Description: Order processor Lambda function ARN
    Value: !GetAtt OrderProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${OrderProcessingDashboard}'
```