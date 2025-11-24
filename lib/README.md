# Multi-Region Disaster Recovery Solution

This CloudFormation template implements a comprehensive disaster recovery solution for a payment processing system spanning multiple AWS regions.

## Architecture

### Components

- **Lambda Functions**: Python 3.11 functions for payment processing with reserved concurrency of 100
- **DynamoDB Global Tables**: Multi-region transaction storage with point-in-time recovery
- **S3 Cross-Region Replication**: Transaction log replication between regions
- **Route 53**: DNS failover with health checks
- **Secrets Manager**: API credentials with automatic replication
- **CloudWatch & SNS**: Comprehensive monitoring and alerting

### Regions

- **Primary**: us-east-1
- **Secondary**: us-west-2

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. IAM permissions for creating all resources
3. Valid email address for SNS notifications
4. Domain name for Route 53 hosted zone (optional)

### Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-primary \
  --template-body file://disaster-recovery-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=IsPrimaryRegion,ParameterValue=true \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=AlertEmail,ParameterValue=ops@example.com \
    ParameterKey=HostedZoneName,ParameterValue=payment-system.example.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Secondary Region (us-west-2)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-secondary \
  --template-body file://disaster-recovery-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=IsPrimaryRegion,ParameterValue=false \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=AlertEmail,ParameterValue=ops@example.com \
    ParameterKey=HostedZoneName,ParameterValue=payment-system.example.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### Update Secrets

After deployment, update the Secrets Manager secret with actual API credentials:

```bash
aws secretsmanager update-secret \
  --secret-id payment-api-keys-prod-001 \
  --secret-string '{"apiKey":"YOUR_ACTUAL_API_KEY","apiSecret":"YOUR_ACTUAL_SECRET","region":"us-east-1"}' \
  --region us-east-1
```

The secret will automatically replicate to us-west-2.

## Testing

### Test Payment Processing

```bash
# Get Lambda function URL from stack outputs
FUNCTION_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionUrl`].OutputValue' \
  --output text \
  --region us-east-1)

# Send test payment request
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-12345",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Test Health Check

```bash
HEALTH_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --query 'Stacks[0].Outputs[?OutputKey==`HealthCheckUrl`].OutputValue' \
  --output text \
  --region us-east-1)

curl $HEALTH_URL
```

### Verify Data Replication

```bash
# Query DynamoDB in primary region
aws dynamodb scan \
  --table-name payment-transactions-prod-001 \
  --max-items 10 \
  --region us-east-1

# Verify same data in secondary region
aws dynamodb scan \
  --table-name payment-transactions-prod-001 \
  --max-items 10 \
  --region us-west-2
```

### Test S3 Replication

```bash
# Upload test file to primary bucket
echo "Test transaction log" > test.json
aws s3 cp test.json s3://transaction-logs-us-east-1-prod-001/test/

# Wait 15 minutes for replication, then check secondary
aws s3 ls s3://transaction-logs-us-west-2-prod-001/test/
```

## Monitoring

### CloudWatch Alarms

The solution includes these alarms:

- **lambda-errors**: Triggers when Lambda errors exceed 10 in 5 minutes
- **lambda-throttles**: Triggers when Lambda throttles exceed 5 in 5 minutes
- **dynamodb-read-throttle**: Triggers when DynamoDB read throttles exceed 10
- **dynamodb-write-throttle**: Triggers when DynamoDB write throttles exceed 10
- **s3-replication-latency**: Triggers when replication exceeds 15 minutes

All alarms send notifications to the configured SNS topic.

### View Metrics

```bash
# Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=payment-processor-prod-001 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=payment-transactions-prod-001 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## Failover Testing

### Simulate Primary Region Failure

1. Disable health check in primary region by scaling Lambda to 0 concurrent executions:

```bash
aws lambda put-function-concurrency \
  --function-name payment-processor-prod-001 \
  --reserved-concurrent-executions 0 \
  --region us-east-1
```

2. Wait 2-3 minutes for Route 53 health check to fail
3. Verify traffic routes to secondary region
4. Restore primary region:

```bash
aws lambda put-function-concurrency \
  --function-name payment-processor-prod-001 \
  --reserved-concurrent-executions 100 \
  --region us-east-1
```

### Manual Failover

Update Route 53 weighted routing:

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`payment-system.example.com.`].Id' \
  --output text)

# Update weights (increase secondary, decrease primary)
# Use Route 53 console or AWS CLI change-resource-record-sets
```

## Cleanup

### Delete Stacks

```bash
# Delete secondary region first
aws cloudformation delete-stack \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Wait for completion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Delete primary region
aws cloudformation delete-stack \
  --stack-name payment-dr-primary \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

### Manual Cleanup

If stack deletion fails due to S3 buckets with content:

```bash
# Empty primary bucket
aws s3 rm s3://transaction-logs-us-east-1-prod-001 --recursive --region us-east-1

# Empty secondary bucket
aws s3 rm s3://transaction-logs-us-west-2-prod-001 --recursive --region us-west-2

# Retry stack deletion
```

## Cost Optimization

- DynamoDB uses on-demand billing to avoid over-provisioning
- Lambda functions have reserved concurrency to prevent runaway costs
- S3 lifecycle policies transition old logs to cheaper storage classes
- Route 53 health checks run at 30-second intervals (cost-effective)

## Security Best Practices

- All S3 buckets block public access
- Secrets Manager handles sensitive credentials
- Lambda functions use least-privilege IAM roles
- S3 buckets use server-side encryption
- DynamoDB point-in-time recovery enabled

## Troubleshooting

### Lambda Function Not Receiving Requests

Check:
1. Lambda function URL is accessible
2. Function has correct IAM permissions
3. Reserved concurrency is not set to 0
4. CloudWatch logs for error messages

### DynamoDB Replication Issues

Check:
1. Global table status in both regions
2. Table streams are enabled
3. IAM permissions for replication
4. Network connectivity between regions

### S3 Replication Not Working

Check:
1. Replication role has correct permissions
2. Versioning enabled on both buckets
3. Destination bucket exists and is accessible
4. Replication metrics in CloudWatch

### Health Check Failing

Check:
1. Health check Lambda function is running
2. Function URL is accessible over HTTPS
3. Function timeout is adequate
4. DynamoDB table is accessible

## Stack Outputs Reference

All critical resource identifiers are exported as stack outputs:

- `DynamoDBTableName`: Table name for application configuration
- `DynamoDBTableArn`: ARN for IAM policy references
- `S3BucketName`: Bucket name for logging configuration
- `S3BucketArn`: ARN for IAM policy references
- `LambdaFunctionArn`: ARN for event source mappings
- `LambdaFunctionUrl`: Public endpoint for payment processing
- `HealthCheckUrl`: Endpoint for health monitoring
- `SecretArn`: ARN for accessing credentials
- `SNSTopicArn`: Topic for sending additional alerts
- `HostedZoneId`: Zone ID for DNS configuration
- `HealthCheckId`: Health check ID for monitoring

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda functions
2. Review CloudWatch alarms for triggered alerts
3. Verify SNS email notifications
4. Check AWS Health Dashboard for service issues
