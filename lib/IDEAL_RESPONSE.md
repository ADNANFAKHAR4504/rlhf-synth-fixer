# Advanced Observability Stack for Distributed Payment Processing

## Overview

This CloudFormation template deploys a comprehensive observability infrastructure for monitoring distributed payment processing systems. It provides real-time logging, metrics collection, distributed tracing, alerting, and visualization capabilities.

## Architecture

The stack consists of the following components:

### Logging Infrastructure
- **CloudWatch Log Groups**: Four separate log groups for different payment processing stages:
  - `/aws/payment/transactions-{EnvironmentSuffix}` - Payment transaction logs
  - `/aws/payment/auth-{EnvironmentSuffix}` - Authentication logs
  - `/aws/payment/settlement-{EnvironmentSuffix}` - Settlement logs
  - `/aws/payment/fraud-{EnvironmentSuffix}` - Fraud detection logs
- **Kinesis Data Stream**: Real-time log streaming with encryption
- **Kinesis Firehose**: Automated delivery of logs to OpenSearch
- **OpenSearch Domain**: Full-text search and analysis (Multi-AZ deployment)
- **S3 Bucket**: Backup storage for failed log deliveries

### Metrics and Monitoring
- **Lambda Function**: Processes logs from Kinesis and generates custom metrics:
  - Transaction success/failure counts
  - Average payment latency
  - Error rate percentage
  - Fraud detection count
- **CloudWatch Dashboards**: Real-time visualization with 8 widgets:
  - Transaction volume
  - Average latency with threshold annotations
  - Error rate with threshold annotations
  - Fraud detections
  - Lambda health metrics
  - Kinesis throughput
  - OpenSearch cluster status
  - Recent transaction logs
- **Metric Filters**: Extract metrics from log patterns:
  - Transaction errors
  - Authentication failures
  - High-value transactions (>$10,000)

### Distributed Tracing
- **X-Ray Sampling Rule**: Configured for payment service tracing
  - 10% fixed rate sampling
  - Priority 1000
  - Reservoir size of 1
- **Lambda X-Ray Integration**: Active tracing on metrics processor

### Alerting System
- **Three-Tier SNS Topics**:
  - Critical alerts (high error rate, fraud detection, OpenSearch failures)
  - Warning alerts (high latency, Lambda errors)
  - Informational alerts (for future use)
- **CloudWatch Alarms**:
  - `payment-high-error-rate-{EnvironmentSuffix}`: Triggers when error rate exceeds threshold
  - `payment-high-latency-{EnvironmentSuffix}`: Triggers when latency exceeds threshold
  - `payment-fraud-detected-{EnvironmentSuffix}`: Triggers on fraud detection
  - `metrics-processor-errors-{EnvironmentSuffix}`: Monitors Lambda errors
  - `opensearch-cluster-status-{EnvironmentSuffix}`: Monitors cluster health

### Security
- **KMS Encryption**: Customer-managed key for all log data
- **IAM Roles**: Least-privilege access for all services
- **OpenSearch Security**: Advanced security options with internal user database
- **Encryption in Transit**: TLS 1.2 minimum for all services
- **S3 Security**: Public access blocked, encryption enabled

## Prerequisites

1. **AWS Secrets Manager**: Create a secret for OpenSearch master password:
   ```bash
   aws secretsmanager create-secret \
     --name OpenSearchMasterPassword-dev \
     --secret-string '{"password":"YourSecurePassword123!"}'
   ```

   Replace `dev` with your EnvironmentSuffix value.

2. **Email Verification**: The email address provided for AlertEmail will receive a confirmation email from SNS. You must confirm the subscription to receive alerts.

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `EnvironmentSuffix` | String | dev | Environment identifier for resource naming (required) |
| `LogRetentionDays` | Number | 30 | CloudWatch Logs retention period (1-3653 days) |
| `KinesisShardCount` | Number | 2 | Number of Kinesis shards (1-10) |
| `AlertEmail` | String | alerts@example.com | Email for alert notifications |
| `HighLatencyThreshold` | Number | 1000 | High latency threshold in milliseconds |
| `ErrorRateThreshold` | Number | 5 | Error rate threshold percentage |
| `OpenSearchInstanceType` | String | t3.small.search | OpenSearch instance type |
| `OpenSearchInstanceCount` | Number | 2 | Number of OpenSearch instances (min 2 for HA) |

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name payment-observability-dev \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
    ParameterKey=LogRetentionDays,ParameterValue=30 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation in AWS Console
2. Click "Create stack" → "With new resources"
3. Upload the `TapStack.yml` template
4. Fill in the parameters:
   - **EnvironmentSuffix**: Use a unique identifier (e.g., dev, staging, prod)
   - **AlertEmail**: Your email address for alerts
   - Adjust other parameters as needed
5. Acknowledge IAM resource creation
6. Click "Create stack"

### Deployment Time

Expected deployment time: 25-30 minutes
- OpenSearch domain creation takes the longest (~20 minutes)
- Other resources typically deploy in 5-10 minutes

## Post-Deployment Steps

1. **Confirm SNS Email Subscription**:
   - Check your email inbox for confirmation emails from AWS SNS
   - Click the confirmation link in each email (Critical and Warning topics)

2. **Access OpenSearch Dashboards**:
   - Retrieve the dashboard URL from stack outputs
   - Login with username: `admin`
   - Password: From Secrets Manager (configured in prerequisites)

3. **Test the Stack**:
   - Send test logs to Kinesis stream
   - Verify metrics appear in CloudWatch
   - Check OpenSearch for indexed logs
   - Trigger test alerts

## Testing Log Ingestion

Example Python script to send test payment logs:

```python
import boto3
import json
from datetime import datetime

kinesis = boto3.client('kinesis')
stream_name = 'payment-logs-stream-dev'  # Replace with your EnvironmentSuffix

# Test successful transaction
success_log = {
    'timestamp': datetime.utcnow().isoformat(),
    'transaction_id': 'txn_12345',
    'status': 'success',
    'latency': 250,
    'amount': 99.99,
    'fraud_score': 0.1
}

kinesis.put_record(
    StreamName=stream_name,
    Data=json.dumps(success_log),
    PartitionKey='payment'
)

# Test failed transaction
failure_log = {
    'timestamp': datetime.utcnow().isoformat(),
    'transaction_id': 'txn_12346',
    'status': 'failure',
    'latency': 3500,
    'amount': 149.99,
    'fraud_score': 0.2,
    'error': 'insufficient_funds'
}

kinesis.put_record(
    StreamName=stream_name,
    Data=json.dumps(failure_log),
    PartitionKey='payment'
)

print("Test logs sent successfully")
```

## Monitoring and Operations

### CloudWatch Dashboard

Access the dashboard:
1. Go to CloudWatch Console → Dashboards
2. Select `payment-processing-{EnvironmentSuffix}`
3. View real-time metrics and logs

### Viewing Logs

**Using AWS CLI**:
```bash
# View recent transaction logs
aws logs tail /aws/payment/transactions-dev --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/payment/transactions-dev \
  --filter-pattern "ERROR"
```

**Using OpenSearch Dashboards**:
1. Navigate to OpenSearch Dashboards URL (from stack outputs)
2. Go to Discover
3. Select `payment-logs-*` index pattern
4. Use Kibana Query Language (KQL) for advanced searches

### Custom Metrics

The Lambda function generates these custom metrics in the `PaymentProcessing-{EnvironmentSuffix}` namespace:

- `TransactionSuccess` (Count): Number of successful transactions
- `TransactionFailure` (Count): Number of failed transactions
- `AverageLatency` (Milliseconds): Average transaction processing time
- `ErrorRate` (Percent): Percentage of failed transactions
- `FraudDetected` (Count): Number of fraud detections
- `TransactionErrors` (Count): From metric filter
- `AuthenticationFailures` (Count): From metric filter
- `HighValueTransactions` (Count): From metric filter (>$10,000)

### Alert Management

**View Active Alarms**:
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix payment- \
  --state-value ALARM
```

**Update Alert Thresholds**:
Update the stack with new parameter values:
```bash
aws cloudformation update-stack \
  --stack-name payment-observability-dev \
  --use-previous-template \
  --parameters \
    ParameterKey=HighLatencyThreshold,ParameterValue=1500 \
    ParameterKey=ErrorRateThreshold,ParameterValue=10 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Cost Optimization

### Estimated Monthly Costs (us-east-1, default parameters)

- **OpenSearch Domain** (2 x t3.small.search, 40GB): ~$80-100/month
- **Kinesis Data Stream** (2 shards): ~$27/month (730 hours × $0.015 per shard-hour × 2)
- **CloudWatch Logs** (30-day retention, 10GB ingested): ~$5/month
- **Lambda Invocations** (1M invocations/month): ~$0.20/month
- **Kinesis Firehose**: ~$0.03 per GB delivered
- **SNS**: First 1,000 emails free, then $0.00010 per email
- **CloudWatch Alarms**: $0.10 per alarm (~$0.50/month for 5 alarms)
- **S3 Storage**: Minimal (only failed deliveries)

**Total Estimated Cost**: ~$115-135/month (primarily OpenSearch)

### Cost Reduction Strategies

1. **Reduce OpenSearch Instance Size**: Use t3.small.search (current) instead of larger instances
2. **Lower Log Retention**: Reduce `LogRetentionDays` from 30 to 7 or 14 days
3. **Reduce Kinesis Shards**: Use 1 shard for low-volume environments
4. **Use Smaller OpenSearch Volumes**: Reduce EBS volume size if log volume is low
5. **Enable S3 Lifecycle Policies**: Already configured (90-day expiration)
6. **Use CloudWatch Logs Insights**: Instead of OpenSearch for simple queries

**Low-Cost Configuration** (~$35/month):
- 1 Kinesis shard
- 7-day log retention
- No OpenSearch (use CloudWatch Logs Insights instead)
- Basic monitoring only

## Stack Outputs

The template exports these outputs for integration with other stacks:

### Log Groups
- `PaymentTransactionLogGroupName`: CloudWatch Log Group for transactions
- `PaymentAuthLogGroupName`: CloudWatch Log Group for authentication
- `PaymentSettlementLogGroupName`: CloudWatch Log Group for settlement
- `PaymentFraudLogGroupName`: CloudWatch Log Group for fraud detection

### Alerting
- `CriticalAlertTopicArn`: SNS Topic for critical alerts
- `WarningAlertTopicArn`: SNS Topic for warning alerts
- `InfoAlertTopicArn`: SNS Topic for informational alerts

### Streaming and Search
- `LogStreamName`: Kinesis Data Stream name
- `LogStreamArn`: Kinesis Data Stream ARN
- `OpenSearchDomainEndpoint`: OpenSearch domain endpoint
- `OpenSearchDashboardUrl`: OpenSearch Dashboards URL

### Monitoring
- `DashboardUrl`: CloudWatch Dashboard URL
- `XRayServiceName`: X-Ray service name for tracing
- `MetricsProcessorFunctionArn`: Lambda function ARN

### Storage and Security
- `LogBackupBucketName`: S3 bucket for log backups
- `LogEncryptionKeyId`: KMS key for log encryption

## Integration with Applications

### Send Logs to CloudWatch Log Groups

```python
import boto3
import json
from datetime import datetime

logs = boto3.client('logs')
log_group = '/aws/payment/transactions-dev'
log_stream = 'application-logs'

# Create log stream if not exists
try:
    logs.create_log_stream(logGroupName=log_group, logStreamName=log_stream)
except logs.exceptions.ResourceAlreadyExistsException:
    pass

# Send log event
log_event = {
    'timestamp': int(datetime.utcnow().timestamp() * 1000),
    'message': json.dumps({
        'transaction_id': 'txn_789',
        'status': 'success',
        'latency': 340,
        'amount': 250.00
    })
}

logs.put_log_events(
    logGroupName=log_group,
    logStreamName=log_stream,
    logEvents=[log_event]
)
```

### Send Logs to Kinesis Stream

```python
import boto3
import json

kinesis = boto3.client('kinesis')

log_data = {
    'transaction_id': 'txn_456',
    'status': 'failure',
    'latency': 5200,
    'fraud_score': 0.95
}

kinesis.put_record(
    StreamName='payment-logs-stream-dev',
    Data=json.dumps(log_data),
    PartitionKey='partition-key'
)
```

### Enable X-Ray Tracing in Your Application

For Python applications using AWS SDK:

```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK and HTTP libraries
patch_all()

# Configure service name (matches the sampling rule)
xray_recorder.configure(service='payment-service-dev')

@xray_recorder.capture('process_payment')
def process_payment(transaction_data):
    # Your payment processing logic
    pass
```

## Troubleshooting

### OpenSearch Domain Creation Fails

**Problem**: Stack fails during OpenSearch domain creation
**Solution**:
- Ensure the secret `OpenSearchMasterPassword-{EnvironmentSuffix}` exists in Secrets Manager
- Check password meets complexity requirements (min 8 characters, uppercase, lowercase, number, special char)

### No Metrics Appearing in CloudWatch

**Problem**: Custom metrics not showing up in CloudWatch
**Solution**:
1. Check Lambda function logs: `/aws/lambda/metrics-processor-{EnvironmentSuffix}`
2. Verify Kinesis stream has incoming records
3. Ensure log data format matches expected structure (status, latency, fraud_score fields)

### Kinesis Firehose Delivery Failures

**Problem**: Logs not appearing in OpenSearch
**Solution**:
1. Check Firehose logs: `/aws/kinesisfirehose/payment-logs-{EnvironmentSuffix}`
2. Verify OpenSearch domain is healthy (check cluster status alarm)
3. Check S3 backup bucket for failed deliveries
4. Verify IAM roles have correct permissions

### SNS Alerts Not Received

**Problem**: Not receiving alert emails
**Solution**:
1. Confirm SNS subscription via email
2. Check spam/junk folder
3. Verify alarm state in CloudWatch Console
4. Test SNS topic directly:
   ```bash
   aws sns publish \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT:payment-critical-alerts-dev \
     --message "Test alert"
   ```

## Stack Deletion

To delete the stack and all resources:

```bash
# Empty S3 bucket first (if it has content)
aws s3 rm s3://payment-logs-backup-dev-ACCOUNT_ID --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name payment-observability-dev

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name payment-observability-dev
```

**Note**: All resources have `DeletionPolicy: Delete`, so they will be permanently removed. Ensure you have backups if needed.

## Compliance and Security

### PCI-DSS Compliance

- **Log Retention**: Configurable retention periods (default 30 days)
- **Encryption**: All logs encrypted at rest with KMS
- **Access Control**: IAM policies enforce least-privilege access
- **Audit Trail**: CloudWatch Logs track all API calls
- **Network Security**: OpenSearch uses HTTPS with TLS 1.2+

### Security Best Practices

1. **Rotate OpenSearch Password**: Change the master password in Secrets Manager regularly
2. **Review IAM Policies**: Audit and tighten permissions as needed
3. **Enable CloudTrail**: For comprehensive audit logging
4. **Use VPC**: For production, deploy OpenSearch in VPC
5. **Restrict S3 Access**: Review S3 bucket policies
6. **Monitor Security Metrics**: Set up additional alarms for security events

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review CloudWatch alarms and dashboard metrics
2. **Monthly**: Check OpenSearch disk usage and adjust if needed
3. **Quarterly**: Review and optimize log retention policies
4. **Quarterly**: Review and update alert thresholds based on trends
5. **Annually**: Audit IAM roles and permissions

### Scaling Considerations

**Increase Kinesis Capacity**:
- Update `KinesisShardCount` parameter
- Each shard supports up to 1MB/s or 1,000 records/s ingestion

**Scale OpenSearch**:
- Increase `OpenSearchInstanceCount` for more capacity
- Change `OpenSearchInstanceType` to larger instances
- Monitor cluster metrics in CloudWatch

**Optimize Lambda Function**:
- Increase memory allocation if processing takes too long
- Adjust batch size and batching window for event source mapping

## Additional Resources

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [Amazon OpenSearch Service Documentation](https://docs.aws.amazon.com/opensearch-service/)
- [Amazon Kinesis Documentation](https://docs.aws.amazon.com/kinesis/)
- [AWS Well-Architected Framework - Observability](https://docs.aws.amazon.com/wellarchitected/latest/framework/operational-excellence.html)

## License

This CloudFormation template is provided as-is for educational and commercial use.