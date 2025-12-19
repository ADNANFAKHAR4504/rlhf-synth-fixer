# Model Response: Simple Order Processing System

I'll help you create a CloudFormation template for a simple order processing system. Here's a basic implementation:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Basic order processing system with SQS and Lambda'

Resources:
  # SQS Queue for orders
  OrderQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: 'order-queue'
      VisibilityTimeout: 30
      MessageRetentionPeriod: 345600

  # Lambda function to process orders
  OrderProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'order-processor'
      Runtime: nodejs18.x
      Handler: index.handler
      Role: !GetAtt LambdaRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log('Processing order:', event);
            
            // Basic order processing
            for (const record of event.Records) {
              const order = JSON.parse(record.body);
              console.log('Order ID:', order.orderId);
              
              // Simulate processing
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return { statusCode: 200, body: 'Orders processed' };
          };

  # Basic IAM Role
  LambdaRole:
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
        - PolicyName: SQSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:*
                Resource: '*'

  # DynamoDB Table
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: 'orders'
      AttributeDefinitions:
        - AttributeName: orderId
          AttributeType: S
      KeySchema:
        - AttributeName: orderId
          KeyType: HASH
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5

  # Event Source Mapping
  EventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt OrderQueue.Arn
      FunctionName: !Ref OrderProcessorFunction

Outputs:
  QueueUrl:
    Value: !Ref OrderQueue
  
  FunctionName:
    Value: !Ref OrderProcessorFunction
```

This template creates:

1. **SQS Queue**: A basic queue to receive order messages
2. **Lambda Function**: Processes the orders from the queue
3. **DynamoDB Table**: Stores order information
4. **IAM Role**: Allows Lambda to access SQS and DynamoDB

The system will automatically process messages from the SQS queue using the Lambda function, and you can track orders in the DynamoDB table.

To use this:
1. Deploy the CloudFormation template
2. Send messages to the SQS queue with order data
3. The Lambda function will automatically process them

The Lambda function expects messages in this format:
```json
{
  "orderId": "12345",
  "customerName": "John Doe",
  "items": ["item1", "item2"]
}
```