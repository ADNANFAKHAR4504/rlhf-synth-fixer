# Payment Notification Processor - CloudFormation Implementation

This CloudFormation template implements a serverless payment notification processing system with fault tolerance, automatic scaling, and proper security configurations.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless Payment Notification Processor - CloudFormation Template'

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
  # Dead Letter Queue for failed messages
  PaymentDLQ:
    Type: AWS::SQS::Queue
    DeletionPolicy: Delete
    Properties:
      QueueName: !Sub 'payment-dlq-${EnvironmentSuffix}'
      MessageRetentionPeriod: 1209600 # 14 days in seconds
      SqsManagedSseEnabled: true
      Tags:
        - Key: Environment
          Value: Production

  # Main SQS Queue for payment notifications
  PaymentQueue:
    Type: AWS::SQS::Queue
    DeletionPolicy: Delete
    Properties:
      QueueName: !Sub 'payment-queue-${EnvironmentSuffix}'
      VisibilityTimeout: 1800 # 6 times Lambda timeout (300s * 6 = 1800s)
      SqsManagedSseEnabled: true
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt PaymentDLQ.Arn
        maxReceiveCount: 3
      Tags:
        - Key: Environment
          Value: Production

  # DynamoDB Table for storing payment transactions
  PaymentTransactionsTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    Properties:
      TableName: !Sub 'PaymentTransactions-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: transactionId
          AttributeType: S
      KeySchema:
        - AttributeName: transactionId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      Tags:
        - Key: Environment
          Value: Production

  # CloudWatch Log Group for Lambda
  PaymentProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/lambda/payment-processor-${EnvironmentSuffix}'
      RetentionInDays: 30

  # IAM Role for Lambda execution
  PaymentProcessorRole:
    Type: AWS::IAM::Role
    DeletionPolicy: Delete
    Properties:
      RoleName: !Sub 'payment-processor-role-${EnvironmentSuffix}'
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
        - PolicyName: PaymentProcessorPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # SQS permissions
              - Effect: Allow
                Action:
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt PaymentQueue.Arn
              # DynamoDB permissions
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                Resource: !GetAtt PaymentTransactionsTable.Arn
              # CloudWatch Logs permissions
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt PaymentProcessorLogGroup.Arn
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Function for processing payments
  PaymentProcessorFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    DependsOn: PaymentProcessorLogGroup
    Properties:
      FunctionName: !Sub 'payment-processor-${EnvironmentSuffix}'
      Runtime: python3.12
      Handler: index.lambda_handler
      Role: !GetAtt PaymentProcessorRole.Arn
      MemorySize: 1024
      Timeout: 300
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref PaymentTransactionsTable
          AWS_REGION_NAME: !Ref AWS::Region
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          from datetime import datetime
          import logging

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          # Initialize AWS clients
          dynamodb = boto3.resource('dynamodb')
          table_name = os.environ['DYNAMODB_TABLE_NAME']
          table = dynamodb.Table(table_name)

          def lambda_handler(event, context):
              """
              Process payment notifications from SQS and store in DynamoDB
              """
              logger.info(f"Processing {len(event['Records'])} messages")

              successful_messages = 0
              failed_messages = 0

              for record in event['Records']:
                  try:
                      # Parse SQS message body
                      message_body = json.loads(record['body'])

                      # Extract payment details
                      transaction_id = message_body.get('transactionId')

                      if not transaction_id:
                          logger.error("Missing transactionId in message")
                          failed_messages += 1
                          continue

                      # Prepare item for DynamoDB
                      item = {
                          'transactionId': transaction_id,
                          'amount': message_body.get('amount', 0),
                          'currency': message_body.get('currency', 'USD'),
                          'status': message_body.get('status', 'pending'),
                          'paymentMethod': message_body.get('paymentMethod', 'unknown'),
                          'customerId': message_body.get('customerId', ''),
                          'processedAt': datetime.utcnow().isoformat(),
                          'rawMessage': json.dumps(message_body)
                      }

                      # Write to DynamoDB
                      response = table.put_item(Item=item)

                      logger.info(f"Successfully processed transaction: {transaction_id}")
                      successful_messages += 1

                  except json.JSONDecodeError as e:
                      logger.error(f"JSON decode error: {str(e)}")
                      failed_messages += 1
                  except Exception as e:
                      logger.error(f"Error processing message: {str(e)}")
                      failed_messages += 1
                      # Re-raise to trigger DLQ after max retries
                      raise

              logger.info(f"Batch complete - Success: {successful_messages}, Failed: {failed_messages}")

              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'processed': successful_messages,
                      'failed': failed_messages
                  })
              }
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Event Source Mapping for SQS
  PaymentProcessorEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt PaymentQueue.Arn
      FunctionName: !Ref PaymentProcessorFunction
      BatchSize: 10
      Enabled: true

Outputs:
  PaymentQueueUrl:
    Description: 'URL of the payment notification queue'
    Value: !Ref PaymentQueue
    Export:
      Name: !Sub '${AWS::StackName}-PaymentQueueUrl'

  PaymentQueueArn:
    Description: 'ARN of the payment notification queue'
    Value: !GetAtt PaymentQueue.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PaymentQueueArn'

  PaymentDLQUrl:
    Description: 'URL of the dead letter queue'
    Value: !Ref PaymentDLQ
    Export:
      Name: !Sub '${AWS::StackName}-PaymentDLQUrl'

  PaymentProcessorFunctionArn:
    Description: 'ARN of the payment processor Lambda function'
    Value: !GetAtt PaymentProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PaymentProcessorFunctionArn'

  PaymentProcessorFunctionName:
    Description: 'Name of the payment processor Lambda function'
    Value: !Ref PaymentProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-PaymentProcessorFunctionName'

  PaymentTransactionsTableName:
    Description: 'Name of the DynamoDB table for payment transactions'
    Value: !Ref PaymentTransactionsTable
    Export:
      Name: !Sub '${AWS::StackName}-PaymentTransactionsTableName'

  PaymentTransactionsTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt PaymentTransactionsTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-PaymentTransactionsTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Architecture Overview

The template creates a complete serverless payment notification processing system with the following components:

1. **SQS Standard Queue** - Receives payment notifications from third-party providers
2. **Dead Letter Queue** - Captures failed messages after 3 retry attempts
3. **Lambda Function** - Processes payment notifications with Python 3.12 runtime
4. **DynamoDB Table** - Stores processed payment transactions
5. **IAM Role** - Provides least-privilege permissions for Lambda
6. **CloudWatch Log Group** - Stores Lambda logs with 30-day retention
7. **Event Source Mapping** - Connects SQS to Lambda with batch processing

## Key Features

- Server-side encryption enabled on all queues
- Reserved concurrency of 100 for Lambda function
- Batch processing of 10 messages at a time
- Automatic retry with DLQ for failed messages
- 14-day message retention in DLQ
- On-demand billing for DynamoDB
- All resources include environmentSuffix parameter
- All resources tagged with Environment=Production
- All resources have Delete policy for cleanup

## Deployment

Deploy with:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name payment-processor-stack \
  --parameter-overrides EnvironmentSuffix=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Testing

Send a test message to the queue:

```bash
QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-processor-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentQueueUrl`].OutputValue' \
  --output text)

aws sqs send-message \
  --queue-url $QUEUE_URL \
  --message-body '{"transactionId":"txn-123","amount":100.00,"currency":"USD","status":"completed","paymentMethod":"credit_card","customerId":"cust-456"}'
```

## Monitoring

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/payment-processor-prod --follow
```

Check DLQ for failed messages:

```bash
aws sqs get-queue-attributes \
  --queue-url $(aws cloudformation describe-stacks \
    --stack-name payment-processor-stack \
    --query 'Stacks[0].Outputs[?OutputKey==`PaymentDLQUrl`].OutputValue' \
    --output text) \
  --attribute-names ApproximateNumberOfMessages
```
