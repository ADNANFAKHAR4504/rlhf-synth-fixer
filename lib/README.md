# Serverless Fraud Detection Pipeline

A comprehensive CloudFormation implementation of a serverless fraud detection system for processing payment transactions in real-time.

## Architecture Overview

This solution implements an event-driven architecture with the following components:

- **Lambda Functions**: Two Python 3.11 functions for transaction processing and archival
- **DynamoDB**: Transaction storage with point-in-time recovery
- **Step Functions**: Orchestration workflow with parallel processing
- **S3**: Long-term archival with intelligent tiering and lifecycle policies
- **EventBridge**: Event routing with content-based filtering
- **SNS**: Compliance team alerting for high-risk transactions
- **CloudWatch**: Centralized logging with 30-day retention
- **IAM**: Least-privilege security roles

## Features

### Transaction Processing
- Real-time risk scoring based on transaction amount
- Automatic high-risk transaction detection
- DynamoDB storage with encryption at rest
- X-Ray tracing for full audit trail

### Workflow Orchestration
- Parallel processing branches for efficiency
- Exponential backoff retry logic (max 3 attempts)
- Automatic archival to S3
- Risk-based routing

### Cost Controls
- Reserved concurrency of 100 per Lambda function
- Intelligent tiering for S3 storage optimization
- Pay-per-request DynamoDB billing
- Lifecycle policies for Glacier transition after 90 days

### Compliance Features
- Point-in-time recovery for DynamoDB
- X-Ray tracing on all Lambda functions
- CloudWatch Logs retention (30 days)
- Encryption at rest for all data stores
- S3 versioning enabled

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- IAM permissions for CloudFormation, Lambda, DynamoDB, S3, Step Functions, EventBridge, SNS
- Target region: us-east-1

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name fraud-detection-pipeline \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Testing

### Trigger Fraud Detection Workflow

Send a test event to EventBridge:

```bash
aws events put-events \
  --entries '[
    {
      "Source": "custom.frauddetection",
      "DetailType": "Transaction Received",
      "Detail": "{\"transactionId\":\"tx-12345\",\"amount\":1500,\"merchant\":\"Test Store\"}"
    }
  ]' \
  --region us-east-1
```

### Check Step Functions Execution

```bash
STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`StateMachineArn`].OutputValue' \
  --output text)

aws stepfunctions list-executions \
  --state-machine-arn $STATE_MACHINE_ARN \
  --region us-east-1
```

### Query Transaction in DynamoDB

```bash
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`TransactionTableName`].OutputValue' \
  --output text)

aws dynamodb get-item \
  --table-name $TABLE_NAME \
  --key '{"transactionId":{"S":"tx-12345"},"timestamp":{"N":"1234567890"}}' \
  --region us-east-1
```

### Verify S3 Archive

```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`ArchiveBucketName`].OutputValue' \
  --output text)

aws s3 ls s3://$BUCKET_NAME/transactions/ --recursive
```

## Configuration

### Environment Parameter

The `EnvironmentSuffix` parameter allows multiple deployments:
- Development: `dev`
- Staging: `staging`
- Production: `prod`

### Lambda Configuration
- Runtime: Python 3.11
- Memory: 1024 MB (processor), 512 MB (post-processor)
- Timeout: 60 seconds
- Reserved Concurrency: 100 per function
- X-Ray Tracing: Active

### DynamoDB Configuration
- Billing Mode: Pay-per-request
- Partition Key: transactionId (String)
- Sort Key: timestamp (Number)
- Point-in-time Recovery: Enabled
- Encryption: AWS managed keys

### S3 Configuration
- Versioning: Enabled
- Intelligent Tiering: Archive after 90 days
- Lifecycle Policy: Glacier transition at 90 days
- Encryption: AES256
- Public Access: Blocked

### Step Functions Retry Configuration
- Max Attempts: 3
- Initial Interval: 2 seconds
- Backoff Rate: 2.0 (exponential)

## Monitoring

### CloudWatch Logs
- Processor logs: `/aws/lambda/fraud-processor-{EnvironmentSuffix}`
- Post-processor logs: `/aws/lambda/fraud-post-processor-{EnvironmentSuffix}`
- Retention: 30 days

### X-Ray Tracing
All Lambda functions and Step Functions have X-Ray tracing enabled for:
- Performance monitoring
- Error analysis
- Compliance auditing

### SNS Alerts
High-risk transactions (score >= 70) trigger SNS notifications to the compliance topic.

## Security

### IAM Roles
- **TransactionProcessorRole**: DynamoDB write, SNS publish, CloudWatch Logs
- **PostProcessorRole**: DynamoDB read, S3 write, CloudWatch Logs
- **StepFunctionsRole**: Lambda invoke permissions
- **EventBridgeRole**: Step Functions execution

All roles follow least-privilege principles.

### Encryption
- DynamoDB: Encryption at rest with AWS managed KMS keys
- S3: Server-side encryption (AES256)
- SNS: In-transit encryption (TLS)

### Network Security
- S3 bucket: Public access blocked
- Lambda: Default VPC configuration
- All AWS service endpoints: TLS 1.2+

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 bucket first (due to versioning)
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name fraud-detection-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`ArchiveBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://$BUCKET_NAME --recursive
aws s3api delete-bucket --bucket $BUCKET_NAME

# Delete stack
aws cloudformation delete-stack \
  --stack-name fraud-detection-pipeline \
  --region us-east-1
```

## Troubleshooting

### Lambda Errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/fraud-processor-prod --follow
```

### Step Functions Failures
View execution details:
```bash
aws stepfunctions describe-execution --execution-arn <execution-arn>
```

### DynamoDB Throttling
Monitor consumed capacity:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=fraud-transactions-prod \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Cost Optimization

- Reserved concurrency prevents runaway Lambda costs
- Pay-per-request DynamoDB eliminates idle capacity costs
- Intelligent tiering reduces S3 storage costs automatically
- Lifecycle policies move old data to Glacier
- 30-day log retention prevents unbounded storage growth

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review X-Ray traces for performance issues
3. Verify IAM permissions for all roles
4. Ensure all constraints are met (concurrency, retention, etc.)
