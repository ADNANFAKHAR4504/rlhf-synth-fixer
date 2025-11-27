# Multi-Region Disaster Recovery Infrastructure

This CDKTF Python implementation creates a multi-region disaster recovery infrastructure for a payment processing system.

## Architecture

The infrastructure spans two AWS regions:
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2

### Components

1. **DynamoDB Global Table**: Automatically replicates payment transaction data between regions
2. **S3 Cross-Region Replication**: Replicates audit logs and receipts from primary to secondary region
3. **Lambda Functions**: Payment processing functions deployed in both regions
4. **Route53 Failover**: DNS-based automatic failover from primary to secondary region
5. **CloudWatch Monitoring**: Alarms and metrics for both regions
6. **SNS Notifications**: Alert notifications for failover events

## Prerequisites

- Python 3.11 or higher
- CDKTF CLI installed
- AWS credentials configured
- Terraform installed

## Deployment

### 1. Install Dependencies

```bash
pipenv install
```

### 2. Set Environment Suffix

```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
```

### 3. Deploy Infrastructure

```bash
cdktf deploy
```

### 4. Test Failover

To test the failover mechanism:

```bash
# Trigger an alarm in the primary region to simulate failure
aws cloudwatch set-alarm-state \
  --alarm-name payment-lambda-errors-primary-$ENVIRONMENT_SUFFIX \
  --state-value ALARM \
  --state-reason "Testing failover" \
  --region us-east-1

# Verify traffic routes to secondary region
# Check Route53 health check status
aws route53 get-health-check-status --health-check-id <health-check-id>
```

## Monitoring

### CloudWatch Dashboards

Access CloudWatch dashboards in both regions to monitor:
- Lambda invocations and errors
- DynamoDB read/write capacity
- S3 replication lag
- Route53 health check status

### SNS Notifications

Subscribe to SNS topics to receive alerts:

```bash
# Primary region
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:payment-notifications-primary-$ENVIRONMENT_SUFFIX \
  --protocol email \
  --notification-endpoint your-email@example.com

# Secondary region
aws sns subscribe \
  --topic-arn arn:aws:sns:us-west-2:ACCOUNT:payment-notifications-secondary-$ENVIRONMENT_SUFFIX \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured to be fully destroyable without manual intervention.

## Resource Naming Convention

All resources follow the naming pattern: `{resource-type}-{purpose}-{environment-suffix}`

Example:
- DynamoDB: `payments-table-dev`
- S3 Bucket: `payment-audit-primary-dev`
- Lambda: `payment-processor-primary-dev`

## Security

- All data is encrypted at rest
- IAM roles follow least privilege principle
- Cross-region replication uses secure IAM policies
- Lambda functions have minimal required permissions
