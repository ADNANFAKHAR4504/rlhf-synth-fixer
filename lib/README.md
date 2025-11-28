# Cryptocurrency Price Alert System

A serverless cryptocurrency price alert system built with AWS CloudFormation, designed to handle thousands of price threshold checks per minute while maintaining strict latency requirements for alert notifications.

## Architecture Overview

This solution implements a fully serverless architecture using:

- **DynamoDB**: Stores user price alerts with partition key (userId) and sort key (alertId)
- **Lambda**: Processes price checks using Node.js 18 on ARM64 architecture
- **SNS**: Delivers price alert notifications with server-side encryption
- **KMS**: Customer-managed encryption key for Lambda environment variables and SNS
- **CloudWatch Logs**: Centralized logging with 30-day retention
- **IAM**: Least-privilege roles with explicit resource ARNs

## Features

- ARM64 (Graviton2) Lambda for cost optimization
- Reserved concurrent executions (100) to prevent throttling
- Pay-per-request DynamoDB billing for unpredictable workloads
- Point-in-time recovery for data protection
- Customer-managed KMS encryption for security
- Server-side encryption on SNS topics
- No wildcard IAM permissions (explicit resource ARNs only)
- All resources tagged for cost tracking and organization

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create CloudFormation stacks
- IAM permissions for: Lambda, DynamoDB, SNS, KMS, CloudWatch Logs, IAM

## Deployment

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name price-alerts-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Update Stack

```bash
aws cloudformation update-stack \
  --stack-name price-alerts-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name price-alerts-stack \
  --region us-east-1
```

## Stack Parameters

- **EnvironmentSuffix**: Suffix for resource names to ensure uniqueness (default: prod)

## Stack Outputs

- **LambdaFunctionArn**: ARN of the ProcessPriceChecks Lambda function
- **DynamoDBTableName**: Name of the PriceAlerts DynamoDB table
- **SNSTopicArn**: ARN of the PriceAlertNotifications SNS topic
- **KMSKeyArn**: ARN of the customer-managed KMS key
- **LambdaExecutionRoleArn**: ARN of the Lambda execution role

## Testing

### Test Lambda Function

```bash
aws lambda invoke \
  --function-name ProcessPriceChecks-prod \
  --payload '{"userId": "test-user", "priceAlert": {"cryptocurrency": "BTC", "targetPrice": 50000}, "currentPrice": 51000}' \
  --region us-east-1 \
  output.json

cat output.json
```

### Add Alert to DynamoDB

```bash
aws dynamodb put-item \
  --table-name PriceAlerts-prod \
  --item '{
    "userId": {"S": "test-user"},
    "alertId": {"S": "alert-001"},
    "cryptocurrency": {"S": "BTC"},
    "targetPrice": {"N": "50000"},
    "createdAt": {"S": "2025-11-28T00:00:00Z"}
  }' \
  --region us-east-1
```

### Query Alerts

```bash
aws dynamodb query \
  --table-name PriceAlerts-prod \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"test-user"}}' \
  --region us-east-1
```

### Publish Test Notification

```bash
# Get SNS topic ARN from stack outputs
SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name price-alerts-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
  --output text \
  --region us-east-1)

aws sns publish \
  --topic-arn $SNS_TOPIC_ARN \
  --message "Test price alert notification" \
  --subject "Test Alert" \
  --region us-east-1
```

## Resources Created

1. **PriceAlertsKMSKey**: Customer-managed KMS key for encryption
2. **PriceAlertsKMSKeyAlias**: Alias for the KMS key
3. **PriceAlertsTable**: DynamoDB table for storing price alerts
4. **PriceAlertNotificationsTopic**: SNS topic for notifications
5. **ProcessPriceChecksLogGroup**: CloudWatch Logs group
6. **ProcessPriceChecksExecutionRole**: IAM role for Lambda execution
7. **ProcessPriceChecksFunction**: Lambda function for processing price checks

## Security

- All IAM policies use explicit resource ARNs (no wildcards)
- Lambda environment variables encrypted with customer-managed KMS key
- SNS topic encrypted with customer-managed KMS key
- Least-privilege IAM roles
- All resources tagged for audit and compliance

## Monitoring

- CloudWatch Logs: /aws/lambda/ProcessPriceChecks-{suffix}
- Log retention: 30 days
- Lambda metrics: Invocations, Errors, Duration, Throttles
- DynamoDB metrics: Read/Write capacity, Throttled requests

## Cost Optimization

- ARM64 (Graviton2) Lambda: 20% cost reduction vs x86
- DynamoDB pay-per-request: Only pay for actual usage
- Reserved concurrent executions: Prevent throttling without over-provisioning
- 30-day log retention: Balance between audit needs and storage costs

## Compliance

- Point-in-time recovery: Data protection and compliance
- Customer-managed KMS keys: Control over encryption
- CloudWatch Logs: Audit trail for 30 days
- All resources tagged: Environment, Service

## Troubleshooting

### Lambda Function Not Executing

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/ProcessPriceChecks-prod --follow --region us-east-1
```

### DynamoDB Access Denied

Verify IAM role permissions:
```bash
aws iam get-role-policy \
  --role-name ProcessPriceChecksRole-prod \
  --policy-name DynamoDBAccess \
  --region us-east-1
```

### SNS Publish Failed

Check KMS key permissions for SNS:
```bash
aws kms get-key-policy \
  --key-id alias/price-alerts-prod \
  --policy-name default \
  --region us-east-1
```

## Customization

### Update Lambda Code

The template includes inline Lambda code for demonstration. For production:

1. Create deployment package with dependencies
2. Upload to S3
3. Update Lambda Code property to use S3Bucket and S3Key

### Add DynamoDB Indexes

Add Global Secondary Indexes (GSI) to support additional query patterns:

```json
"GlobalSecondaryIndexes": [
  {
    "IndexName": "cryptocurrency-index",
    "KeySchema": [
      {
        "AttributeName": "cryptocurrency",
        "KeyType": "HASH"
      }
    ],
    "Projection": {
      "ProjectionType": "ALL"
    }
  }
]
```

### Add API Gateway

For manual alert management, add API Gateway with Lambda integration.

## License

This template is provided as-is for educational and production use.
