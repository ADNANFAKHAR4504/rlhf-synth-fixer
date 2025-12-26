# CloudWatch Monitoring Infrastructure for Payment Processing

This Terraform configuration deploys comprehensive CloudWatch monitoring for fintech payment processing services.

## Features

- **CloudWatch Log Groups**: Encrypted log storage for payment-api, transaction-processor, and fraud-detector services
- **Metric Filters**: Extract error rates, response times, transaction amounts, and Lambda metrics from JSON logs
- **CloudWatch Alarms**: Monitor API error rates, response times, and failed transactions
- **Composite Alarm**: Multi-service failure detection
- **SNS Notifications**: Email alerts for alarm state changes
- **CloudWatch Dashboard**: 3-column layout with service health, transaction trends, and error distribution
- **Custom Metrics**: Business KPIs including successful_payments_per_minute and average_transaction_value
- **Auto Scaling Integration**: Automatic capacity increases on high load
- **Log Insights Queries**: Saved searches for incident investigation

## Prerequisites

- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- Existing KMS key with alias `alias/cloudwatch-logs`
- Auto Scaling group for high-load response integration

## Deployment

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   ```hcl
   environment_suffix = "dev-001"
   alert_email        = "your-email@example.com"
   ```

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the execution plan:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Outputs

- `dashboard_url`: Direct link to CloudWatch dashboard
- `sns_topic_arn`: ARN for integration with external alerting systems
- `log_group_names`: Log group names for application configuration
- `alarm_names`: Alarm names for reference
- `custom_metric_namespaces`: Metric namespaces for publishing custom metrics

## Custom Metrics

To publish custom metrics from your application:

```python
import boto3

cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')

cloudwatch.put_metric_data(
    Namespace='FinTech/TransactionProcessor/prod',
    MetricData=[
        {
            'MetricName': 'TransactionAmount',
            'Value': 150.00,
            'Unit': 'None'
        }
    ]
)
```

## Log Format

Ensure your application logs are in JSON format for metric filter extraction:

```json
{
  "timestamp": "2025-12-05T10:30:00Z",
  "level": "ERROR",
  "message": "Payment processing failed",
  "transactionId": "txn-12345",
  "responseTime": 450,
  "transactionAmount": 100.50,
  "status": "FAILED"
}
```

## Alarm Thresholds

- **API Error Rate**: > 1% (2 evaluation periods)
- **Response Time**: > 500ms average (2 evaluation periods)
- **Failed Transactions**: > 5 per minute (1 evaluation period)
- **Composite Alarm**: 2 or more service alarms in ALARM state

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Cost Optimization

This configuration uses cost-effective CloudWatch features:
- 7-day log retention to minimize storage costs
- Metric filters instead of continuous queries
- Efficient dashboard with metric math expressions
- Consolidated SNS topic for all notifications
