# Ideal Response - Transaction Processing Pipeline

This document contains the corrected, production-ready infrastructure code for the transaction processing pipeline.

## Implementation

The infrastructure has been implemented using the TapStack component pattern in `lib/tap_stack.py`. This follows Pulumi best practices by organizing resources into a reusable component.

## File: lib/tap_stack.py

The main implementation file containing all infrastructure resources. Key improvements over the initial MODEL_RESPONSE:

1. **Component-Based Architecture**: Uses Pulumi ComponentResource pattern for better organization
2. **Resource Hierarchy**: All resources properly parented to the TapStack component
3. **Dependency Management**: Explicit dependencies using ResourceOptions
4. **Environment Suffix Integration**: All resource names include environment_suffix for uniqueness
5. **Private Methods**: Lambda and API Gateway creation organized into private methods
6. **Output Registration**: Proper output registration for stack exports

## Key Resources Created

### Storage & Database
- **S3 Bucket**: `transaction-uploads-{environmentSuffix}` with versioning and 90-day lifecycle
- **DynamoDB Table**: `transactions-{environmentSuffix}` with streams enabled
- **SNS Topic**: `transaction-alerts-{environmentSuffix}` for anomaly alerts

### Lambda Functions
1. **Validation Lambda**: `validation-lambda-{environmentSuffix}`
   - Handler: validation.handler
   - Runtime: Python 3.9
   - Memory: 512MB
   - Concurrent Executions: 10
   - Triggers: S3 uploads to /uploads/*.csv

2. **Anomaly Detection Lambda**: `anomaly-lambda-{environmentSuffix}`
   - Handler: anomaly_detection.handler
   - Runtime: Python 3.9
   - Memory: 512MB
   - Concurrent Executions: 10
   - Triggers: DynamoDB Streams

3. **API Lambda**: `api-lambda-{environmentSuffix}`
   - Handler: api_handler.handler
   - Runtime: Python 3.9
   - Memory: 512MB
   - Concurrent Executions: 10
   - Triggers: API Gateway

### IAM Roles & Policies
Each Lambda function has dedicated IAM role with least-privilege policies:
- S3 read permissions for validation Lambda
- DynamoDB read/write permissions as needed
- SNS publish permissions for anomaly Lambda
- CloudWatch Logs permissions for all
- X-Ray tracing permissions for all

### CloudWatch Logs
Each Lambda has dedicated log group with 7-day retention:
- `/aws/lambda/validation-lambda-{environmentSuffix}`
- `/aws/lambda/anomaly-lambda-{environmentSuffix}`
- `/aws/lambda/api-lambda-{environmentSuffix}`

### API Gateway
- **REST API**: `transaction-api-{environmentSuffix}`
- **Endpoints**:
  - POST /upload - Generate presigned S3 URLs
  - GET /status/{transaction_id} - Check transaction status
- **Authentication**: API key required
- **Stage**: prod with X-Ray tracing enabled
- **Usage Plan**: 10,000 requests/month, 1000 req/sec rate limit

## Lambda Function Code

### File: lambda/validation.py
Validates CSV transaction files uploaded to S3:
- Reads CSV files from S3
- Validates required fields (transaction_id, amount, merchant_id, card_number)
- Stores validated transactions in DynamoDB
- Masks sensitive card data (stores only last 4 digits)
- Returns processing statistics

### File: lambda/anomaly_detection.py
Detects anomalies in transaction stream:
- Processes DynamoDB stream events
- Applies anomaly detection rules:
  - High transaction amount (> $10,000)
  - Suspicious low amount (< $1)
- Sends SNS alerts for detected anomalies
- Returns anomaly count

### File: lambda/api_handler.py
Handles API Gateway requests:
- **POST /upload**: Generates presigned S3 URLs for file upload (15 min expiry)
- **GET /status/{transaction_id}**: Queries DynamoDB for transaction status
- Includes CORS headers
- Converts Decimal types for JSON serialization

## Configuration Files

### File: Pulumi.yaml
```yaml
name: pulumi-infra
runtime:
  name: python
description: Pulumi infrastructure for TAP
main: tap.py
```

### File: requirements.txt
```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<8.0.0
pulumi-awsx>=2.0.0,<4.0.0
```

### File: tap.py
Entry point that instantiates TapStack with environment configuration:
- Reads environment suffix from ENV or config
- Sets default tags (Environment, Repository, Author)
- Creates TapStack with proper configuration

## Stack Outputs

The stack exports the following outputs:
- `bucket_name`: S3 bucket name for file uploads
- `dynamodb_table_name`: DynamoDB table name
- `sns_topic_arn`: SNS topic ARN for alerts
- `api_endpoint`: API Gateway endpoint URL
- `api_key_id`: API key ID for authentication

## Testing & Validation

The infrastructure can be validated using:
```bash
# Validate Pulumi code
pulumi preview

# Deploy infrastructure
pulumi up

# Run validation script
bash scripts/pre-validate-iac.sh
```

## Security Considerations

1. **IAM Policies**: Least privilege access for each Lambda function
2. **Data Masking**: Credit card numbers masked (last 4 digits only)
3. **API Authentication**: API key required for all endpoints
4. **Encryption**: S3 versioning enabled, DynamoDB encryption at rest
5. **X-Ray Tracing**: Enabled for debugging and monitoring

## Cost Optimization

1. **Serverless Architecture**: Pay per use, no idle costs
2. **DynamoDB On-Demand**: Pay per request, no provisioned capacity
3. **S3 Lifecycle**: 90-day expiration reduces storage costs
4. **Reserved Concurrency**: Limited to 10 to prevent runaway costs
5. **CloudWatch Logs**: 7-day retention limits log storage costs

## Compliance & Auditing

1. **Versioning**: S3 versioning enabled for audit trails
2. **Logging**: All Lambda functions log to CloudWatch
3. **Tracing**: X-Ray distributed tracing for request tracking
4. **DynamoDB Streams**: Full transaction history captured
5. **Tags**: All resources tagged for cost allocation

## Deployment Instructions

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure Pulumi:
   ```bash
   pulumi config set aws:region us-east-1
   pulumi config set env <environment-suffix>
   ```

3. Deploy stack:
   ```bash
   pulumi up
   ```

4. Retrieve API key:
   ```bash
   pulumi stack output api_key_id
   aws apigateway get-api-key --api-key <api_key_id> --include-value
   ```

5. Test endpoints:
   ```bash
   # Request presigned URL
   curl -X POST https://<api-endpoint>/upload \
     -H "x-api-key: <your-api-key>"

   # Check transaction status
   curl https://<api-endpoint>/status/<transaction-id> \
     -H "x-api-key: <your-api-key>"
   ```

## Next Steps

This infrastructure is ready for:
1. Unit testing (Phase 3 - QA validation)
2. Integration testing with sample CSV files
3. Load testing to validate 5-minute SLA
4. Security scanning and compliance checks
5. Production deployment
