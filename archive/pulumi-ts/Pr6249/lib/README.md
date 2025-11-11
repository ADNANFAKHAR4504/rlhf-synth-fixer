# Serverless Transaction Processing System

A production-ready serverless transaction processing system built with Pulumi and TypeScript, designed for a fintech startup to handle credit card transactions with PCI compliance.

## Architecture

### Components

1. **API Gateway REST API**
   - Endpoint: POST /transactions
   - HTTPS only
   - Integrated with Lambda receiver

2. **Lambda Functions**
   - **transaction-receiver**: Receives transactions from API Gateway and queues them
   - **transaction-processor**: Processes transactions from SQS queue
   - **transaction-validator**: Validates transaction data
   - Runtime: Node.js 18.x
   - Memory: 512MB
   - X-Ray tracing enabled

3. **SQS Queue**
   - Name: transaction-queue-{environmentSuffix}
   - Visibility timeout: 300 seconds
   - Server-side encryption enabled
   - Buffering for high-volume processing

4. **DynamoDB Table**
   - Name: transactions-{environmentSuffix}
   - Partition key: transactionId
   - Sort key: timestamp
   - Encryption at rest enabled
   - Point-in-time recovery enabled

5. **SNS Topic**
   - Name: transaction-notifications-{environmentSuffix}
   - Publishes transaction status updates

6. **CloudWatch Monitoring**
   - Log groups with 30-day retention
   - Alarms for queue depth, Lambda errors, API errors

7. **IAM Roles**
   - Least-privilege roles for each Lambda function
   - Separate policies for SQS, DynamoDB, SNS access

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix dev
```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the changes and confirm to proceed.

## Configuration

### Environment Variables

Set the environment suffix for resource naming:

```bash
pulumi config set environmentSuffix <your-suffix>
```

### AWS Region

The infrastructure is deployed to ap-southeast-1 by default. This is hardcoded in the stack.

## Testing

### Unit Tests

Run the unit tests:

```bash
npm test
```

### Integration Tests

After deployment, test the API endpoint:

```bash
# Get the API endpoint
API_ENDPOINT=$(pulumi stack output apiEndpoint)

# Send a test transaction
curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-12345678901",
    "amount": 99.99,
    "cardNumber": "1234567890123456"
  }'
```

## Monitoring

### CloudWatch Logs

View Lambda function logs:

```bash
aws logs tail /aws/lambda/transaction-receiver-{environmentSuffix} --follow
aws logs tail /aws/lambda/transaction-processor-{environmentSuffix} --follow
aws logs tail /aws/lambda/transaction-validator-{environmentSuffix} --follow
```

### CloudWatch Alarms

The following alarms are configured:

- **queue-depth-alarm**: Triggers when SQS queue depth exceeds 1000 messages
- **receiver-error-alarm**: Triggers when receiver Lambda errors exceed 10 in 5 minutes
- **processor-error-alarm**: Triggers when processor Lambda errors exceed 10 in 5 minutes
- **api-4xx-alarm**: Triggers when API Gateway 4xx errors exceed 50 in 5 minutes
- **api-5xx-alarm**: Triggers when API Gateway 5xx errors exceed 10 in 5 minutes

### X-Ray Tracing

View distributed traces in AWS X-Ray console to analyze performance and debug issues.

## Performance

The system is designed to handle:

- **Peak load**: 10,000 transactions per minute
- **Auto-scaling**: Lambda automatically scales based on demand
- **Buffering**: SQS queue handles traffic spikes
- **Processing**: Asynchronous processing prevents API timeouts

## Security

### PCI Compliance Features

- DynamoDB encryption at rest
- SQS server-side encryption
- HTTPS-only API endpoints
- Least-privilege IAM roles
- No hardcoded credentials

### IAM Policies

Each Lambda function has a dedicated IAM role with minimal permissions:

- **Receiver**: SQS SendMessage
- **Processor**: SQS Receive/Delete, DynamoDB PutItem, SNS Publish, Lambda Invoke
- **Validator**: CloudWatch Logs only

## Cleanup

Remove all infrastructure:

```bash
pulumi destroy
```

Confirm the deletion when prompted.

## Troubleshooting

### Common Issues

1. **API Gateway returns 403**
   - Check Lambda permission for API Gateway invocation
   - Verify API Gateway deployment is complete

2. **Messages stuck in SQS queue**
   - Check processor Lambda errors in CloudWatch Logs
   - Verify event source mapping is active

3. **DynamoDB write failures**
   - Check processor IAM role permissions
   - Verify table exists and is active

## Cost Optimization

The infrastructure uses serverless services to minimize costs:

- Lambda charges only for execution time
- DynamoDB on-demand billing (no idle capacity costs)
- SQS charges per million requests
- API Gateway charges per million requests

Expected costs for 10,000 transactions/minute during business hours (8 hours/day):

- Lambda: ~$50-100/month
- DynamoDB: ~$30-50/month
- SQS: ~$10-20/month
- API Gateway: ~$20-40/month
- CloudWatch Logs: ~$5-10/month

Total: ~$115-220/month

## Support

For issues or questions, refer to:

- Pulumi documentation: https://www.pulumi.com/docs/
- AWS Lambda documentation: https://docs.aws.amazon.com/lambda/
- AWS API Gateway documentation: https://docs.aws.amazon.com/apigateway/
