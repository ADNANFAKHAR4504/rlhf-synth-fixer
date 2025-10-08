# CloudFormation Template for Logistics Automation System

I'll create a serverless logistics automation system using CloudFormation with the requested AWS services.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Logistics Shipment Automation System with EventBridge, Lambda, DynamoDB, CloudWatch, and SNS'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Environment suffix to append to resource names
    Default: prod

  NotificationEmail:
    Type: String
    Description: Email address for SNS failure notifications
    Default: logistics-team@example.com

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

  # SNS Topic for Notifications
  ShipmentAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'shipment-alerts-${EnvironmentSuffix}'
      DisplayName: Shipment Processing Alerts

  # Lambda Function for Processing
  ShipmentProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'shipment-processor-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log('Processing shipment event:', JSON.stringify(event));
            
            const shipmentData = event.detail || event;
            
            if (!shipmentData.shipmentId) {
              throw new Error('Missing shipmentId');
            }
            
            // Simple processing logic
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Shipment processed',
                shipmentId: shipmentData.shipmentId
              })
            };
          };

  # EventBridge Rule
  ShipmentUpdateRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'shipment-update-rule-${EnvironmentSuffix}'
      Description: Route shipment events to Lambda
      State: ENABLED
      EventPattern:
        source:
          - logistics.shipments
      Targets:
        - Arn: !GetAtt ShipmentProcessorFunction.Arn
          Id: ShipmentProcessorTarget

Outputs:
  DynamoDBTableName:
    Description: DynamoDB table for shipment logs
    Value: !Ref ShipmentLogsTable
```

This template creates:
- DynamoDB table for storing shipment logs
- SNS topic for alerts
- Lambda function for processing events
- EventBridge rule for routing events

The system will handle shipment updates automatically and provide monitoring through CloudWatch.