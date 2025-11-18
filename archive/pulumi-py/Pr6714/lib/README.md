# Serverless Fraud Detection Pipeline

This directory contains the Pulumi Python implementation of a serverless fraud detection pipeline for processing transaction data.

## Architecture

The solution implements a complete serverless architecture using the following AWS services:

### Core Components

1. **API Gateway REST API**
   - POST endpoint at `/transactions`
   - Request body schema validation
   - Throttling: 10,000 requests/second with 5,000 burst

2. **Lambda Functions** (all using Python 3.11, 3GB memory, 100 reserved concurrency)
   - `api-handler`: Receives API requests and publishes to SQS
   - `queue-consumer`: Consumes from SQS and writes to DynamoDB
   - `batch-processor`: Scans DynamoDB every 5 minutes for anomaly detection
   - `report-generator`: Generates daily reports and stores in S3

3. **SQS Queues**
   - Main queue: `transaction-queue`
   - Dead letter queue: `transaction-dlq` (max receive count: 3)

4. **DynamoDB Table**
   - Name: `transactions`
   - Partition key: `transaction_id` (String)
   - Sort key: `timestamp` (Number)
   - Billing: On-demand
   - Point-in-time recovery: Enabled

5. **S3 Bucket**
   - Name: `fraud-detection-reports`
   - Versioning: Enabled
   - Encryption: AES256
   - Lifecycle: Transition to Glacier after 90 days

6. **EventBridge Rules**
   - Batch processor: Triggers every 5 minutes
   - Report generator: Triggers daily

7. **CloudWatch Alarms**
   - Monitor Lambda error rates
   - Threshold: > 1% error rate over 5 minutes

8. **KMS Key**
   - Customer-managed key for Lambda environment variable encryption

## Directory Structure

```
lib/
├── tap_stack.py              # Main Pulumi stack definition
├── lambda/                   # Lambda function code
│   ├── api_handler/         # API Gateway request handler
│   │   └── index.py
│   ├── queue_consumer/      # SQS to DynamoDB consumer
│   │   └── index.py
│   ├── batch_processor/     # Anomaly detection processor
│   │   └── index.py
│   └── report_generator/    # Daily report generator
│       └── index.py
└── README.md                # This file
```

## Resource Naming

All resources include the `environmentSuffix` to ensure uniqueness across deployments:

- S3 Bucket: `fraud-detection-reports-{environmentSuffix}`
- Lambda Functions: `{function-name}-{environmentSuffix}`
- DynamoDB Table: `transactions-{environmentSuffix}`
- SQS Queues: `transaction-queue-{environmentSuffix}`
- IAM Roles: `{function-name}-role-{environmentSuffix}`

## Security Features

1. **Encryption at Rest**
   - DynamoDB: Default encryption
   - S3: AES256 server-side encryption
   - Lambda environment variables: Customer-managed KMS key

2. **Encryption in Transit**
   - API Gateway: HTTPS only
   - All AWS service communications: TLS

3. **IAM Least Privilege**
   - Separate IAM roles for each Lambda function
   - Fine-grained policies for specific actions
   - No overly permissive wildcards

4. **Data Retention**
   - DynamoDB: Point-in-time recovery enabled
   - S3: Versioning enabled
   - SQS: Dead letter queue for failed messages

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Python 3.8 or higher

### Deploy Stack

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="dev"

# Deploy infrastructure
pulumi up
```

### Configuration

The stack requires the following environment variables:

- `ENVIRONMENT_SUFFIX`: Suffix for resource names (default: "dev")
- `AWS_REGION`: Target AWS region (default: "us-east-1")

### Outputs

After deployment, the stack exports:

- `api_endpoint`: API Gateway endpoint URL for /transactions
- `s3_bucket_name`: Name of the S3 bucket for reports
- `dynamodb_table_arn`: ARN of the DynamoDB transactions table
- `sqs_queue_url`: URL of the main SQS queue
- `dlq_url`: URL of the dead letter queue

## Testing

### Manual Testing

1. **Test API Gateway endpoint:**

```bash
API_URL=$(pulumi stack output api_endpoint)
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn-12345",
    "amount": 99.99,
    "timestamp": 1700000000,
    "customer_id": "cust-001",
    "merchant": "Test Merchant"
  }'
```

2. **Check DynamoDB table:**

```bash
TABLE_NAME=$(pulumi stack output dynamodb_table_arn | cut -d'/' -f2)
aws dynamodb scan --table-name $TABLE_NAME
```

3. **Check S3 bucket for reports:**

```bash
BUCKET_NAME=$(pulumi stack output s3_bucket_name)
aws s3 ls s3://$BUCKET_NAME/reports/ --recursive
```

## Monitoring

### CloudWatch Logs

Each Lambda function writes logs to CloudWatch Logs:

- `/aws/lambda/api-handler-{environmentSuffix}`
- `/aws/lambda/queue-consumer-{environmentSuffix}`
- `/aws/lambda/batch-processor-{environmentSuffix}`
- `/aws/lambda/report-generator-{environmentSuffix}`

### CloudWatch Alarms

Error alarms are configured for each Lambda function and send notifications to SNS topics.

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable without retention policies.

## Compliance

- All resources use encryption at rest and in transit
- IAM roles follow least privilege principle
- Logging and monitoring enabled for all components
- Data retention policies configured as required
- Reserved concurrency prevents throttling as specified
