# Cross-Account Observability Infrastructure

Production-ready Pulumi infrastructure for cross-account monitoring and automated incident response.

## Overview

This infrastructure creates a comprehensive observability platform that:

- Aggregates CloudWatch metrics from multiple AWS accounts
- Automatically creates JIRA tickets when critical alarms trigger
- Sends email notifications via SNS
- Tracks application errors with CloudWatch Logs metric filters
- Provides API throttling analysis with Contributor Insights
- Maintains an audit trail of all alarm state changes

## Architecture

### Components

1. **CloudWatch Dashboard**: Centralized view of metrics from all member accounts
2. **Lambda Function**: Automated JIRA ticket creation (128MB memory)
3. **SNS Topic**: Alert notifications with AWS managed encryption
4. **CloudWatch Logs**: 30-day retention with exact pattern metric filters
5. **Cross-Account IAM Roles**: Least privilege access following MonitoringRole-{AccountId} pattern
6. **Composite Alarms**: Multi-condition alerting
7. **Contributor Insights**: API throttling analysis
8. **EventBridge Rules**: Alarm state change audit trail

## Prerequisites

- AWS Organizations with at least 3 member accounts
- CloudFormation StackSets enabled in management account
- Pulumi CLI installed
- Python 3.9 or later
- AWS credentials configured
- VPC endpoints for CloudWatch and SNS in each account
- CloudWatch agent installed on EC2 instances in member accounts

## Configuration

### Required Configuration

Set the following configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set env dev  # or prod, staging, etc.
```

### Environment Variables

Set the following environment variables or pass them to the stack:

- `ENVIRONMENT_SUFFIX`: Deployment environment (e.g., 'dev', 'prod')
- `JIRA_URL`: Your JIRA instance URL
- `JIRA_API_TOKEN`: JIRA API token (use AWS Secrets Manager in production)

## Deployment

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy stack
pulumi up

# View outputs
pulumi stack output
```

### Configuration Example

Modify `tap.py` to configure member accounts:

```python
from lib.tap_stack import TapStack, TapStackArgs

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        member_account_ids=[
            '123456789012',  # Account 1
            '234567890123',  # Account 2
            '345678901234',  # Account 3
        ],
        alert_email='ops@example.com',
        jira_url='https://yourcompany.atlassian.net',
        jira_api_token='your-api-token'
    ),
)
```

## Testing

Run unit tests:

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_tap_stack.py

# Run with coverage
python -m pytest --cov=lib tests/
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `monitoring-alerts-dev`
- `application-logs-prod`
- `jira-ticket-creator-staging`

## Constraints and Requirements

### Mandatory Constraints

- **Metric Filters**: Must use exact pattern matching (no wildcards)
- **SNS Encryption**: AWS managed keys only (alias/aws/sns)
- **Lambda Memory**: Exactly 128MB
- **Dashboard**: Must display metrics from at least 3 accounts
- **Alarm Configuration**: treat_missing_data must be 'breaching'
- **Log Retention**: 30 days for all log groups
- **IAM Role Naming**: MonitoringRole-{AccountId}
- **No Retain Policies**: All resources must be destroyable

### Multi-Account Setup

1. Deploy StackSets to member accounts for:
   - Cross-account IAM roles
   - VPC endpoints for CloudWatch and SNS
   - CloudWatch agent configuration

2. Configure cross-account access:
   - Trust relationships between monitoring and member accounts
   - External ID: `monitoring-{environment_suffix}`

## Outputs

After deployment, the following outputs are available:

- `sns_topic_arn`: ARN of the SNS topic for alerts
- `lambda_function_arn`: ARN of the JIRA ticket creator Lambda
- `dashboard_name`: Name of the CloudWatch dashboard
- `log_group_name`: Name of the application log group

## Monitoring and Alerts

### Alarm Hierarchy

1. **Metric Alarms**: Individual metric thresholds
2. **Composite Alarms**: Multiple condition triggers
3. **SNS Notifications**: Email and Lambda delivery
4. **JIRA Tickets**: Automated incident creation

### Alarm Actions

When an alarm triggers:
1. SNS notification sent to email subscribers
2. Lambda function invoked
3. JIRA ticket created with alarm details
4. EventBridge captures state change for audit

## Security

### IAM Policies

- Least privilege access for all roles
- Cross-account roles with external ID validation
- Lambda execution role with minimal permissions

### Encryption

- SNS topics encrypted with AWS managed keys
- CloudWatch Logs encrypted at rest
- No custom KMS keys required

## Troubleshooting

### Lambda Function Logs

```bash
aws logs tail /aws/lambda/jira-ticket-creator-{env} --follow
```

### CloudWatch Dashboard

Access dashboard in AWS Console:
- Navigate to CloudWatch > Dashboards
- Select `observability-dashboard-{environment_suffix}`

### Common Issues

1. **JIRA tickets not creating**: Check Lambda environment variables and JIRA API token
2. **Missing metrics**: Verify cross-account IAM roles are properly configured
3. **Alarm not triggering**: Check metric filter patterns and alarm thresholds

## Cost Optimization

This implementation uses serverless and pay-per-use services:

- Lambda: 128MB memory, pay per invocation
- CloudWatch: Pay for metrics, alarms, and dashboard
- SNS: Pay per notification
- EventBridge: Pay per event

Estimated monthly cost: $50-200 depending on alarm volume and metric count.

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are created without Retain policies for easy cleanup.

## References

- [AWS CloudWatch Cross-Account Observability](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Unified-Cross-Account.html)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [CloudWatch Contributor Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContributorInsights.html)
