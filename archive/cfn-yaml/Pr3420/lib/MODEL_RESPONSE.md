I'll create a comprehensive serverless event-driven inventory processing system using AWS CloudFormation. Here's the complete infrastructure code:

## Main Stack - TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Event-Driven Inventory Processing System'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'

Resources:
  # S3 Bucket for inventory uploads
  InventoryBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'inventory-uploads-${EnvironmentSuffix}-${AWS::AccountId}'
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
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: InventoryProcessing

  # DynamoDB Table for inventory data
  InventoryTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'InventoryData-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'itemId'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'itemId'
          KeyType: 'HASH'
        - AttributeName: 'timestamp'
          KeyType: 'RANGE'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Role for Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'InventoryLambdaRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: InventoryProcessingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt InventoryBucket.Arn
                  - !Sub '${InventoryBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:BatchWriteItem'
                Resource: !GetAtt InventoryTable.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'InventoryProcessing'
              - Effect: Allow
                Action:
                  - 'events:PutEvents'
                Resource: !Sub 'arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/default'

  # Lambda Function
  InventoryProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'InventoryProcessor-${EnvironmentSuffix}'
      Runtime: python3.10
      Handler: index.lambda_handler
      Timeout: 60
      MemorySize: 512
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref InventoryTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import time
          from datetime import datetime
          from decimal import Decimal

          s3 = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')
          eventbridge = boto3.client('events')

          table_name = os.environ['DYNAMODB_TABLE']
          environment = os.environ['ENVIRONMENT']
          table = dynamodb.Table(table_name)

          def lambda_handler(event, context):
              start_time = time.time()
              items_processed = 0
              errors = 0

              try:
                  # Process S3 event
                  for record in event.get('Records', [event]):
                      if 'detail' in record:  # EventBridge event
                          bucket = record['detail']['bucket']['name']
                          key = record['detail']['object']['key']
                      elif 's3' in record:  # Direct S3 event
                          bucket = record['s3']['bucket']['name']
                          key = record['s3']['object']['key']
                      else:
                          continue

                      if not key.endswith('.json'):
                          continue

                      try:
                          # Get object from S3
                          response = s3.get_object(Bucket=bucket, Key=key)
                          content = json.loads(response['Body'].read())

                          # Process inventory items
                          if isinstance(content, list):
                              items = content
                          else:
                              items = [content]

                          for item in items:
                              try:
                                  # Convert floats to Decimal for DynamoDB
                                  item_data = json.loads(json.dumps(item), parse_float=Decimal)
                                  item_data['timestamp'] = int(datetime.now().timestamp() * 1000)
                                  item_data['lastUpdated'] = datetime.now().isoformat()
                                  item_data['source'] = f's3://{bucket}/{key}'

                                  # Update DynamoDB
                                  table.put_item(Item=item_data)
                                  items_processed += 1
                              except Exception as e:
                                  print(f"Error processing item: {e}")
                                  errors += 1

                      except Exception as e:
                          print(f"Error processing file {key}: {e}")
                          errors += 1

                  # Send metrics to CloudWatch
                  processing_time = time.time() - start_time
                  send_metrics(items_processed, errors, processing_time)

                  # Send completion event to EventBridge
                  send_completion_event(items_processed, errors)

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'itemsProcessed': items_processed,
                          'errors': errors,
                          'processingTime': processing_time
                      })
                  }

              except Exception as e:
                  print(f"Fatal error: {e}")
                  send_metrics(0, 1, time.time() - start_time)
                  raise

          def send_metrics(items_processed, errors, processing_time):
              try:
                  cloudwatch.put_metric_data(
                      Namespace='InventoryProcessing',
                      MetricData=[
                          {
                              'MetricName': 'ItemsProcessed',
                              'Value': items_processed,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          },
                          {
                              'MetricName': 'ProcessingErrors',
                              'Value': errors,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          },
                          {
                              'MetricName': 'ProcessingDuration',
                              'Value': processing_time,
                              'Unit': 'Seconds',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment}
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  print(f"Error sending metrics: {e}")

          def send_completion_event(items_processed, errors):
              try:
                  eventbridge.put_events(
                      Entries=[
                          {
                              'Source': 'inventory.processor',
                              'DetailType': 'Inventory Processing Complete',
                              'Detail': json.dumps({
                                  'itemsProcessed': items_processed,
                                  'errors': errors,
                                  'timestamp': datetime.now().isoformat()
                              })
                          }
                      ]
                  )
              except Exception as e:
                  print(f"Error sending completion event: {e}")

  # EventBridge Rule for S3 uploads
  S3UploadEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'InventoryS3Upload-${EnvironmentSuffix}'
      Description: 'Trigger Lambda on S3 inventory uploads'
      EventPattern:
        source:
          - 'aws.s3'
        detail-type:
          - 'Object Created'
        detail:
          bucket:
            name:
              - !Ref InventoryBucket
      State: ENABLED
      Targets:
        - Arn: !GetAtt InventoryProcessorFunction.Arn
          Id: 'InventoryProcessorTarget'
          RetryPolicy:
            MaximumRetryAttempts: 2
            MaximumEventAge: 3600

  # Lambda permission for EventBridge
  LambdaEventBridgePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref InventoryProcessorFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'events.amazonaws.com'
      SourceArn: !GetAtt S3UploadEventRule.Arn

  # EventBridge Scheduler for reports
  ReportSchedulerRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: scheduler.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: InvokeLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource: !GetAtt InventoryProcessorFunction.Arn

  # CloudWatch Alarms
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'InventoryProcessor-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Lambda errors exceed threshold'
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref InventoryProcessorFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'InventoryProcessor-Duration-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Lambda duration is anomalous'
      MetricName: Duration
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref InventoryProcessorFunction
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30000
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'InventoryTable-Throttles-${EnvironmentSuffix}'
      AlarmDescription: 'Alert on DynamoDB throttling'
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Dimensions:
        - Name: TableName
          Value: !Ref InventoryTable
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  # EventBridge API Destination for webhooks
  WebhookConnection:
    Type: AWS::Events::Connection
    Properties:
      Name: !Sub 'InventoryWebhook-${EnvironmentSuffix}'
      AuthorizationType: API_KEY
      AuthParameters:
        ApiKeyAuthParameters:
          ApiKeyName: 'x-api-key'
          ApiKeyValue: 'placeholder-api-key'

  WebhookDestination:
    Type: AWS::Events::ApiDestination
    Properties:
      Name: !Sub 'InventoryWebhookDest-${EnvironmentSuffix}'
      ConnectionArn: !GetAtt WebhookConnection.Arn
      InvocationEndpoint: 'https://webhook.site/unique-endpoint'
      HttpMethod: POST
      InvocationRateLimitPerSecond: 10

  WebhookEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'InventoryComplete-${EnvironmentSuffix}'
      Description: 'Send webhook on inventory processing completion'
      EventPattern:
        source:
          - 'inventory.processor'
        detail-type:
          - 'Inventory Processing Complete'
      State: ENABLED
      Targets:
        - Arn: !GetAtt WebhookDestination.Arn
          Id: 'WebhookTarget'
          RoleArn: !GetAtt WebhookRole.Arn
          HttpParameters:
            HeaderParameters:
              X-Environment: !Ref EnvironmentSuffix

  WebhookRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: InvokeApiDestinationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'events:InvokeApiDestination'
                Resource: !GetAtt WebhookDestination.Arn

Outputs:
  BucketName:
    Description: 'S3 Bucket for inventory uploads'
    Value: !Ref InventoryBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  TableName:
    Description: 'DynamoDB table name'
    Value: !Ref InventoryTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'

  FunctionArn:
    Description: 'Lambda function ARN'
    Value: !GetAtt InventoryProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-FunctionArn'

  EventRuleArn:
    Description: 'EventBridge rule ARN'
    Value: !GetAtt S3UploadEventRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EventRuleArn'
```