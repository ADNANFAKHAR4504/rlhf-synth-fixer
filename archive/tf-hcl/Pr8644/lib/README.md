# Payment Processing Observability Platform

Enterprise-grade observability infrastructure for payment processing systems using Terraform.

## Architecture Overview

This Terraform configuration deploys a comprehensive observability stack including:

- **Centralized Logging**: CloudWatch log groups with encryption and retention policies
- **Distributed Tracing**: X-Ray sampling rules for transaction tracing
- **Metrics & Dashboards**: CloudWatch dashboards for payment KPIs
- **Alerting**: CloudWatch alarms with SNS notifications
- **Audit Logging**: CloudTrail for AWS API tracking
- **Event Management**: EventBridge rules for automated incident response
- **Compliance**: AWS Config rules and Security Hub integration
- **Operational Parameters**: Systems Manager parameter store

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions for CloudWatch, X-Ray, CloudTrail, Config, Security Hub

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Create `terraform.tfvars` file:

```hcl
environment_suffix       = "prod-abc123"
aws_region              = "us-east-1"
log_retention_days      = 14
xray_sampling_percentage = 0.1
alert_email             = "ops-team@example.com"
enable_security_hub     = true
enable_config           = true
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

### 5. Confirm SNS Subscriptions

After deployment, check your email for SNS subscription confirmation links and confirm them to receive alerts.

## Resource Naming

All resources include the `environment_suffix` variable for uniqueness:
- CloudWatch Log Groups: `/aws/payment-api-${environment_suffix}`
- SNS Topics: `payment-alerts-${environment_suffix}`
- S3 Buckets: `cloudtrail-logs-${environment_suffix}`

## AWS Services Used

- **CloudWatch**: Logs, metrics, dashboards, alarms
- **X-Ray**: Distributed tracing with sampling rules
- **CloudTrail**: API audit logging
- **EventBridge**: Event-driven alerting
- **SNS**: Multi-channel notifications
- **Systems Manager**: Parameter storage
- **AWS Config**: Resource configuration tracking
- **Security Hub**: Centralized security findings
- **KMS**: Encryption key management
- **S3**: Log storage with lifecycle policies

## Security Features

- **Encryption**: All logs encrypted at rest with KMS
- **IAM**: Least privilege roles for all services
- **S3**: Public access blocked, versioning enabled
- **CloudTrail**: Log file validation enabled
- **Compliance**: PCI DSS and CIS AWS Foundations standards

## Cost Optimization

- Log retention: 14 days (configurable 7-30 days)
- X-Ray sampling: 10% of requests (configurable 5-10%)
- Lifecycle policies: S3 logs expire after 90 days
- Serverless architecture: No EC2 instances or NAT gateways

## CloudWatch Dashboard

Access the payment operations dashboard:
1. Navigate to CloudWatch Console
2. Select "Dashboards"
3. Open `payment-operations-${environment_suffix}`

Dashboard includes:
- Transaction volume (total, successful, failed)
- Latency distribution (p50, p95, p99)
- Error metrics (total, authorization, gateway)
- Recent error logs

## Alerting Configuration

Three CloudWatch alarms are configured:

1. **High Error Rate**: Triggers when errors exceed 10 in 5 minutes
2. **High Latency**: Triggers when average latency exceeds 500ms
3. **Failed Transactions**: Triggers when failed transactions exceed 5 per minute

All alarms send notifications to the `payment-alerts-${environment_suffix}` SNS topic.

## Security Monitoring

EventBridge rules monitor:
- AWS Config compliance changes
- Unauthorized API calls (AccessDenied, UnauthorizedOperation)

Security alerts sent to `security-alerts-${environment_suffix}` SNS topic.

## X-Ray Tracing

Two sampling rules configured:

1. **Payment Transactions** (priority 1000): 10% sampling for `/api/payment/*` POST requests
2. **Default Sampling** (priority 5000): 5% sampling for all other requests

Configure sampling rate via `xray_sampling_percentage` variable or SSM parameter.

## AWS Config Rules

Three compliance rules enabled:
- `encrypted-volumes`: Ensures EBS volumes are encrypted
- `s3-bucket-encryption`: Ensures S3 buckets have encryption
- `iam-password-policy`: Validates IAM password policy

## Systems Manager Parameters

Operational parameters stored in SSM:
- `/observability/${environment_suffix}/xray/sampling-rate`
- `/observability/${environment_suffix}/logs/retention-days`
- `/observability/${environment_suffix}/alerts/latency-threshold-ms`

## Log Analysis Examples

### Query recent errors in payment API:

```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

### Query transactions by latency:

```
fields @timestamp, transaction_id, latency
| filter latency > 500
| sort latency desc
| limit 50
```

### Query failed payment transactions:

```
fields @timestamp, transaction_id, error_code, error_message
| filter status = "failed"
| stats count() by error_code
```

## Troubleshooting

### CloudTrail not logging

- Verify S3 bucket policy allows CloudTrail service
- Check trail is enabled: `aws cloudtrail get-trail-status`

### Config recorder not starting

- Verify IAM role has `AWS_ConfigRole` managed policy
- Check S3 bucket permissions for Config service

### Alarms not triggering

- Verify SNS email subscriptions are confirmed
- Check metrics are being published to CloudWatch
- Review alarm thresholds and evaluation periods

### Security Hub standards not enabling

- Ensure Security Hub is enabled in the region
- Check IAM permissions for Security Hub management
- Standards may take 15-30 minutes to fully enable

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: S3 buckets with objects must be emptied manually before destruction.

## Integration with Applications

### Publishing Custom Metrics

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_data(
    Namespace='PaymentProcessing',
    MetricData=[
        {
            'MetricName': 'TransactionCount',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'Environment', 'Value': 'prod-abc123'}
            ]
        }
    ]
)
```

### Enabling X-Ray Tracing

For Lambda functions:
```python
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture('process_payment')
def process_payment(event):
    # Your payment logic
    pass
```

For API Gateway:
- Enable X-Ray tracing in API Gateway stage settings

### Writing Application Logs

Configure application to write to CloudWatch log groups:
- `/aws/payment-api-${environment_suffix}`
- `/aws/payment-processor-${environment_suffix}`
- `/aws/payment-database-${environment_suffix}`

## Compliance Notes

### PCI DSS Compliance

This observability platform supports PCI DSS requirements:
- Requirement 10.2: Audit logs for security events (CloudTrail)
- Requirement 10.3: Audit trail entries (CloudWatch Logs)
- Requirement 10.5: Secure audit trails (KMS encryption)
- Requirement 10.6: Review logs (CloudWatch dashboards)

### Data Retention

- CloudWatch Logs: 14 days (configurable)
- CloudTrail S3: 90 days (lifecycle policy)
- Config S3: Indefinite (configure lifecycle as needed)

## Outputs

After deployment, Terraform outputs include:
- CloudWatch log group names
- SNS topic ARNs for alerts
- Dashboard name
- KMS key ID
- Config recorder name
- SSM parameter names

Use outputs for application integration:
```bash
terraform output payment_api_log_group
terraform output payment_alerts_topic_arn
```

## Support

For issues or questions:
1. Review CloudWatch Logs for error details
2. Check AWS Config compliance dashboard
3. Review Security Hub findings
4. Consult Terraform state: `terraform state list`