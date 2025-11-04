# Serverless Webhook Processing System

A CDKTF TypeScript implementation of a serverless webhook processing system using AWS services.

## Architecture

This system implements a fully serverless webhook processing pipeline:

1. **API Gateway**: Regional REST API with POST and GET endpoints
2. **Lambda Functions**:
   - Validator: Validates webhooks, stores in DynamoDB, queues for processing
   - Processor: Processes messages from SQS, stores results in S3
3. **DynamoDB**: Stores webhook metadata with 7-day TTL
4. **SQS**: Main queue with dead letter queue (3 retries, 14-day retention)
5. **S3**: Stores processed webhook results with versioning enabled
6. **CloudWatch**: Alarms for Lambda errors exceeding 1%
7. **X-Ray**: Tracing enabled on all Lambda functions

## Prerequisites

- Node.js 18+
- AWS CLI configured
- CDKTF CLI installed: `npm install -g cdktf-cli`
- Terraform installed

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Lambda functions:
   ```bash
   cd lib/lambda
   chmod +x build.sh
   ./build.sh
   cd ../..
   ```

3. Build TypeScript:
   ```bash
   npm run build
   ```

4. Synthesize Terraform:
   ```bash
   npm run synth
   ```

## Deployment

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
npm run deploy
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: "dev")
- `AWS_REGION`: Target AWS region (default: "ap-southeast-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for state (default: "iac-rlhf-tf-states")
- `TERRAFORM_STATE_BUCKET_REGION`: State bucket region (default: "us-east-1")

## API Usage

### Submit Webhook (POST)

```bash
curl -X POST https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/webhooks \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": "sample"}'
```

Response:
```json
{
  "webhookId": "uuid-here",
  "message": "Webhook received and queued for processing"
}
```

### Query Webhook Status (GET)

```bash
curl "https://<api-id>.execute-api.ap-southeast-1.amazonaws.com/prod/webhooks?webhookId=<uuid>"
```

Response:
```json
{
  "webhookId": "uuid-here",
  "status": "completed",
  "timestamp": "1234567890",
  "processedAt": "1234567900"
}
```

## Configuration Details

- **Lambda Memory**: 512MB
- **Lambda Timeout**: 30 seconds
- **SQS Visibility Timeout**: 180 seconds (6x Lambda timeout)
- **DynamoDB**: On-demand billing, partition key: webhookId
- **API Gateway Throttling**: 100 requests/second
- **DLQ Retention**: 14 days
- **TTL**: 7 days on DynamoDB entries
- **Runtime**: Node.js 18

## Monitoring

CloudWatch alarms are configured for:
- Validator Lambda errors > 1%
- Processor Lambda errors > 1%

X-Ray tracing is enabled on all Lambda functions for debugging.

## Resource Naming

All resources include the `environmentSuffix` variable for uniqueness:
- `webhook-validator-{environmentSuffix}`
- `webhook-processor-{environmentSuffix}`
- `webhook-table-{environmentSuffix}`
- `webhook-queue-{environmentSuffix}`
- `webhook-results-{environmentSuffix}`

## Tags

All resources are tagged with:
- `Environment: Production`
- `Team: Platform`

## Cleanup

```bash
npm run destroy
```
