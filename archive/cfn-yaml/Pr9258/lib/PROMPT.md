# CloudFormation Template for Serverless Data API

Need a CloudFormation YAML template that deploys a complete serverless API for storing data. The stack should include Lambda, API Gateway, DynamoDB with encryption, plus proper monitoring and security.

## Core Infrastructure

### Lambda Function
- Runtime: python3.9
- Handler: index.lambda_handler
- Function should accept HTTP POST requests, generate a unique ID, store the request body with ID and timestamp to DynamoDB, and return JSON success response
- Include basic error handling
- Environment variables:
  - STAGE - from CloudFormation parameter
  - AWS_REGION - hardcoded to us-east-1
  - DYNAMODB_TABLE_NAME - reference the table created in this stack

### API Gateway REST API
- API name: use AWS::StackName
- Resource path: /data
- Method: POST on /data
- Integration: AWS_PROXY to invoke Lambda
- Create deployment and stage named after the Environment parameter

## Security Setup

### KMS Key for Encryption
- Create AWS::KMS::Key resource
- Key policy must allow:
  - Root account access to manage the key
  - DynamoDB service to use the key for encrypt/decrypt - specifically kms:GenerateDataKey and kms:Decrypt actions
- Enable automatic key rotation
- Create an alias for easy reference

### DynamoDB Encryption
- Table must use Server-Side Encryption with the custom KMS key created above
- Reference the KMS key ARN explicitly

### Lambda IAM Role
Must follow least-privilege principles:
- Trust policy: allow lambda.amazonaws.com to assume role
- Inline policies needed:
  - CloudWatch Logs access: logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents scoped to the Lambda's log group
  - DynamoDB access: ONLY dynamodb:PutItem on the specific table - don't use dynamodb:* or broader permissions

## Data Storage

### DynamoDB Table
- Table name: use AWS::StackName
- Partition key: id as String
- Sort key: timestamp as String
- Provisioned throughput: 5 read and 5 write capacity units
- Tag with Environment

## Monitoring and Logging

### API Gateway Logging
- Enable CloudWatch logs for access logging
- Create dedicated log group for API Gateway
- Configure stage to send access logs to this log group

### CloudWatch Alarm
- Monitor Lambda Errors metric
- Threshold: trigger if errors > 0 for 1 period of 5 minutes
- TreatMissingData: notBreaching
- Create SNS topic and send alarm notifications to it

## Rate Limiting

### API Gateway Throttling
Configure default throttling on the stage:
- Rate limit: 100 requests/second
- Burst limit: 50 requests

## Template Requirements

**Format**: YAML only

**Parameters**:
- Environment: dev/stage/prod with default dev
- LogLevel: INFO/WARN/ERROR with default INFO
- SNSEmail: email address for alarm notifications

**Region**: Deploy everything to us-east-1

**Comments**: Add clear comments for each major resource explaining what it does

**Outputs**: Export ApiGatewayUrl, LambdaFunctionArn, DynamoDBTableName, and CloudWatchAlarmName

Need the complete working template that's ready to deploy.
