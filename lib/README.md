# Serverless CSV Processing Pipeline - CDKTF Implementation

## Overview

This infrastructure code implements a complete serverless data processing pipeline for CSV file analysis using CDKTF with TypeScript. The pipeline automatically processes CSV files uploaded to S3, extracts transaction summaries and data quality metrics, and stores results in DynamoDB.

## Architecture

The solution consists of the following AWS services:

- **S3 Bucket**: Storage for CSV files with SSE-S3 encryption and versioning
- **Lambda Function**: Python 3.9 function that processes CSV files
- **DynamoDB Table**: NoSQL database storing processing results
- **SQS Queue**: Dead letter queue for failed processing attempts
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **IAM Roles/Policies**: Least privilege access control

## Workflow

1. CSV file uploaded to S3 bucket under `raw-data/` prefix
2. S3 event notification triggers Lambda function
3. Lambda downloads and processes CSV file
4. Processing results stored in DynamoDB
5. Failed attempts (after 3 retries) sent to dead letter queue
6. All activities logged to CloudWatch

## Files Structure

```
lib/
├── tap-stack.ts                    # Main CDKTF stack
├── csv-processing-stack.ts         # CSV processing infrastructure
├── lambda/
│   └── csv-processor/
│       ├── index.py                # Lambda function code
│       └── requirements.txt        # Python dependencies
├── PROMPT.md                       # Human-readable requirements
├── MODEL_RESPONSE.md               # Initial generated implementation
├── IDEAL_RESPONSE.md               # Corrected implementation
├── MODEL_FAILURES.md               # Issues and fixes documentation
└── README.md                       # This file
```

## Configuration

### Region
- **Target Region**: ap-southeast-1 (Singapore)
- Configured in `lib/tap-stack.ts` via `AWS_REGION_OVERRIDE`

### Environment Suffix
All resources include an `environmentSuffix` for uniqueness:
- S3 Bucket: `csv-data-{environmentSuffix}`
- Lambda Function: `csv-processor-{environmentSuffix}`
- DynamoDB Table: `processing-results-{environmentSuffix}`
- SQS Queue: `csv-processing-dlq-{environmentSuffix}`
- IAM Roles/Policies: Include suffix in names

## Security Features

1. **S3 Bucket**:
   - SSE-S3 encryption enabled
   - Versioning enabled for audit trail
   - All public access blocked
   - Force destroy enabled for easy cleanup

2. **Lambda Function**:
   - IAM role with least privilege permissions
   - Only necessary S3 read permissions
   - Only necessary DynamoDB write permissions
   - CloudWatch Logs write permissions

3. **IAM Policies**:
   - Separate policy for Lambda permissions
   - Explicit resource ARN restrictions
   - No wildcard permissions

## Resource Specifications

### S3 Bucket
- Encryption: AES256 (SSE-S3)
- Versioning: Enabled
- Public Access: Blocked
- Event Notifications: Enabled for `raw-data/*.csv`

### Lambda Function
- Runtime: Python 3.9
- Timeout: 300 seconds (5 minutes)
- Memory: 512 MB
- Handler: index.handler
- Dead Letter Queue: Configured

### DynamoDB Table
- Partition Key: `fileId` (String)
- Sort Key: `timestamp` (Number)
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Point-in-Time Recovery: Enabled

### SQS Queue
- Message Retention: 1,209,600 seconds (14 days)
- Purpose: Dead letter queue for failed Lambda invocations

### CloudWatch Logs
- Log Group: `/aws/lambda/csv-processor-{environmentSuffix}`
- Retention: 7 days

## Deployment

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### Deploy Infrastructure
```bash
# Synthesize CDKTF configuration
cdktf synth

# Deploy to AWS
cdktf deploy
```

### Verify Deployment
```bash
# Check outputs
cdktf output

# You should see:
# - s3-bucket-name
# - lambda-function-arn
# - dynamodb-table-name
```

## Testing

### Upload Test CSV File
```bash
# Create a sample CSV file
cat > test.csv << EOF
id,name,amount,date
1,Transaction A,100.50,2025-11-10
2,Transaction B,250.75,2025-11-10
3,Transaction C,75.00,2025-11-10
EOF

# Upload to S3
aws s3 cp test.csv s3://csv-data-${ENVIRONMENT_SUFFIX}/raw-data/test.csv --region ap-southeast-1
```

### Check Processing Results
```bash
# View Lambda logs
aws logs tail /aws/lambda/csv-processor-${ENVIRONMENT_SUFFIX} --follow --region ap-southeast-1

# Query DynamoDB for results
aws dynamodb scan \
  --table-name processing-results-${ENVIRONMENT_SUFFIX} \
  --region ap-southeast-1
```

## Outputs

After deployment, the following outputs are available:

1. **s3-bucket-name**: Name of the S3 bucket for CSV file uploads
2. **lambda-function-arn**: ARN of the Lambda function for monitoring
3. **dynamodb-table-name**: Name of the DynamoDB table for query access

## Monitoring

### CloudWatch Logs
All Lambda execution logs are captured in CloudWatch:
```bash
aws logs tail /aws/lambda/csv-processor-${ENVIRONMENT_SUFFIX} --follow
```

### CloudWatch Metrics
Monitor Lambda invocations, errors, and duration:
- Invocations
- Errors
- Duration
- Throttles

### Dead Letter Queue
Check for failed processing attempts:
```bash
aws sqs receive-message \
  --queue-url $(aws sqs get-queue-url --queue-name csv-processing-dlq-${ENVIRONMENT_SUFFIX} --query 'QueueUrl' --output text) \
  --region ap-southeast-1
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

This will remove:
- S3 bucket and all objects (forceDestroy enabled)
- Lambda function
- DynamoDB table
- SQS queue
- CloudWatch log group
- IAM roles and policies

## Lambda Function Details

### Processing Logic
The Lambda function performs the following operations:

1. Receives S3 event notification
2. Downloads CSV file from S3
3. Parses CSV content using csv.DictReader
4. Calculates metrics:
   - Total record count
   - Complete record count
   - Data completeness percentage
   - Column list
5. Stores results in DynamoDB with:
   - fileId (from filename)
   - timestamp (processing time)
   - metrics (calculated values)
   - status (completed)
   - processedAt (ISO timestamp)

### Environment Variables
- `DYNAMODB_TABLE_NAME`: Target table for results
- `S3_BUCKET_NAME`: Source bucket name
- `PROCESSING_CONFIG`: Processing configuration (standard)

### Error Handling
- Exceptions logged to CloudWatch
- Failed invocations retry 3 times
- After 3 failures, message sent to DLQ
- Stack traces captured in logs

## Compliance and Best Practices

This implementation follows AWS best practices:

1. **Least Privilege**: IAM roles have minimal required permissions
2. **Encryption at Rest**: S3 uses SSE-S3, DynamoDB encrypts by default
3. **Audit Trail**: S3 versioning enabled, CloudWatch logs retained
4. **Resilience**: Dead letter queue captures failed processing
5. **Monitoring**: CloudWatch integration for observability
6. **Cost Optimization**:
   - DynamoDB on-demand billing (no unused capacity)
   - Lambda serverless (pay per invocation)
   - S3 lifecycle policies can be added for old files
7. **Scalability**: All components auto-scale with demand

## Performance Characteristics

- **CSV File Size**: Supports up to 100MB files
- **Processing Time**: Typically processes within 30 seconds for files under 100MB
- **Throughput**: Lambda can handle concurrent invocations
- **Latency**: Event notification triggers within seconds of upload

## Troubleshooting

### Lambda Fails to Process Files
1. Check Lambda logs in CloudWatch
2. Verify IAM permissions on S3 and DynamoDB
3. Check Lambda timeout settings
4. Verify CSV file format is valid

### DynamoDB Write Failures
1. Verify Lambda has write permissions
2. Check DynamoDB table exists
3. Verify attribute types match schema

### S3 Event Not Triggering
1. Verify file uploaded to `raw-data/` prefix
2. Check file has `.csv` extension
3. Verify Lambda permission for S3 invoke
4. Check S3 bucket notification configuration

## License

This infrastructure code is provided as-is for deployment of serverless CSV processing pipelines.
