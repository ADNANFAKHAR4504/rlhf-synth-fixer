# Deployment Guide

## Prerequisites

Before deploying this infrastructure, make sure you have:

1. AWS CLI installed and configured with valid credentials
2. Terraform version 1.4.0 or higher
3. Access to an AWS account with sufficient permissions
4. S3 bucket for Terraform state storage
5. Valid email addresses for alert notifications

## Configuration

### Setting Up Environment Variables

The infrastructure uses environment suffix to prevent naming conflicts:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
```

### Terraform Variables

Create a `terraform.tfvars` file or set variables via environment:

```bash
export TF_VAR_environment_suffix="dev"
export TF_VAR_aws_region="us-east-1"
export TF_VAR_alert_email_addresses='["ops@example.com"]'
```

## Deployment Steps

### Initialize Terraform

Navigate to the lib directory and initialize:

```bash
cd lib
terraform init
```

### Review the Plan

Check what resources will be created:

```bash
terraform plan
```

### Apply Configuration

Deploy the infrastructure:

```bash
terraform apply
```

Terraform will prompt for confirmation. Type `yes` to proceed.

### Verify Deployment

After deployment completes, check the outputs:

```bash
terraform output
```

You should see:

- API Gateway invoke URL
- CloudWatch dashboard URL
- Lambda function names
- RDS endpoint
- DynamoDB table name
- SNS topic ARN

## Post-Deployment

### Confirm SNS Subscriptions

Check your email for SNS subscription confirmation messages. Click the confirmation link in each email to activate alerts.

### Test API Gateway

Test the health endpoint:

```bash
curl https://your-api-gateway-url/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00.000Z",
  "service": "cloudwatch-analytics-api"
}
```

### Access CloudWatch Dashboard

Open the dashboard URL from the outputs to view metrics in real-time.

## Monitoring

The system automatically collects and aggregates metrics every 5 minutes. You can monitor:

- API Gateway request count and latency
- Lambda function invocations and errors
- RDS CPU utilization and connections

## Troubleshooting

### Email Alerts Not Received

Check your spam folder and verify the email addresses in your variables.

### Lambda Function Errors

View Lambda logs in CloudWatch:

```bash
aws logs tail /aws/lambda/your-function-name --follow
```

### RDS Connection Issues

Verify the security group allows traffic from Lambda functions.

### Metric Aggregation Not Working

Check EventBridge rule is enabled:

```bash
aws events describe-rule --name your-rule-name
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Warning: This permanently deletes all data and resources.

## Cost Considerations

This infrastructure incurs costs for:

- RDS instance (db.t3.small)
- Lambda invocations
- API Gateway requests
- DynamoDB storage
- CloudWatch metrics and logs
- Data transfer

Estimated monthly cost: 50-100 USD depending on usage.

## Security Notes

- Database credentials are stored in Terraform state
- Use AWS Secrets Manager for production environments
- Rotate database passwords regularly
- Review IAM policies periodically
- Enable MFA for AWS account access
