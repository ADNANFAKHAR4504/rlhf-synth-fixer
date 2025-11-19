# Serverless ETL Pipeline

A production-ready serverless ETL pipeline built with AWS CDK and Python for processing large CSV transaction files.

## Architecture

This solution implements a fully serverless architecture using:

- **Step Functions**: Orchestrates the ETL workflow with parallel processing
- **Lambda Functions**: Split files, validate data, and process chunks
- **DynamoDB**: Tracks processing status for each file chunk
- **S3**: Stores incoming and processed files with lifecycle management
- **EventBridge**: Triggers workflow on file uploads
- **CloudWatch**: Provides monitoring dashboards and logs
- **SQS FIFO**: Delivers processing results (optional)
- **SNS**: Sends failure alerts (optional)

## Features

1. **Automatic File Splitting**: Large CSV files are split into 50MB chunks for parallel processing
2. **Data Validation**: Validates CSV headers and data types before processing
3. **Parallel Processing**: Processes up to 10 chunks concurrently using Step Functions Map state
4. **Error Handling**: Exponential backoff with up to 3 retries per chunk
5. **Status Tracking**: DynamoDB maintains processing state for each chunk
6. **Lifecycle Management**: Processed files automatically move to Glacier after 30 days
7. **Monitoring**: CloudWatch dashboard shows execution metrics and failure rates
8. **Tracing**: X-Ray tracing enabled across all Lambda functions
9. **Security**: IAM least privilege with explicit denies for dangerous operations

## Deployment

### Prerequisites

- AWS CDK 2.x
- Python 3.9+
- AWS Account with appropriate permissions

### Steps

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create Lambda layer (pandas and boto3):
```bash
mkdir -p lib/lambda/layer/python
pip install -r lib/lambda/layer/requirements.txt -t lib/lambda/layer/python/
```

3. Deploy the stack:
```bash
cdk deploy --parameters environmentSuffix=<your-suffix>
```

## Usage

1. Upload CSV files to the S3 bucket with prefix `incoming/`:
```bash
aws s3 cp transactions.csv s3://etl-processing-<suffix>/incoming/transactions.csv
```

2. EventBridge automatically triggers the Step Functions workflow

3. Monitor execution in the CloudWatch dashboard or Step Functions console

4. Processed results are stored in `processed/` prefix and eventually moved to Glacier

## CSV Format

Expected CSV headers:
- transaction_id
- account_id
- transaction_date
- amount
- currency
- merchant
- category

## Configuration

Environment variables:
- `CHUNK_SIZE_MB`: Size of each chunk (default: 50MB)
- `STATUS_TABLE`: DynamoDB table name
- `BUCKET_NAME`: S3 bucket name

## Monitoring

Access the CloudWatch dashboard from the CDK output URL to view:
- State machine execution counts (started, succeeded, failed)
- Lambda invocations and errors
- DynamoDB read/write capacity

## Cost Optimization

- Lambda functions use 3GB memory for optimal performance
- DynamoDB uses on-demand billing for unpredictable workloads
- S3 lifecycle moves old files to Glacier (90% cost reduction)
- CloudWatch Logs retention set to 30 days

## Security

- All S3 data encrypted with SSE-S3
- IAM roles follow least privilege principle
- Explicit deny for bucket and table deletion
- No public access to any resources
- VPC not required (fully managed services)

## Tags

All resources are tagged with:
- Environment: Production
- Project: ETL
