# Serverless Crypto Price Alert System

A CloudFormation-based serverless infrastructure for processing cryptocurrency price alerts in real-time. This system is designed to handle high-volume spikes during market volatility while maintaining cost efficiency during quiet periods.

## Architecture Overview

This solution implements a fully serverless architecture with the following components:

### Core Components

1. **PriceWebhookProcessor Lambda** (1GB, ARM64, 100 concurrent)
   - Receives real-time price updates from cryptocurrency exchanges
   - Stores price data for processing
   - Uses DynamoDB for state management

2. **AlertMatcher Lambda** (2GB, ARM64, 50 concurrent)
   - Triggered every 60 seconds by EventBridge
   - Compares current prices against user-defined thresholds
   - Routes successful matches via Lambda Destinations

3. **ProcessedAlerts Lambda** (512MB, ARM64)
   - Receives successful alert matches from AlertMatcher
   - Processes notifications and updates alert status

4. **CryptoAlerts DynamoDB Table**
   - Stores user alert configurations
   - Partition key: `userId`
   - Sort key: `alertId`
   - On-demand billing with point-in-time recovery

5. **EventBridge Scheduled Rule**
   - Triggers AlertMatcher every 60 seconds
   - Uses rate expression for consistent timing

### Infrastructure Features

- **ARM64 Architecture**: All Lambda functions use Graviton2 processors for 20% cost savings
- **Reserved Concurrency**: Prevents throttling during market spikes
- **Lambda Destinations**: Asynchronous success routing (no DLQ)
- **Least Privilege IAM**: Scoped permissions for each function
- **Cost Optimized**: 3-day CloudWatch Logs retention, on-demand DynamoDB billing

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions to create Lambda, DynamoDB, IAM, EventBridge, and CloudWatch resources
- Unique environment suffix for resource naming (to avoid conflicts)

## Deployment Instructions

### Option 1: AWS CLI Deployment

```bash
# Set your unique environment suffix
ENVIRONMENT_SUFFIX="your-unique-suffix"

# Deploy the stack
aws cloudformation create-stack \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/crypto-alert-system.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

### Option 2: AWS Console Deployment

1. Open the AWS CloudFormation console
2. Click "Create stack" > "With new resources"
3. Upload the `lib/crypto-alert-system.json` template
4. Enter a unique stack name (e.g., `crypto-alert-system-dev`)
5. Set the `EnvironmentSuffix` parameter (e.g., `dev`, `test`)
6. Acknowledge IAM resource creation
7. Click "Create stack"
8. Wait for stack creation to complete (typically 2-3 minutes)

## Stack Outputs

After deployment, the stack provides the following outputs:

- **PriceWebhookProcessorArn**: ARN for the webhook processor Lambda
- **AlertMatcherArn**: ARN for the alert matching Lambda
- **ProcessedAlertsArn**: ARN for the alert processing Lambda
- **CryptoAlertsTableName**: Name of the DynamoDB table
- **CryptoAlertsTableArn**: ARN of the DynamoDB table

## Testing the Deployment

### 1. Verify Lambda Functions

```bash
# List Lambda functions
aws lambda list-functions \
  --query "Functions[?contains(FunctionName, '${ENVIRONMENT_SUFFIX}')].FunctionName" \
  --region us-east-1

# Invoke PriceWebhookProcessor
aws lambda invoke \
  --function-name PriceWebhookProcessor-${ENVIRONMENT_SUFFIX} \
  --payload '{"body": "{\"symbol\": \"BTC\", \"price\": 45000, \"timestamp\": \"2025-01-01T00:00:00Z\"}"}' \
  --region us-east-1 \
  response.json

# Check response
cat response.json
```

### 2. Verify DynamoDB Table

```bash
# Describe the table
aws dynamodb describe-table \
  --table-name CryptoAlerts-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Verify point-in-time recovery
aws dynamodb describe-continuous-backups \
  --table-name CryptoAlerts-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### 3. Verify EventBridge Rule

```bash
# Check the scheduled rule
aws events describe-rule \
  --name AlertMatcherSchedule-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# List targets
aws events list-targets-by-rule \
  --rule AlertMatcherSchedule-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### 4. Monitor CloudWatch Logs

```bash
# View PriceWebhookProcessor logs
aws logs tail /aws/lambda/PriceWebhookProcessor-${ENVIRONMENT_SUFFIX} \
  --follow \
  --region us-east-1

# View AlertMatcher logs
aws logs tail /aws/lambda/AlertMatcher-${ENVIRONMENT_SUFFIX} \
  --follow \
  --region us-east-1
```

## Resource Management

### Update Stack

```bash
aws cloudformation update-stack \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/crypto-alert-system.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Delete Stack

```bash
# Delete the stack (removes all resources)
aws cloudformation delete-stack \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name crypto-alert-system-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Cost Considerations

This serverless architecture is designed for cost efficiency:

- **Lambda**: ARM64 reduces costs by ~20%, pay only for execution time
- **DynamoDB**: On-demand billing scales to zero during idle periods
- **CloudWatch Logs**: 3-day retention minimizes storage costs
- **No NAT Gateway**: Serverless architecture eliminates fixed costs
- **Reserved Concurrency**: Only allocated when needed, no idle capacity

### Estimated Monthly Costs (Moderate Usage)

- Lambda: $5-20 (depends on invocation frequency)
- DynamoDB: $2-10 (on-demand, depends on read/write volume)
- CloudWatch Logs: $1-3 (3-day retention)
- EventBridge: $1 (scheduled rules)

**Total: $9-34/month** for moderate workloads

## Security Features

- **IAM Least Privilege**: Each Lambda has scoped permissions to specific resources
- **No Wildcard Actions**: All IAM policies use specific action names
- **VPC Optional**: Functions can be deployed in VPC if needed
- **Encryption at Rest**: DynamoDB encryption enabled by default
- **Encryption in Transit**: All AWS API calls use TLS
- **CloudWatch Logs**: Default encryption (no KMS keys needed)

## Monitoring and Observability

### CloudWatch Metrics

Monitor these key metrics:

- Lambda invocations, errors, duration, concurrent executions
- DynamoDB consumed read/write capacity, throttled requests
- EventBridge invocations, failed invocations

### CloudWatch Alarms (Recommended)

```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name AlertMatcher-Errors-${ENVIRONMENT_SUFFIX} \
  --alarm-description "Alert when AlertMatcher has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=AlertMatcher-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Troubleshooting

### Lambda Invocation Failures

1. Check CloudWatch Logs for error messages
2. Verify IAM role permissions
3. Check reserved concurrency limits
4. Verify environment variables are set correctly

### EventBridge Not Triggering

1. Verify rule is ENABLED
2. Check Lambda permission for events.amazonaws.com
3. Review EventBridge rule metrics in CloudWatch

### DynamoDB Access Issues

1. Verify table exists and has correct name
2. Check IAM policy has required DynamoDB actions
3. Verify table ARN matches in IAM policy

### Lambda Destinations Not Working

1. Verify ProcessedAlerts Lambda has invocation permission
2. Check AlertMatcherDestinationConfig is applied
3. Review CloudWatch Logs for destination errors

## Development Notes

### Lambda Code Structure

The inline Lambda code is minimal placeholder code for testing. In production:

1. Package Lambda code with dependencies
2. Upload to S3 or ECR
3. Update CloudFormation template with S3Bucket/S3Key or ImageUri
4. Implement proper error handling and retry logic
5. Add structured logging with correlation IDs

### Environment Variables

All Lambdas receive:
- `DYNAMODB_TABLE`: Table name for CryptoAlerts
- `ENVIRONMENT`: Environment suffix for debugging

### Extending the System

To add features:

1. **SNS Notifications**: Add SNS topic and subscribe ProcessedAlerts
2. **SQS FIFO Queue**: Add queue between webhook and processor for ordering
3. **API Gateway**: Add REST API for manual price updates
4. **Additional Alerting**: Add email/SMS via SNS or SES

## CI/CD Integration

This template is designed for automated deployment:

```yaml
# Example GitHub Actions workflow
- name: Deploy CloudFormation Stack
  run: |
    aws cloudformation deploy \
      --stack-name crypto-alert-system-${{ github.run_id }} \
      --template-file lib/crypto-alert-system.json \
      --parameter-overrides EnvironmentSuffix=${{ github.run_id }} \
      --capabilities CAPABILITY_NAMED_IAM \
      --region us-east-1
```

## Support and Maintenance

- CloudFormation stack drift detection recommended monthly
- Review CloudWatch Logs retention settings quarterly
- Update Lambda runtimes when new versions available
- Monitor AWS service limits (Lambda concurrency, EventBridge rules)

## License

This infrastructure code is provided as-is for educational and demonstration purposes.
