# Payment Processing API Infrastructure

This CDK application deploys a resilient payment processing API infrastructure with disaster recovery capabilities in AWS us-east-1 region.

## Architecture

The infrastructure includes the following components:

### API Layer
- **API Gateway REST API**: Handles incoming payment requests with throttling (1000 requests/sec, 2000 burst)
- Three endpoints: `/validate`, `/process`, and `/health`
- CloudWatch logging and metrics enabled

### Processing Layer
- **Payment Validation Lambda**: Validates payment requests and stores them in DynamoDB
- **Payment Processing Lambda**: Processes validated payments and updates transaction status
- **Health Monitor Lambda**: Monitors system health and triggers recovery actions
- All Lambda functions use Python 3.11 runtime with CloudWatch Logs retention

### Data Layer
- **DynamoDB Table**: Stores transaction data with on-demand billing
- Point-in-time recovery enabled for disaster recovery
- CloudWatch alarms for throttling detection

### Queue Management
- **SQS Queue**: Handles failed transactions for async processing
- **Dead Letter Queue**: Captures messages that fail processing after 3 attempts
- 14-day message retention

### Monitoring & Alerts
- **CloudWatch Alarms**: Monitor API latency, Lambda errors, and DynamoDB throttles
- **SNS Topic**: Sends notifications for critical events
- **CloudWatch Dashboard**: Visualizes key metrics across all components

### Security
- IAM roles with least privilege access for all Lambda functions
- Proper resource-based policies for service integration

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9 or higher
- Node.js 14.x or higher

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Lambda function dependencies:
```bash
cd lib/lambda/validation && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/processing && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/health_monitor && pip install -r requirements.txt -t . && cd ../../..
```

## Deployment

1. Set your environment suffix (required for unique resource naming):
```bash
export ENVIRONMENT_SUFFIX="dev-001"
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

3. Synthesize the CloudFormation template:
```bash
cdk synth -c environmentSuffix=$ENVIRONMENT_SUFFIX
```

4. Deploy the stack:
```bash
cdk deploy -c environmentSuffix=$ENVIRONMENT_SUFFIX
```

The deployment will output:
- API Gateway endpoint URL
- DynamoDB table name
- SNS topic ARN
- CloudWatch dashboard name

## Testing

### Test Payment Validation

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/validate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "customer_id": "cust-12345"
  }'
```

Expected response:
```json
{
  "message": "Payment validated successfully",
  "transaction_id": "uuid-here",
  "status": "validated"
}
```

### Test Payment Processing

```bash
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/process \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "uuid-from-validation"
  }'
```

Expected response:
```json
{
  "message": "Payment processed successfully",
  "transaction_id": "uuid-here",
  "status": "processed",
  "processed_at": "2025-11-18T12:00:00.000Z"
}
```

### Test Health Check

```bash
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/health
```

Expected response:
```json
{
  "timestamp": "2025-11-18T12:00:00.000Z",
  "overall_status": "healthy",
  "checks": [
    {
      "service": "API Gateway",
      "metric": "latency",
      "value": 150,
      "threshold": 1000,
      "status": "healthy"
    }
  ]
}
```

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard to view:
- API Gateway latency trends
- Lambda function error rates
- DynamoDB read/write capacity usage
- SQS queue depth and DLQ messages

Navigate to CloudWatch → Dashboards → `payment-dashboard-{environment_suffix}`

### CloudWatch Alarms

The following alarms are configured:
- **API Latency**: Triggers when average latency exceeds 1000ms over 5 minutes
- **Lambda Errors**: Triggers when error count exceeds 10 over 5 minutes (per function)
- **DynamoDB Throttles**: Triggers when throttle count exceeds 10 over 5 minutes

All alarms send notifications to the SNS topic.

### SNS Notifications

Subscribe to the alarm topic to receive email notifications:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:payment-alarms-{environment_suffix} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Disaster Recovery

### Point-in-Time Recovery (PITR)

DynamoDB PITR is enabled by default. To restore:

1. Create a new table from backup:
```bash
aws dynamodb restore-table-to-point-in-time \
  --source-table-name transactions-{environment_suffix} \
  --target-table-name transactions-{environment_suffix}-restored \
  --restore-date-time 2025-11-18T12:00:00Z
```

2. Update Lambda environment variables to point to restored table

### Failed Transaction Recovery

Failed transactions are automatically sent to SQS for retry:
1. Check failed queue: `failed-transactions-{environment_suffix}`
2. Check DLQ: `failed-transactions-dlq-{environment_suffix}`
3. Messages in DLQ require manual investigation

## Resource Cleanup

To destroy all resources:

```bash
cdk destroy -c environmentSuffix=$ENVIRONMENT_SUFFIX
```

Confirm the deletion when prompted. All resources will be removed without manual intervention.

## Cost Optimization

This infrastructure uses serverless and pay-per-use services:
- **DynamoDB**: On-demand billing (no idle costs)
- **Lambda**: Pay per invocation
- **API Gateway**: Pay per request
- **SQS**: Free tier covers most use cases
- **CloudWatch**: Basic metrics and alarms included

Estimated monthly cost for low-moderate traffic: $20-50

## Security Best Practices

- All Lambda functions have least privilege IAM roles
- API Gateway CloudWatch logging enabled
- DynamoDB point-in-time recovery enabled
- No public access to SQS queues or DynamoDB tables
- All resources tagged with Environment tag

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/payment-validation-{environment_suffix} --follow
```

### DynamoDB Throttling

If throttling alarms trigger:
1. Check CloudWatch metrics for traffic patterns
2. DynamoDB on-demand billing should auto-scale
3. Verify application isn't making inefficient queries

### API Gateway 5XX Errors

1. Check Lambda function logs for errors
2. Verify Lambda has correct IAM permissions
3. Check API Gateway CloudWatch logs

## Contributing

When making changes:
1. Update Lambda function code in `lib/lambda/`
2. Test locally if possible
3. Deploy with `cdk deploy`
4. Monitor CloudWatch dashboard for issues

## Support

For issues or questions:
- Check CloudWatch Logs for Lambda functions
- Review CloudWatch Alarms for triggered alerts
- Check SNS topic for notification history
