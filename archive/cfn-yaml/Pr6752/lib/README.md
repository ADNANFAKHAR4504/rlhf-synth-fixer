# Payment Processing Infrastructure - CloudFormation Template

## Overview

This CloudFormation template creates an optimized payment processing infrastructure with comprehensive monitoring, resilience, and production-grade features for a fintech startup.

## Architecture

The solution deploys:
- **Lambda Function**: Payment validation with 3GB memory, 5-minute timeout, arm64 architecture
- **DynamoDB Table**: Transaction storage with on-demand billing and point-in-time recovery
- **SNS Topic**: Alert notifications with email subscription
- **SQS Dead Letter Queue**: Failed execution capture and retry capability
- **CloudWatch Alarms**: Proactive monitoring for errors, throttles, and capacity issues
- **CloudWatch Dashboard**: Unified monitoring view of all resources
- **EventBridge Rule**: Scheduled batch processing
- **IAM Roles**: Least-privilege access with X-Ray tracing permissions

## Files

- **TapStack.yml**: Complete CloudFormation template with all 20 requirements
- **PROMPT.md**: Original requirements specification
- **IDEAL_RESPONSE.md**: Documentation of the complete solution
- **MODEL_RESPONSE.md**: Initial implementation (requirements 1-10 only)
- **MODEL_FAILURES.md**: Gap analysis between initial and complete implementations
- **README.md**: This file - deployment and testing instructions

## Requirements Implemented

### Core Requirements (1-10)
1. Lambda function (3GB, 5min timeout, arm64)
2. DynamoDB table (on-demand, PITR, Retain policy)
3. SNS topic with email subscription
4. DependsOn chains for proper ordering
5. Parameter validation with AllowedPattern
6. Fn::Sub for string substitution
7. Stack outputs with exports
8. Metadata documentation
9. DeletionPolicy Retain for DynamoDB only
10. StackSet configuration metadata

### Enhanced Requirements (11-20)
11. CloudWatch Alarms (Lambda errors, throttles, DynamoDB, DLQ)
12. Dead Letter Queue (SQS) for error handling
13. EventBridge rule for scheduled processing
14. AWS X-Ray tracing enabled
15. CloudWatch Dashboard with comprehensive metrics
16. Lambda reserved concurrency
17. Comprehensive tagging strategy
18. Multi-environment support with Conditions
19. Least-privilege IAM roles and policies
20. Stack policy documentation

## Prerequisites

- AWS CLI 2.x installed and configured
- AWS account with permissions to create:
  - Lambda functions
  - DynamoDB tables
  - SNS topics and subscriptions
  - SQS queues
  - CloudWatch alarms and dashboards
  - EventBridge rules
  - IAM roles and policies
- Target region: us-east-1
- Valid email address for SNS alerts

## Deployment

### Step 1: Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://TapStack.yml \
  --region us-east-1
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-infrastructure \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DevAccountId,ParameterValue=123456789012 \
    ParameterKey=StagingAccountId,ParameterValue=234567890123 \
    ParameterKey=ProdAccountId,ParameterValue=345678901234 \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags \
    Key=Project,Value=PaymentProcessing \
    Key=Environment,Value=dev \
    Key=ManagedBy,Value=CloudFormation
```

### Step 3: Monitor Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name payment-processing-infrastructure \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1

# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name payment-processing-infrastructure \
  --region us-east-1 \
  --max-items 10
```

### Step 4: Confirm SNS Email Subscription

Check your email inbox for the SNS subscription confirmation email and click the confirmation link.

## Testing

### Test 1: Invoke Lambda Function

```bash
# Get Lambda function name from stack outputs
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentValidationFunctionName`].OutputValue' \
  --output text \
  --region us-east-1)

# Invoke Lambda with test payload
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"transactionId": "test-001", "amount": 1500}' \
  --region us-east-1 \
  response.json

# Check response
cat response.json
```

Expected response:
```json
{
  "statusCode": 200,
  "body": "{\"message\": \"Payment validated\", \"transactionId\": \"test-001\"}"
}
```

### Test 2: Verify DynamoDB Storage

```bash
# Get DynamoDB table name
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentTransactionTableName`].OutputValue' \
  --output text \
  --region us-east-1)

# Query for test transaction
aws dynamodb scan \
  --table-name $TABLE_NAME \
  --filter-expression "transactionId = :tid" \
  --expression-attribute-values '{":tid":{"S":"test-001"}}' \
  --region us-east-1
```

### Test 3: Verify CloudWatch Alarms

```bash
# List all alarms for the stack
aws cloudwatch describe-alarms \
  --alarm-name-prefix "payment" \
  --region us-east-1 \
  --query 'MetricAlarms[*].[AlarmName,StateValue]' \
  --output table
```

Expected alarms:
- payment-validation-errors-dev
- payment-validation-throttles-dev
- payment-dynamodb-errors-dev
- payment-dlq-messages-dev

### Test 4: Verify X-Ray Tracing

```bash
# Wait 5 minutes after Lambda invocation for traces to appear
aws xray get-trace-summaries \
  --start-time $(date -u -d '5 minutes ago' +%s) \
  --end-time $(date -u +%s) \
  --region us-east-1
```

### Test 5: View CloudWatch Dashboard

```bash
# Get dashboard URL
DASHBOARD_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentProcessingDashboardName`].OutputValue' \
  --output text \
  --region us-east-1)

echo "Dashboard URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$DASHBOARD_NAME"
```

### Test 6: Trigger Error for DLQ Test

```bash
# Invoke Lambda with invalid payload (negative amount)
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"transactionId": "error-test", "amount": -100}' \
  --region us-east-1 \
  error-response.json

# Check DLQ for messages (wait 1 minute)
sleep 60

DLQ_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentValidationDLQUrl`].OutputValue' \
  --output text \
  --region us-east-1)

aws sqs receive-message \
  --queue-url $DLQ_URL \
  --region us-east-1
```

### Test 7: Verify EventBridge Rule

```bash
# Check EventBridge rule
aws events describe-rule \
  --name payment-batch-processing-dev \
  --region us-east-1
```

Note: Rule is DISABLED in dev environment (only enabled in production).

### Test 8: Verify Resource Tags

```bash
# Check Lambda tags
aws lambda list-tags \
  --resource $(aws cloudformation describe-stacks \
    --stack-name payment-processing-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`PaymentValidationFunctionArn`].OutputValue' \
    --output text \
    --region us-east-1) \
  --region us-east-1

# Check DynamoDB tags
aws dynamodb list-tags-of-resource \
  --resource-arn $(aws cloudformation describe-stacks \
    --stack-name payment-processing-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`PaymentTransactionTableArn`].OutputValue' \
    --output text \
    --region us-east-1) \
  --region us-east-1
```

Expected tags: Name, Environment, Project, Team, CostCenter

## Multi-Environment Deployment

### Deploy to Staging

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-staging \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=AlertEmail,ParameterValue=staging-alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to Production

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=AlertEmail,ParameterValue=prod-alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Note: Production deployment has:
- More sensitive alarm thresholds
- Higher Lambda reserved concurrency (100 vs 10)
- EventBridge rule ENABLED for scheduled processing

## Monitoring and Operations

### View CloudWatch Logs

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/$FUNCTION_NAME" \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --region us-east-1

# Tail logs (requires log stream name from above)
aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow --region us-east-1
```

### View Alarm History

```bash
aws cloudwatch describe-alarm-history \
  --alarm-name payment-validation-errors-dev \
  --max-records 10 \
  --region us-east-1
```

### Check Lambda Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $(date -u -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date -u --iso-8601=seconds) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### Check DynamoDB Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=$TABLE_NAME \
  --start-time $(date -u -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date -u --iso-8601=seconds) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

## Cleanup

### Delete Stack (Non-Production)

```bash
# WARNING: This will delete all resources except DynamoDB table (Retain policy)
aws cloudformation delete-stack \
  --stack-name payment-processing-infrastructure \
  --region us-east-1

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-processing-infrastructure \
  --region us-east-1
```

### Manually Delete DynamoDB Table (if needed)

```bash
# DynamoDB table has Retain policy and must be deleted manually
aws dynamodb delete-table \
  --table-name $TABLE_NAME \
  --region us-east-1
```

## Cost Estimation

Estimated monthly costs for dev environment (assuming moderate usage):

- Lambda: $5-10/month (1M invocations, 3GB memory, arm64)
- DynamoDB: $2-5/month (on-demand billing)
- SNS: $0.50/month (1K emails)
- SQS: $0.40/month (1K messages)
- CloudWatch: $3/month (alarms + dashboard)
- X-Ray: $2/month (1M traces sampled)

**Total: ~$13-21/month for dev environment**

Production costs will be higher based on actual traffic volume.

## Troubleshooting

### Stack Creation Failed

1. Check stack events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name payment-processing-infrastructure \
     --region us-east-1 | grep "FAILED"
   ```

2. Common issues:
   - IAM permissions: Add `CAPABILITY_NAMED_IAM` flag
   - Invalid email format: Check AlertEmail parameter
   - Resource limits: Check Lambda concurrent execution limits

### Lambda Invocation Errors

1. Check Lambda logs:
   ```bash
   aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow --region us-east-1
   ```

2. Verify IAM permissions for DynamoDB, SNS, X-Ray, SQS

### Alarms Not Triggering

1. Verify alarm configuration:
   ```bash
   aws cloudwatch describe-alarms --alarm-names payment-validation-errors-dev --region us-east-1
   ```

2. Confirm SNS email subscription is confirmed

3. Check alarm history for state changes

### X-Ray Traces Not Appearing

1. Verify tracing is enabled:
   ```bash
   aws lambda get-function-configuration --function-name $FUNCTION_NAME --query TracingConfig --region us-east-1
   ```

2. Verify IAM role has X-Ray permissions

3. Wait 5-10 minutes for traces to appear

## Support

For issues or questions:
1. Review MODEL_FAILURES.md for common gaps
2. Check CloudWatch Logs for error details
3. Review IAM permissions in PaymentValidationRole
4. Verify all parameters are correctly specified

## License

This infrastructure template is provided as-is for educational and training purposes.
