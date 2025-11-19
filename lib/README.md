# Serverless File Processing Pipeline

A complete serverless file processing pipeline built with Pulumi and TypeScript, deployed to AWS us-east-1.

## Architecture Overview

This implementation provides an event-driven, serverless architecture for processing large volumes of market data files:

```
S3 Upload → Validator Lambda → FIFO Queue → Processor Lambda → FIFO Queue → Aggregator Lambda
              ↓                                ↓                               ↓
           DynamoDB                         DynamoDB                        DynamoDB
           (validated)                      (processed)                     (aggregated)
```

Query processing status via API Gateway:
```
GET /status?fileId=xxx → API Lambda → DynamoDB → Response
```

## Infrastructure Components

### Storage
- **S3 Bucket**: Versioned storage with 90-day Glacier transition
  - Server-side encryption (AES256)
  - Event notifications trigger processing pipeline
  - forceDestroy enabled for easy cleanup

### Compute
- **Validator Lambda**: Validates uploaded files (512MB, Node.js 18.x)
- **Processor Lambda**: Processes validated files (512MB, Node.js 18.x)
- **Aggregator Lambda**: Aggregates results (512MB, Node.js 18.x)
- **API Lambda**: Handles status queries (256MB, Node.js 18.x)

### Message Queuing
- **2 FIFO Queues**: Ordered message processing
  - validator-to-processor queue
  - processor-to-aggregator queue
  - Content-based deduplication enabled
- **3 Dead Letter Queues**: Error handling for each processing Lambda

### Database
- **DynamoDB Table**: Processing status tracking
  - On-demand billing mode
  - TTL enabled (30-day expiration)
  - Point-in-time recovery
  - Server-side encryption

### API
- **API Gateway REST API**: Status query endpoint
  - GET /status endpoint
  - 1000 requests/second throttling
  - Lambda proxy integration

### Monitoring
- **CloudWatch Logs**: 7-day retention for all Lambda functions

### Security
- **IAM Roles & Policies**: Least privilege access
  - S3, DynamoDB, SQS permissions
  - CloudWatch Logs permissions

## Deployment

### Prerequisites
- Pulumi CLI 3.x
- Node.js 20+
- AWS CLI configured
- AWS credentials with appropriate permissions

### Deploy

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy infrastructure
pulumi up --cwd lib --stack ${ENVIRONMENT_SUFFIX} --yes
```

### Destroy

```bash
# Remove all infrastructure
pulumi destroy --cwd lib --stack ${ENVIRONMENT_SUFFIX} --yes
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

Tests verify:
- Stack instantiation
- Output exports
- Resource naming conventions
- Configuration validation

### Integration Tests
```bash
npm run test:integration
```

Tests verify (requires deployed infrastructure):
- S3 bucket configuration
- DynamoDB table configuration
- Lambda function configuration
- SQS queue configuration
- API Gateway configuration
- End-to-end processing flow

## Usage

### Upload File for Processing

```bash
aws s3 cp myfile.csv s3://file-processing-bucket-${ENVIRONMENT_SUFFIX}/
```

The file will automatically trigger the processing pipeline:
1. Validator Lambda validates the file and updates DynamoDB
2. Message sent to validator-to-processor queue
3. Processor Lambda processes the file and updates DynamoDB
4. Message sent to processor-to-aggregator queue
5. Aggregator Lambda aggregates results and updates DynamoDB

### Query Processing Status

```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(pulumi stack output apiEndpoint)

# Query status
curl "${API_ENDPOINT}?fileId=myfile.csv"
```

Response:
```json
{
  "fileId": "myfile.csv",
  "status": "aggregated",
  "timestamp": "1700000000000"
}
```

## Resource Naming

All resources include the environment suffix for proper isolation:
- Pattern: `{resource-type}-${environmentSuffix}`
- Example: `file-processing-bucket-dev`

## Cost Optimization

- Serverless architecture (pay per use)
- Lambda functions scale automatically
- DynamoDB on-demand billing
- S3 lifecycle rules (Glacier after 90 days)
- No NAT Gateways or persistent resources

## Monitoring

CloudWatch Logs are configured with 7-day retention for all Lambda functions:
- `/aws/lambda/validator-function-${environmentSuffix}`
- `/aws/lambda/processor-function-${environmentSuffix}`
- `/aws/lambda/aggregator-function-${environmentSuffix}`

## Error Handling

Dead Letter Queues capture failed processing attempts:
- Max receive count: 3 (implicit via Lambda configuration)
- 14-day message retention
- Separate DLQ per Lambda function

## Tags

All resources are tagged for cost tracking:
- Environment: Production
- Team: Analytics
- Additional CI/CD tags (Repository, Author, PRNumber, CreatedAt)

## Security

- S3 bucket encryption at rest (AES256)
- DynamoDB encryption at rest
- IAM roles follow least privilege principle
- No public access to resources

## Files

- `tap-stack.ts`: Main infrastructure code (743 lines)
- `bin/tap.ts`: Entry point with environment config
- `test/tap-stack.unit.test.ts`: Unit tests (21 tests, 100% coverage)
- `test/tap-stack.int.test.ts`: Integration tests (15+ tests)
- `IDEAL_RESPONSE.md`: Documentation of ideal implementation
- `MODEL_RESPONSE.md`: Simulation of initial response with issues
- `MODEL_FAILURES.md`: Documentation of fixes applied

## Troubleshooting

### Stack outputs not available
```bash
pulumi stack output --show-secrets
```

### Lambda function errors
```bash
aws logs tail /aws/lambda/validator-function-${ENVIRONMENT_SUFFIX} --follow
```

### DynamoDB items not created
Check Lambda CloudWatch Logs for errors and verify IAM permissions.

### API Gateway returns 500
Check API Lambda CloudWatch Logs and verify DynamoDB table name environment variable.

## License

MIT
