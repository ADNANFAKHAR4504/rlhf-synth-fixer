# CloudFormation Template for Serverless Application

## Overview
This CloudFormation template creates a fully serverless application with Lambda, API Gateway, DynamoDB, SQS DLQ, and KMS encryption as specified in the requirements.

## Template Structure

### 1. Parameters
```yaml
Parameters:
  LambdaFunctionName:
    Type: String
    Default: 'ServerlessProcessor'
  DynamoDBTableName:
    Type: String
    Default: 'ProcessedData'
  SQSQueueName:
    Type: String
    Default: 'lambda-dlq'
```

### 2. KMS Keys
- **DynamoDBKMSKey**: Customer-managed KMS key for DynamoDB encryption
- **SQSKMSKey**: Customer-managed KMS key for SQS encryption
- Both keys include proper service permissions for DynamoDB and SQS

### 3. Core Resources

#### DynamoDB Table
```yaml
ProcessedDataTable:
  Type: AWS::DynamoDB::Table
  Properties:
    BillingMode: PAY_PER_REQUEST
    SSESpecification:
      SSEEnabled: true
      SSEType: KMS
      KMSMasterKeyId: !Ref DynamoDBKMSKey
```
- Configured with Pay Per Request billing mode
- KMS encryption enabled
- Point-in-time recovery enabled

#### Lambda Function
```yaml
ProcessorLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    Runtime: python3.12
    Timeout: 60
    DeadLetterConfig:
      TargetArn: !GetAtt DeadLetterQueue.Arn
```
- Python 3.12 runtime
- 60-second timeout as required
- Configured with DLQ for failed invocations
- Includes inline code for processing HTTP requests

#### SQS Dead Letter Queue
```yaml
DeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    KmsMasterKeyId: !Ref SQSKMSKey
    MessageRetentionPeriod: 1209600
```
- KMS encryption enabled
- 14-day message retention

#### API Gateway
```yaml
ServerlessApi:
  Type: AWS::ApiGateway::RestApi
  Properties:
    EndpointConfiguration:
      Types:
        - REGIONAL
```
- REST API with regional endpoint
- Configured with ANY method to handle all HTTP methods
- Proxy integration with Lambda
- Both root and proxy resources configured

### 4. IAM Roles and Permissions
- **LambdaExecutionRole**: IAM role for Lambda with:
  - Basic Lambda execution permissions
  - DynamoDB read/write access
  - SQS send message permissions
  - KMS decrypt/generate data key permissions

### 5. Outputs
```yaml
Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
  LambdaFunctionArn:
    Description: 'Lambda function ARN'
  DynamoDBTableName:
    Description: 'DynamoDB table name'
  DeadLetterQueueUrl:
    Description: 'Dead Letter Queue URL'
  DynamoDBKMSKeyId:
    Description: 'KMS Key ID for DynamoDB'
  SQSKMSKeyId:
    Description: 'KMS Key ID for SQS'
```

## Implementation Details

### Lambda Function Code
The Lambda function includes:
- Request processing logic for all HTTP methods
- DynamoDB integration for storing processed data
- Error handling with appropriate HTTP responses
- Logging for debugging and monitoring
- CORS headers for cross-origin requests

### Security Features
- All data at rest encrypted with KMS
- Least privilege IAM permissions
- Service-specific KMS key policies
- Point-in-time recovery for DynamoDB

### Compliance with Requirements
✅ Lambda runs in us-west-2 (controlled by deployment region)
✅ Lambda timeout set to 60 seconds
✅ DynamoDB uses Pay Per Request billing mode
✅ API Gateway handles all HTTP methods
✅ Both DynamoDB and SQS use KMS encryption
✅ Dead Letter Queue configured for Lambda failures

## Deployment
The template can be deployed using AWS CloudFormation CLI or Console:
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name ServerlessApp \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```