# Serverless ETL Pipeline for Financial Transaction Processing

Production-ready serverless ETL pipeline built with AWS CDK and Python for processing financial transaction files uploaded by partner banks.

## Architecture Overview

This solution implements an event-driven serverless architecture that automatically processes CSV and JSON transaction files within a 15-minute SLA:

```
S3 Upload → EventBridge → Step Functions → [Validation → Transformation] → Processed S3
                                ↓
                            DynamoDB (Status Tracking)
                                ↓
                            CloudWatch (Monitoring)
```

### Components

1. **S3 Buckets**
   - Raw bucket: Receives uploaded transaction files
   - Processed bucket: Stores transformed JSON output
   - Versioning enabled for audit trail
   - 90-day lifecycle policy to Glacier storage

2. **Lambda Functions**
   - Validation function: Validates CSV/JSON schema compliance
   - Transformation function: Applies business rules and transforms data
   - Python 3.11 runtime with 3GB memory
   - 5-minute timeout for large file processing
   - 30-day CloudWatch log retention

3. **DynamoDB Table**
   - Tracks processing status for each file
   - Partition key: file_id
   - On-demand billing mode
   - Point-in-time recovery enabled

4. **Step Functions State Machine**
   - Orchestrates validation and transformation workflow
   - Exponential backoff retry (3 attempts, 2x rate)
   - 15-minute total timeout

5. **EventBridge Rule**
   - Triggers on S3 object creation
   - Filters for .csv and .json extensions only
   - Routes events to Step Functions

6. **CloudWatch Alarms**
   - Monitors Lambda error rates
   - Triggers when error rate exceeds 5%
   - 5-minute evaluation period

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Python 3.8 or higher
- Node.js 14.x or higher (for CDK)

## Installation

1. **Clone and navigate to the project directory**:
   ```bash
   cd worktree/synth-l9r9o5
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Lambda function dependencies** (if testing locally):
   ```bash
   pip install -r lib/lambda/validation/requirements.txt
   pip install -r lib/lambda/transformation/requirements.txt
   ```

## Deployment

### Deploy to AWS

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/us-east-1

# Synthesize CloudFormation template
cdk synth

# Deploy with environment suffix
cdk deploy --parameters EnvironmentSuffix=dev

# Deploy to production
cdk deploy --parameters EnvironmentSuffix=prod
```

### Environment Suffix

The `EnvironmentSuffix` parameter enables multiple deployments in the same AWS account:
- **dev**: Development environment
- **staging**: Staging environment
- **prod**: Production environment

All resources are named with this suffix to avoid conflicts.

## Testing

### Upload Test Files

1. **Create a test CSV file** (`test-transactions.csv`):
   ```csv
   transaction_id,amount,date,account_id
   TX001,100.50,2025-01-15,ACC123
   TX002,250.75,2025-01-15,ACC456
   ```

2. **Upload to trigger the pipeline**:
   ```bash
   aws s3 cp test-transactions.csv s3://etl-raw-dev/test-transactions.csv
   ```

3. **Monitor processing**:
   ```bash
   # Check DynamoDB for status
   aws dynamodb get-item \
     --table-name etl-processing-status-dev \
     --key '{"file_id": {"S": "test-transactions.csv"}}'

   # Check Step Functions execution
   aws stepfunctions list-executions \
     --state-machine-arn arn:aws:states:us-east-1:ACCOUNT-ID:stateMachine:etl-pipeline-dev

   # View processed output
   aws s3 cp s3://etl-processed-dev/processed/test-transactions.csv.json -
   ```

### Test JSON Format

Create a test JSON file (`test-transactions.json`):
```json
[
  {
    "transaction_id": "TX001",
    "amount": "100.50",
    "date": "2025-01-15",
    "account_id": "ACC123"
  },
  {
    "transaction_id": "TX002",
    "amount": "250.75",
    "date": "2025-01-15",
    "account_id": "ACC456"
  }
]
```

Upload and monitor as above.

## Monitoring

### CloudWatch Dashboards

Access CloudWatch to view:
- Lambda invocation counts and error rates
- Step Functions execution history
- S3 object counts

### CloudWatch Alarms

Two alarms are configured:
- `etl-validation-errors-{suffix}`: Triggers when validation error rate > 5%
- `etl-transformation-errors-{suffix}`: Triggers when transformation error rate > 5%

### DynamoDB Status Values

- `VALIDATING`: File is being validated
- `VALIDATED`: Validation passed
- `VALIDATION_FAILED`: Validation failed (check error field)
- `TRANSFORMING`: File is being transformed
- `COMPLETED`: Processing completed successfully
- `TRANSFORMATION_FAILED`: Transformation failed (check error field)

## Business Rules

The transformation function applies these rules:
1. Convert amount to float
2. Add processed_timestamp (UTC)
3. Set currency to USD
4. Calculate 1% transaction fee

## File Format Requirements

### CSV Files
- Must have header row
- Required fields: `transaction_id`, `amount`, `date`, `account_id`
- Comma-separated values

### JSON Files
- Must be array of transaction objects
- Required fields per transaction: `transaction_id`, `amount`, `date`, `account_id`

## AWS Services Used

- **S3**: File storage (raw and processed)
- **Lambda**: Serverless compute for validation and transformation
- **DynamoDB**: Processing status tracking
- **Step Functions**: Workflow orchestration
- **EventBridge**: Event routing from S3 to Step Functions
- **CloudWatch Logs**: Centralized logging
- **CloudWatch Alarms**: Error rate monitoring
- **IAM**: Permissions and security

## Cost Optimization

This architecture uses serverless services with pay-per-use pricing:
- **Lambda**: Charged per invocation and execution time
- **DynamoDB**: On-demand billing (no provisioned capacity)
- **S3**: Standard storage with automatic Glacier archival after 90 days
- **Step Functions**: Charged per state transition
- **CloudWatch Logs**: 30-day retention to control costs

## Security Features

- **IAM Least Privilege**: Each Lambda has specific permissions
- **S3 Versioning**: Audit trail for compliance
- **DynamoDB Point-in-Time Recovery**: Data protection
- **VPC Not Required**: All services are AWS-managed and secure by default
- **Resource Tagging**: Environment=Production, Project=ETL-Pipeline

## Cleanup

To remove all resources:

```bash
# Delete the stack
cdk destroy

# Confirm deletion when prompted
```

Note: S3 buckets are configured with `auto_delete_objects=True`, so all objects will be deleted automatically.

## Troubleshooting

### Common Issues

1. **Stack deployment fails**
   - Ensure AWS credentials are configured
   - Check CDK bootstrap is completed
   - Verify unique environment suffix

2. **Lambda functions fail**
   - Check CloudWatch Logs: `/aws/lambda/etl-validation-{suffix}`
   - Verify IAM permissions
   - Check DynamoDB table exists

3. **Files not processing**
   - Verify EventBridge rule is enabled
   - Check S3 event notifications are enabled
   - Confirm file extension is .csv or .json

4. **High error rate alarms**
   - Check CloudWatch Logs for error details
   - Verify input file format matches requirements
   - Review DynamoDB error field for failed files

## Development

### Local Testing

```bash
# Run unit tests (if implemented)
pytest tests/

# Lint code
pylint lib/tap_stack.py
pylint lib/lambda/validation/validation.py
pylint lib/lambda/transformation/transformation.py
```

### CDK Commands

- `cdk ls`: List all stacks
- `cdk synth`: Synthesize CloudFormation template
- `cdk diff`: Compare deployed stack with current state
- `cdk deploy`: Deploy stack to AWS
- `cdk destroy`: Remove stack from AWS

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review DynamoDB status table for processing history
3. Verify file format matches requirements
4. Check IAM permissions and resource configurations

## License

Internal use only - Financial Analytics Company
