# Real-Time Observability Platform for Payment Transactions

Production-ready Terraform infrastructure for monitoring payment transaction flows with real-time alerting, distributed tracing, and automated event routing.

## Architecture Overview

### Components

1. **Kinesis Data Streams**: Real-time event ingestion with 5 shards and shard-level metrics
2. **Lambda (Container-based)**: Stream processing with X-Ray tracing and custom metrics
3. **X-Ray**: Distributed tracing with 100% sampling and custom segments
4. **CloudWatch**: Dashboards (10 widgets), composite alarms, and log analytics
5. **SNS**: Encrypted notifications using customer-managed KMS keys
6. **EventBridge**: Content-based routing for transaction patterns
7. **SQS**: Dead letter queue for failed Lambda invocations

### Critical Constraints Satisfied

- Composite alarms with multi-metric evaluation (Constraint #1)
- Customer-managed KMS keys for SNS encryption (Constraint #2)
- Container-based Lambda deployment (Constraint #3)
- Kinesis shard-level metrics enabled (Constraint #4)
- Custom CloudWatch namespaces with dimensions (Constraint #5)
- EventBridge content-based filtering (Constraint #6)
- X-Ray 100% sampling with custom segments (Constraint #7)

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Docker installed for building Lambda container images
- AWS account with permissions for:
  - Kinesis, Lambda, X-Ray, CloudWatch, SNS, KMS, EventBridge, SQS, ECR, IAM

## Deployment Instructions

### 1. Configure Variables

Create `terraform.tfvars`:

```hcl
environment_suffix = "prod"
aws_region         = "eu-west-1"
alarm_email_endpoint = "ops-team@yourcompany.com"
kinesis_shard_count  = 5
log_retention_days   = 30
```

### 2. Build and Push Lambda Container Image

```bash
# Navigate to lambda directory
cd lambda/

# Authenticate Docker to ECR (replace with your account ID and region)
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com

# Initialize Terraform to create ECR repository first
cd ..
terraform init

# Apply ECR repository only
terraform apply -target=aws_ecr_repository.lambda -auto-approve

# Get ECR repository URL from output
ECR_REPO=$(terraform output -raw ecr_repository_url)

# Build container image
cd lambda/
docker build --platform linux/amd64 -t transaction-processor .

# Tag and push to ECR
docker tag transaction-processor:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest
```

### 3. Deploy Infrastructure

```bash
# Return to root directory
cd ..

# Initialize Terraform
terraform init

# Review execution plan
terraform plan

# Apply configuration
terraform apply

# Confirm SNS subscription email when prompted
```

### 4. Verify Deployment

```bash
# Get CloudWatch Dashboard URL
terraform output cloudwatch_dashboard_url

# Get X-Ray Console URL
terraform output xray_console_url

# Test Kinesis stream
aws kinesis put-record \
  --stream-name $(terraform output -raw kinesis_stream_name) \
  --partition-key "test-key" \
  --data '{"transaction_id":"txn-001","amount":1500,"type":"PURCHASE","merchant_id":"merch-123","merchant_country":"US"}'
```

## Monitoring and Observability

### CloudWatch Dashboard

Access the dashboard URL from outputs to view:
- Transaction volume and error rates
- Lambda performance metrics (duration, invocations, errors, throttles)
- Kinesis stream metrics (incoming records, iterator age)
- Dead letter queue depth
- Composite alarm status

### X-Ray Tracing

View the service map showing:
- Transaction flow from Kinesis to Lambda
- Custom segments for validation and processing
- Latency distribution
- Error traces

### CloudWatch Logs Insights Queries

Pre-configured queries available in CloudWatch Logs Insights:
- **Error-Analysis**: Top errors by count
- **Latency-Trends**: P95/P99 latency trends over time
- **Transaction-Types**: Top transaction types by volume
- **Success-Rate**: Success vs failure ratio

### Alarms

Two composite alarms monitor system health:

1. **Processing Health**: Combines error rate and latency metrics
2. **System Capacity**: Combines throttles and Kinesis iterator age

Notifications sent to SNS topic (encrypted with customer-managed KMS key).

### EventBridge Rules

Four content-based filtering rules route transactions:

1. **High-Value Transactions**: Amount > $10,000
2. **Failed Transactions**: Status = FAILED or ERROR
3. **Fraud Patterns**: Risk score > 80 from non-standard countries
4. **Velocity Checks**: Transaction count > 20 per time window

## Testing

### Generate Test Transactions

```bash
# Generate successful transaction
aws kinesis put-record \
  --stream-name transaction-stream-prod \
  --partition-key "test-1" \
  --data '{"transaction_id":"txn-001","amount":1500,"type":"PURCHASE","merchant_id":"merch-123","merchant_country":"US","transaction_count":1}'

# Generate high-value transaction (triggers EventBridge rule)
aws kinesis put-record \
  --stream-name transaction-stream-prod \
  --partition-key "test-2" \
  --data '{"transaction_id":"txn-002","amount":15000,"type":"PURCHASE","merchant_id":"merch-456","merchant_country":"US","transaction_count":1}'

# Generate failed transaction
aws kinesis put-record \
  --stream-name transaction-stream-prod \
  --partition-key "test-3" \
  --data '{"transaction_id":"txn-003","amount":-100,"type":"PURCHASE"}'
```

### Monitor Results

- Check Lambda logs: `/aws/lambda/transaction-processor-prod`
- View X-Ray traces for transaction flow
- Verify metrics in CloudWatch dashboard
- Check SNS notifications for high-value transactions

## Cost Optimization

Estimated monthly costs (eu-west-1, medium usage):

- Kinesis Data Streams (5 shards): ~$50/month
- Lambda (container): Pay per invocation (~$20-100/month)
- CloudWatch: Dashboards + alarms + logs (~$20-50/month)
- X-Ray: Traces recorded + scanned (~$10-30/month)
- SNS: Minimal (<$1/month)
- EventBridge: Minimal (<$1/month)
- KMS: $1/month
- ECR: Storage ~$0.10/GB/month

**Total**: ~$100-250/month depending on transaction volume

## Security Considerations

- SNS topics encrypted with customer-managed KMS keys
- Lambda function uses least privilege IAM role
- CloudWatch Logs encrypted at rest
- VPC endpoints recommended for private communication
- No sensitive data in environment variables
- X-Ray traces do not contain PII (ensure proper filtering in Lambda)

## Maintenance

### Update Lambda Function

```bash
# Rebuild and push container
cd lambda/
docker build --platform linux/amd64 -t transaction-processor .
docker tag transaction-processor:latest <ECR_REPO>:latest
docker push <ECR_REPO>:latest

# Update Lambda to use new image
aws lambda update-function-code \
  --function-name transaction-processor-prod \
  --image-uri <ECR_REPO>:latest
```

### Scale Kinesis Shards

```bash
# Update variable in terraform.tfvars
kinesis_shard_count = 10

# Apply changes
terraform apply
```

### Adjust Alarm Thresholds

Modify thresholds in `cloudwatch.tf` and apply:

```bash
terraform apply
```

## Troubleshooting

### Lambda Not Processing Records

1. Check Lambda logs: `/aws/lambda/transaction-processor-prod`
2. Verify event source mapping is enabled
3. Check Kinesis iterator age metric
4. Review dead letter queue for failed invocations

### Missing Metrics in Dashboard

1. Verify Lambda is emitting custom metrics to correct namespace
2. Check CloudWatch Logs for metric emission errors
3. Ensure IAM role has `cloudwatch:PutMetricData` permission

### X-Ray Traces Not Appearing

1. Verify Lambda has X-Ray tracing enabled (Active mode)
2. Check IAM role has X-Ray permissions
3. Review X-Ray sampling rules
4. Check Lambda logs for X-Ray SDK errors

### Alarms Not Triggering

1. Verify SNS subscription is confirmed (check email)
2. Check alarm evaluation periods and thresholds
3. Review CloudWatch metrics to ensure data is flowing
4. Verify SNS topic policy allows CloudWatch to publish

## Cleanup

```bash
# Destroy all resources
terraform destroy

# Manually delete ECR images if needed
aws ecr batch-delete-image \
  --repository-name transaction-processor-prod \
  --image-ids imageTag=latest
```

## Support

For issues or questions:
- Review CloudWatch Logs for detailed error messages
- Check X-Ray service map for distributed tracing insights
- Review Terraform state for resource configuration
- Consult AWS documentation for service-specific issues

## License

Internal use only - Proprietary
