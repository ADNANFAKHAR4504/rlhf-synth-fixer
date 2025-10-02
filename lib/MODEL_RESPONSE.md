# Serverless Logistics Processing System with EventBridge - Model Response

## Initial Implementation

I'll create a comprehensive serverless logistics processing system using AWS CloudFormation that includes EventBridge, Lambda, DynamoDB, CloudWatch, and SNS for handling 1,500 shipment updates per day.

## Solution Architecture

The system will use the following AWS services:
- **Amazon EventBridge**: Event routing and processing
- **AWS Lambda**: Event processing with Python 3.10
- **Amazon DynamoDB**: Shipment log storage
- **Amazon CloudWatch**: Monitoring and metrics
- **Amazon SNS**: Alert notifications
- **IAM**: Secure access control

## CloudFormation Template Implementation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Logistics Processing System with EventBridge, Lambda, DynamoDB, CloudWatch, and SNS'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix to append to resource names (e.g., dev, staging, prod)
    Default: dev
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens
  
  AlertEmail:
    Type: String
    Default: test@test.com
    Description: Email address to receive alerts and notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid email address

Resources:
  # DynamoDB Table for Shipment Logs
  ShipmentLogsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'shipment-logs-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: shipmentId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: shipmentId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Application
          Value: LogisticsProcessing

  # SNS Topic for Alerts
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'logistics-alerts-${EnvironmentSuffix}'
      DisplayName: Logistics Processing Alerts
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # SNS Topic Subscription (Email)
  AlertTopicSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref AlertTopic
      Endpoint: !Ref AlertEmail

  # IAM Role for Lambda Function
  LambdaExecutionRole:
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
        - PolicyName: !Sub 'lambda-execution-policy-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource: !GetAtt ShipmentLogsTable.Arn
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref AlertTopic
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Processing Shipment Updates
  ShipmentProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'shipment-processor-${EnvironmentSuffix}'
      Runtime: python3.10
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ShipmentLogsTable
          SNS_TOPIC_ARN: !Ref AlertTopic
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          from decimal import Decimal
          
          dynamodb = boto3.resource('dynamodb')
          sns = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')
          
          table_name = os.environ['DYNAMODB_TABLE']
          sns_topic_arn = os.environ['SNS_TOPIC_ARN']
          environment = os.environ['ENVIRONMENT']
          
          table = dynamodb.Table(table_name)
          
          def lambda_handler(event, context):
              try:
                  print(f"Received event: {json.dumps(event)}")
                  
                  # Extract shipment data from event
                  detail = event.get('detail', {})
                  shipment_id = detail.get('shipmentId')
                  status = detail.get('status')
                  location = detail.get('location', 'Unknown')
                  carrier = detail.get('carrier', 'Unknown')
                  
                  if not shipment_id or not status:
                      raise ValueError("Missing required fields: shipmentId or status")
                  
                  # Prepare item for DynamoDB
                  timestamp = int(datetime.utcnow().timestamp() * 1000)
                  item = {
                      'shipmentId': shipment_id,
                      'timestamp': timestamp,
                      'status': status,
                      'location': location,
                      'carrier': carrier,
                      'eventTime': datetime.utcnow().isoformat(),
                      'rawEvent': json.dumps(detail)
                  }
                  
                  # Store in DynamoDB
                  table.put_item(Item=item)
                  
                  # Send custom metrics to CloudWatch
                  cloudwatch.put_metric_data(
                      Namespace='LogisticsProcessing',
                      MetricData=[
                          {
                              'MetricName': 'ShipmentUpdatesProcessed',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': environment
                                  },
                                  {
                                      'Name': 'Status',
                                      'Value': status
                                  }
                              ]
                          }
                      ]
                  )
                  
                  # Check for critical statuses and send alerts
                  critical_statuses = ['DELAYED', 'LOST', 'DAMAGED', 'EXCEPTION']
                  if status in critical_statuses:
                      message = f"""
                      ALERT: Critical Shipment Status Detected
                      
                      Shipment ID: {shipment_id}
                      Status: {status}
                      Location: {location}
                      Carrier: {carrier}
                      Time: {datetime.utcnow().isoformat()}
                      Environment: {environment}
                      """
                      
                      sns.publish(
                          TopicArn=sns_topic_arn,
                          Subject=f'Logistics Alert: {status} - {shipment_id}',
                          Message=message
                      )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Shipment update processed successfully',
                          'shipmentId': shipment_id,
                          'status': status
                      })
                  }
                  
              except Exception as e:
                  error_message = f"Error processing shipment update: {str(e)}"
                  print(error_message)
                  
                  # Send error alert
                  try:
                      sns.publish(
                          TopicArn=sns_topic_arn,
                          Subject=f'Logistics Processing Error - {environment}',
                          Message=f"""
                          Error processing shipment update
                          
                          Error: {str(e)}
                          Event: {json.dumps(event)}
                          Environment: {environment}
                          """
                      )
                  except Exception as sns_error:
                      print(f"Failed to send SNS alert: {str(sns_error)}")
                  
                  # Record error metric
                  cloudwatch.put_metric_data(
                      Namespace='LogisticsProcessing',
                      MetricData=[
                          {
                              'MetricName': 'ProcessingErrors',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': environment
                                  }
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'message': error_message
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/shipment-processor-${EnvironmentSuffix}'
      RetentionInDays: 14

  # EventBridge Rule for Shipment Updates
  ShipmentUpdateRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'shipment-update-rule-${EnvironmentSuffix}'
      Description: Routes shipment update events to Lambda processor
      State: ENABLED
      EventPattern:
        source:
          - logistics.shipments
        detail-type:
          - Shipment Update
      Targets:
        - Arn: !GetAtt ShipmentProcessorFunction.Arn
          Id: ShipmentProcessorTarget

  # Permission for EventBridge to Invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ShipmentProcessorFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ShipmentUpdateRule.Arn

  # CloudWatch Alarm for Lambda Errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'shipment-processor-errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function encounters errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ShipmentProcessorFunction
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Lambda Throttles
  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'shipment-processor-throttles-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function is throttled
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ShipmentProcessorFunction
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for High Lambda Duration
  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'shipment-processor-duration-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda execution duration is high
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ShipmentProcessorFunction
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Alarm for DynamoDB Throttles
  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'shipment-logs-throttles-${EnvironmentSuffix}'
      AlarmDescription: Alert when DynamoDB table is throttled
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref ShipmentLogsTable
      AlarmActions:
        - !Ref AlertTopic
      TreatMissingData: notBreaching

  # CloudWatch Dashboard
  LogisticsDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'logistics-processing-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Total Invocations"}],
                  [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                  [".", "Throttles", {"stat": "Sum", "label": "Throttles"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Performance",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${ShipmentProcessorFunction}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Avg Duration"}],
                  ["...", {"stat": "Maximum", "label": "Max Duration"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Duration (ms)",
                "period": 300,
                "dimensions": {
                  "FunctionName": "${ShipmentProcessorFunction}"
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["LogisticsProcessing", "ShipmentUpdatesProcessed", {"stat": "Sum"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Shipments Processed",
                "period": 300
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                  [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DynamoDB Capacity Usage",
                "period": 300,
                "dimensions": {
                  "TableName": "${ShipmentLogsTable}"
                }
              }
            }
          ]
        }

Outputs:
  EventBridgeRuleName:
    Description: Name of the EventBridge rule
    Value: !Ref ShipmentUpdateRule
    Export:
      Name: !Sub '${AWS::StackName}-EventBridgeRule'

  LambdaFunctionArn:
    Description: ARN of the Lambda function
    Value: !GetAtt ShipmentProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  DynamoDBTableName:
    Description: Name of the DynamoDB table
    Value: !Ref ShipmentLogsTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'

  SNSTopicArn:
    Description: ARN of the SNS alert topic
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'

  DashboardURL:
    Description: URL to the CloudWatch Dashboard
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=logistics-processing-${EnvironmentSuffix}'

  EventBridgeTestCommand:
    Description: AWS CLI command to test the system
    Value: |
      aws events put-events --entries '[{"Source":"logistics.shipments","DetailType":"Shipment Update","Detail":"{\"shipmentId\":\"SHIP-12345\",\"status\":\"IN_TRANSIT\",\"location\":\"Memphis, TN\",\"carrier\":\"FedEx\"}"}]'
```

## Key Features Implemented

1. **Comprehensive Event Processing**: EventBridge rule captures shipment update events and routes them to Lambda
2. **Robust Error Handling**: Multiple layers of error handling with SNS alerts and CloudWatch metrics
3. **Scalable Storage**: DynamoDB with composite key design for efficient querying
4. **Monitoring Dashboard**: CloudWatch dashboard with key performance indicators
5. **Alert System**: SNS notifications for critical statuses and system errors
6. **Security**: IAM roles with least-privilege permissions

## Testing

Use the provided AWS CLI command to test the system:
```bash
aws events put-events --entries '[{"Source":"logistics.shipments","DetailType":"Shipment Update","Detail":"{\"shipmentId\":\"SHIP-12345\",\"status\":\"IN_TRANSIT\",\"location\":\"Memphis, TN\",\"carrier\":\"FedEx\"}"}]'
```

This implementation provides a complete serverless logistics processing system that meets all the specified requirements with robust monitoring and alerting capabilities.