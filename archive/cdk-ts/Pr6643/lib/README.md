# Serverless ETL Pipeline for Financial Transaction Processing

A production-grade serverless ETL pipeline built with AWS CDK and TypeScript for processing financial transaction data.

## Architecture

The solution implements a fully serverless architecture:

- **S3**: Data lake for raw, processed, and enriched data
- **Lambda**: Six functions handling validation, transformation, enrichment, triggering, API, and quality checks
- **Step Functions**: Orchestrates the ETL workflow with error handling
- **DynamoDB**: Stores job metadata and processing status
- **API Gateway**: REST API for querying status and triggering workflows
- **EventBridge**: Scheduled triggers for daily quality checks
- **SQS**: Dead letter queues for error handling
- **CloudWatch**: Dashboards, metrics, alarms, and logs

## Prerequisites

- Node.js 18.x or later
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda dependencies:
```bash
cd lib/lambda/validator && npm install && cd ../../..
cd lib/lambda/transformer && npm install && cd ../../..
cd lib/lambda/enricher && npm install && cd ../../..
cd lib/lambda/trigger && npm install && cd ../../..
cd lib/lambda/quality-check && npm install && cd ../../..
cd lib/lambda/api-handler && npm install && cd ../../..
```

## Deployment

1. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

2. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=dev
```

Or set environment variable:
```bash
export ENVIRONMENT_SUFFIX=dev
cdk deploy
```

3. Note the outputs:
   - DataBucketName: S3 bucket name
   - MetadataTableName: DynamoDB table name
   - StateMachineArn: Step Functions ARN
   - ApiEndpoint: API Gateway URL
   - DashboardURL: CloudWatch dashboard URL

## Usage

### Upload CSV File

Upload a CSV file to trigger the ETL pipeline:

```bash
aws s3 cp transaction-data.csv s3://BUCKET-NAME/raw/transaction-data.csv
```

The CSV must have these columns:
- transaction_id
- amount
- timestamp
- merchant_id

### Query Processing Status

```bash
curl https://API-ENDPOINT/prod/status/JOB-ID
```

### Manually Trigger Workflow

```bash
curl -X POST https://API-ENDPOINT/prod/trigger \
  -H "Content-Type: application/json" \
  -d '{"bucket": "BUCKET-NAME", "key": "raw/transaction-data.csv"}'
```

## Monitoring

Access the CloudWatch dashboard using the URL from stack outputs. The dashboard shows:

- Step Functions execution metrics
- Lambda invocation counts and errors
- Processing latency metrics
- Success vs failure rates
- Dead letter queue message counts

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To remove all resources:

```bash
cdk destroy
```

This will delete all resources including S3 buckets, DynamoDB tables, and CloudWatch logs.

## Security

- All Lambda functions have separate IAM roles with least privilege
- CloudWatch Logs retention set to 7 days
- S3 bucket versioning enabled
- No VPC required (all services are fully managed)
- API Gateway with request validation

## Cost Optimization

- Serverless architecture with pay-per-use pricing
- DynamoDB on-demand billing
- S3 lifecycle policies for automatic data cleanup
- CloudWatch Logs with 7-day retention
- Step Functions Express workflows for lower cost

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/validator-SUFFIX --follow
```

### Failed Executions

Check Step Functions console or dead letter queues:
```bash
aws sqs receive-message --queue-url QUEUE-URL
```

### API Errors

Check API Gateway logs in CloudWatch.
