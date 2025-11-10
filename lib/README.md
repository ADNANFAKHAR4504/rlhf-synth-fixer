# Serverless Transaction Processing System

Production-ready serverless infrastructure for real-time transaction processing with fraud detection and audit logging.

## Architecture

This system implements a fully serverless transaction processing pipeline on AWS:

- **API Layer**: API Gateway REST API with request validation
- **Processing**: Lambda functions for transaction validation and audit logging
- **Storage**: DynamoDB for transaction data, S3 for reports and audit logs
- **Async Processing**: SQS queue for decoupled audit processing
- **Monitoring**: CloudWatch alarms for error rate detection
- **Automation**: EventBridge for scheduled daily summaries

## Components

### Infrastructure Resources

- **API Gateway**: Edge-optimized REST API with 10,000 req/sec burst limit
- **Lambda Functions** (3):
  - `processTransaction`: Validates and stores transactions
  - `auditTransaction`: Creates audit logs from SQS messages
  - `dailySummary`: Generates daily transaction reports
- **Lambda Layer**: Shared AWS SDK v3 dependencies
- **DynamoDB Table**: On-demand billing with point-in-time recovery
- **SQS Queue**: Transaction queue with dead letter queue (14-day retention)
- **S3 Bucket**: Report storage with 90-day Glacier archival
- **CloudWatch Alarms**: Error monitoring (>1% threshold over 5 minutes)
- **EventBridge Rule**: Daily summary trigger at 2 AM UTC

### Lambda Functions

#### processTransaction

Handles POST /transactions requests:
- Validates required fields (transactionId, amount, currency)
- Stores transaction in DynamoDB
- Sends message to audit queue
- Returns success response with transaction ID

#### auditTransaction

SQS event-driven audit processor:
- Triggered by messages in audit queue
- Creates detailed audit logs in S3
- Includes message metadata and timestamps
- Batch processing up to 10 messages

#### dailySummary

Scheduled daily reporting:
- Runs at 2 AM UTC daily
- Scans transactions from last 24 hours
- Calculates total count and amount
- Stores summary report in S3

## Deployment

### Prerequisites

- Node.js 18.x or later
- AWS CDK CLI installed
- AWS credentials configured
- Required IAM permissions

### Install Dependencies

```bash
npm install
```

### Build Lambda Layer

```bash
cd lib/lambda/layer/nodejs
npm install
cd ../../../../
```

### Deploy

```bash
# Synthesize CloudFormation template
npm run cdk synth

# Deploy to AWS
npm run cdk deploy

# With custom environment suffix
npm run cdk deploy -- -c environmentSuffix=prod
```

### Cleanup

```bash
npm run cdk destroy
```

## Configuration

### Environment Variables

The stack uses `environmentSuffix` for resource naming:

```typescript
cdk deploy -c environmentSuffix=dev
```

### Region

Target region: **ap-southeast-1** (configured in lib/AWS_REGION)

### Resource Naming

All resources follow the pattern: `{resource-type}-${environmentSuffix}`

Examples:
- `transaction-api-dev`
- `processTransaction-dev`
- `TransactionTable-dev`

## Security

### PCI DSS Compliance

- Encryption at rest for DynamoDB and S3
- Encryption in transit for all API communications
- Least-privilege IAM roles for all Lambda functions
- API Gateway request validation
- Dead letter queues for failed message handling

### IAM Permissions

Lambda functions use least-privilege IAM roles:

- **processTransaction**: DynamoDB write, SQS send
- **auditTransaction**: S3 write
- **dailySummary**: DynamoDB read, S3 write

## Monitoring

### CloudWatch Alarms

Two alarms monitor Lambda error rates:

- **processTransaction-errors**: Triggers on >1% error rate
- **auditTransaction-errors**: Triggers on >1% error rate

Both use 5-minute evaluation periods with Average statistic.

### CloudWatch Logs

All Lambda functions log to CloudWatch Logs:

- `/aws/lambda/processTransaction-${suffix}`
- `/aws/lambda/auditTransaction-${suffix}`
- `/aws/lambda/dailySummary-${suffix}`

## API Usage

### POST /transactions

Create a new transaction:

```bash
curl -X POST https://{api-id}.execute-api.ap-southeast-1.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 100.50,
    "currency": "USD",
    "customerId": "cust-67890",
    "timestamp": 1699999999999
  }'
```

**Response** (200 OK):
```json
{
  "message": "Transaction processed successfully",
  "transactionId": "txn-12345"
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "message": "Missing required fields: transactionId, amount, currency"
}
```

## Performance

### Lambda Configuration

- **Runtime**: Node.js 18.x
- **Architecture**: ARM64 (Graviton2) for cost optimization
- **Reserved Concurrency**: 100 per function
- **Timeout**:
  - processTransaction: 30 seconds
  - auditTransaction: 60 seconds
  - dailySummary: 5 minutes

### API Gateway Limits

- **Burst Limit**: 10,000 requests/second
- **Rate Limit**: 5,000 requests/second steady state
- **Payload Limit**: 10MB

### DynamoDB

- **Billing Mode**: On-demand (auto-scaling)
- **Point-in-Time Recovery**: Enabled
- **Encryption**: AWS-managed keys

## Cost Optimization

- Serverless architecture (pay per use)
- ARM64 Lambda functions (20% cost reduction)
- DynamoDB on-demand billing (no provisioned capacity)
- S3 lifecycle policy (90-day Glacier archival)
- Lambda layers for shared dependencies

## Outputs

After deployment, the stack exports:

- **ApiUrl**: Transaction API endpoint
- **TableName**: DynamoDB table name
- **QueueUrl**: SQS queue URL
- **BucketName**: S3 bucket for reports

Access outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name TapStack{environmentSuffix} \
  --query 'Stacks[0].Outputs'
```

## Development

### Project Structure

```
lib/
├── tap-stack.ts                 # Main CDK stack
├── lambda/
│   ├── processTransaction/
│   │   └── index.ts            # Transaction processor
│   ├── auditTransaction/
│   │   └── index.ts            # Audit logger
│   ├── dailySummary/
│   │   └── index.ts            # Daily report generator
│   └── layer/
│       └── nodejs/
│           └── package.json    # Shared dependencies
├── PROMPT.md                   # Original requirements
├── MODEL_RESPONSE.md           # Initial implementation
├── IDEAL_RESPONSE.md           # Corrected implementation
└── MODEL_FAILURES.md           # Documented fixes
```

### Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Troubleshooting

### Deployment Fails

- Check AWS credentials are configured
- Verify IAM permissions for CDK deployment
- Ensure unique bucket names (environmentSuffix is unique)

### Lambda Errors

- Check CloudWatch Logs for function-specific errors
- Verify environment variables are set correctly
- Ensure Lambda layer contains required dependencies

### API Gateway 403 Errors

- Verify API Gateway request validation schema
- Check Lambda integration permissions
- Ensure request body matches required schema

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
- [DynamoDB On-Demand](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)

## License

This infrastructure code is generated for testing and training purposes.
