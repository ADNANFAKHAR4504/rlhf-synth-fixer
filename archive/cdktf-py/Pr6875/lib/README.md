# Serverless Transaction Processing Pipeline

A complete serverless infrastructure for processing transaction CSV files using AWS services orchestrated with CDKTF Python.

## Architecture

This solution implements a serverless transaction processing pipeline with the following components:

### Components

1. **API Gateway REST API**: HTTP endpoint for file uploads at `/upload`
2. **Lambda Functions**:
   - CSV Validator: Validates uploaded files against schema
   - Data Transformer: Transforms CSV data and stores in DynamoDB
   - Notification Sender: Publishes results to SNS topic
3. **Step Functions**: Express workflow orchestrating the processing pipeline
4. **DynamoDB Tables**:
   - Transactions table: Stores processed transaction data
   - Status table: Tracks processing status
5. **S3 Bucket**: Stores validated CSV files
6. **SNS Topic**: Publishes processing notifications
7. **SQS Queue**: Dead letter queue for failed workflows
8. **CloudWatch**: Logs and alarms for monitoring

### Features

- ARM64 Lambda functions with 512MB memory using container images
- DynamoDB on-demand billing with point-in-time recovery
- Global secondary indexes on timestamp for efficient queries
- Step Functions Express workflows with retry logic and error handling
- API Gateway request validation and usage plans (1000 requests/day)
- X-Ray tracing enabled across all services
- CloudWatch alarms for Lambda error rates (5% threshold)
- IAM roles with least privilege access
- Comprehensive resource tagging (Environment, Application, CostCenter)

## Prerequisites

- Python 3.11 or later
- Node.js 18 or later (for CDKTF CLI)
- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- Docker (for building Lambda container images)

## Installation

1. Install CDKTF CLI:
```bash
npm install -g cdktf-cli
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install CDKTF providers:
```bash
cdktf get
```

## Building Lambda Container Images

Before deploying, build and push Lambda container images to ECR:

```bash
# Set environment variables
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Build and push CSV validator
cd lib/lambda/csv_validator
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build --platform linux/arm64 -t csv-validator-$ENVIRONMENT_SUFFIX .
docker tag csv-validator-$ENVIRONMENT_SUFFIX:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/csv-validator-$ENVIRONMENT_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/csv-validator-$ENVIRONMENT_SUFFIX:latest
cd ../../..

# Build and push data transformer
cd lib/lambda/data_transformer
docker build --platform linux/arm64 -t data-transformer-$ENVIRONMENT_SUFFIX .
docker tag data-transformer-$ENVIRONMENT_SUFFIX:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/data-transformer-$ENVIRONMENT_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/data-transformer-$ENVIRONMENT_SUFFIX:latest
cd ../../..

# Build and push notification sender
cd lib/lambda/notification_sender
docker build --platform linux/arm64 -t notification-sender-$ENVIRONMENT_SUFFIX .
docker tag notification-sender-$ENVIRONMENT_SUFFIX:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/notification-sender-$ENVIRONMENT_SUFFIX:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/notification-sender-$ENVIRONMENT_SUFFIX:latest
cd ../../..
```

## Deployment

1. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
export TERRAFORM_STATE_BUCKET=iac-rlhf-tf-states
export TERRAFORM_STATE_BUCKET_REGION=us-east-1
```

2. Synthesize the CDKTF stack:
```bash
cdktf synth
```

3. Deploy the infrastructure:
```bash
cdktf deploy
```

4. Confirm deployment when prompted.

## Usage

### Upload CSV File

```bash
# Get API endpoint from outputs
API_ENDPOINT=$(cdktf output api_endpoint)

# Upload CSV file
curl -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@transactions.csv" \
  $API_ENDPOINT
```

### CSV File Format

The CSV file must have the following columns:
- `transaction_id`: Unique transaction identifier
- `amount`: Transaction amount (numeric)
- `currency`: Currency code (e.g., USD, EUR)
- `timestamp`: Transaction timestamp (ISO 8601 format)
- `merchant`: Merchant name
- `status`: Transaction status (completed, pending, or failed)

Example:
```csv
transaction_id,amount,currency,timestamp,merchant,status
TXN001,99.99,USD,2024-01-15T10:30:00Z,Amazon,completed
TXN002,149.50,EUR,2024-01-15T11:45:00Z,Apple Store,completed
```

### Monitor Processing

```bash
# Check processing status
aws dynamodb get-item \
  --table-name processing-status-$ENVIRONMENT_SUFFIX \
  --key '{"file_id": {"S": "upload-1234567890"}}'

# View transaction data
aws dynamodb scan \
  --table-name transactions-$ENVIRONMENT_SUFFIX \
  --limit 10
```

## Testing

Run unit tests:
```bash
pytest tests/ -v
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

## Monitoring

- CloudWatch Logs: `/aws/lambda/csv-validator-{env}`, `/aws/lambda/data-transformer-{env}`, `/aws/lambda/notification-sender-{env}`
- CloudWatch Alarms: Monitor Lambda error rates
- X-Ray: View distributed traces across services
- DynamoDB: Query status table for processing status

## Security

- All Lambda functions use IAM roles with least privilege access
- S3 bucket encryption enabled (AES256)
- DynamoDB point-in-time recovery enabled
- X-Ray tracing for security auditing
- API Gateway usage plans for rate limiting

## Cost Optimization

- Lambda functions use ARM64 architecture for cost savings
- DynamoDB uses on-demand billing (no idle costs)
- Step Functions Express workflows (60% cost reduction)
- CloudWatch Logs retention set to 7 days

## Troubleshooting

1. **Lambda timeout**: Increase timeout in `tap_stack.py`
2. **CSV validation errors**: Check CSV format matches expected schema
3. **DynamoDB throughput errors**: Ensure on-demand billing is enabled
4. **API Gateway errors**: Check CloudWatch Logs for detailed error messages

## License

This project is licensed under the MIT License.
