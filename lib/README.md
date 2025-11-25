# Multi-Region Data Analytics Infrastructure

This CDKTF Python application deploys a comprehensive data analytics infrastructure across three AWS regions: us-east-1, eu-west-1, and ap-southeast-1.

## Architecture

The infrastructure includes:

- **VPC**: Isolated network per region with unique CIDR blocks
- **S3 Buckets**: Raw data storage with versioning, encryption, and lifecycle policies
- **Lambda Functions**: ETL processing (Python 3.11, 1024MB memory)
- **DynamoDB Tables**: Job metadata tracking with GSI for timestamp queries
- **SQS Queues**: Event decoupling with dead-letter queues (3 retry limit)
- **EventBridge Rules**: Automatic triggering on S3 object creation
- **CloudWatch**: Dashboards and alarms for monitoring
- **IAM Roles**: Least-privilege permissions for Lambda execution

## Regional Configuration

| Region | VPC CIDR |
|--------|----------|
| us-east-1 | 10.0.0.0/16 |
| eu-west-1 | 10.1.0.0/16 |
| ap-southeast-1 | 10.2.0.0/16 |

## Prerequisites

- Python 3.8+
- Node.js 18+
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials
- Terraform >= 1.0

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize CDKTF
cdktf get
```

## Lambda Function Deployment

Before deploying, create the Lambda deployment package:

```bash
# Create lambda directory if it doesn't exist
mkdir -p lib/lambda

# Create deployment package
cd lib/lambda
zip -r ../../lambda_function.zip index.py
cd ../..
```

## Deployment

```bash
# Set environment suffix (required for unique resource names)
export ENVIRONMENT_SUFFIX="test123"

# Synthesize Terraform configuration
cdktf synth

# Deploy to all regions
cdktf deploy

# Deploy with auto-approve
cdktf deploy --auto-approve
```

## Outputs

After deployment, the following outputs are available for each region:

- `s3_bucket_name_<region>`: S3 bucket name
- `lambda_function_arn_<region>`: Lambda function ARN
- `dynamodb_table_name_<region>`: DynamoDB table name
- `sqs_queue_url_<region>`: SQS queue URL
- `vpc_id_<region>`: VPC ID

## Usage

### Upload Data

Upload files to any regional S3 bucket to trigger processing:

```bash
aws s3 cp sample-data.txt s3://analytics-bucket-us-east-1-${ENVIRONMENT_SUFFIX}/input/sample-data.txt
```

### Monitor Processing

View CloudWatch dashboards in each region:
- Dashboard name: `analytics-monitoring-<region>-${ENVIRONMENT_SUFFIX}`

Query DynamoDB for job status:

```bash
aws dynamodb scan \
  --table-name analytics-jobs-us-east-1-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

Check SQS dead-letter queue for failed messages:

```bash
aws sqs receive-message \
  --queue-url $(cdktf output sqs_queue_url_us_east_1) \
  --region us-east-1
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{region}-{environmentSuffix}`

Examples:
- S3: `analytics-bucket-us-east-1-test123`
- Lambda: `analytics-etl-eu-west-1-test123`
- DynamoDB: `analytics-jobs-ap-southeast-1-test123`

## Cleanup

```bash
# Destroy all resources in all regions
cdktf destroy

# Destroy with auto-approve
cdktf destroy --auto-approve
```

## Testing

Run unit tests:

```bash
pytest tests/
```

## Security

- All S3 buckets use SSE-S3 encryption
- IAM roles follow least-privilege principles
- No wildcard permissions
- All resources tagged for compliance
- CloudWatch Logs retention: 30 days

## Monitoring

CloudWatch alarms trigger when:
- Lambda error rate exceeds 5 errors in 10 minutes
- SQS queue depth grows beyond threshold

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/analytics-etl-us-east-1-${ENVIRONMENT_SUFFIX} --follow
```

### Failed Processing Jobs

Query DynamoDB for failed jobs:
```bash
aws dynamodb query \
  --table-name analytics-jobs-us-east-1-${ENVIRONMENT_SUFFIX} \
  --key-condition-expression "job_id = :job_id" \
  --expression-attribute-values '{":job_id":{"S":"<job-id>"}}'
```

### Dead Letter Queue

Check DLQ for failed messages:
```bash
aws sqs receive-message \
  --queue-url $(aws sqs get-queue-url --queue-name analytics-dlq-us-east-1-${ENVIRONMENT_SUFFIX} --query 'QueueUrl' --output text)
```

## Cost Optimization

- Lambda: Pay per invocation
- DynamoDB: On-demand billing (no provisioned capacity)
- S3: Lifecycle policy moves data to Glacier after 90 days
- CloudWatch: 30-day log retention to control costs

## Compliance

- Point-in-time recovery enabled for DynamoDB
- S3 versioning enabled for data protection
- All resources tagged for cost allocation
- Data residency: Each region processes data locally (no cross-region transfer)
