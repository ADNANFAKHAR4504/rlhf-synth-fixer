# Transaction Processing API

A serverless transaction processing API built with CDKTF (Python), AWS Lambda, S3, and API Gateway.

## Architecture

- **Lambda Functions**: Handle upload, processing, and status queries (ZIP packages)
- **S3 Bucket**: Store transaction files with versioning and encryption
- **API Gateway**: REST API with three endpoints
- **IAM**: Proper roles and policies for Lambda execution

## Deployment

### Prerequisites

- AWS CLI configured with valid credentials
- Terraform installed
- Python 3.9+ with pipenv
- Node.js (for CDKTF CLI)

### Deploy Infrastructure

```bash
# Install dependencies
pipenv install --dev

# Synthesize Terraform configuration
cdktf synth

# Deploy to AWS
cdktf deploy --auto-approve
```

### API Endpoints

After deployment, the API Gateway URL will be output. Use these endpoints:

1. **Upload Transaction**
   ```bash
   POST {api_url}/upload
   Body: {
     "transactionId": "txn-123",
     "fileContent": "{\"amount\": 100}"
   }
   ```

2. **Process Transaction**
   ```bash
   GET {api_url}/process/txn-123
   ```

3. **Check Status**
   ```bash
   GET {api_url}/status/txn-123
   ```

## Testing

```bash
# Run unit tests
pipenv run pytest test/ -v

# Run integration tests
pipenv run pytest test/ -m integration -v

# Check coverage
pipenv run pytest test/ --cov --cov-report=term-missing
```

## Cleanup

```bash
cdktf destroy --auto-approve
```

## Key Features

- Lambda functions use ZIP packages (not container images)
- Unique S3 bucket names with environmentSuffix variable
- Proper API Gateway integrations with depends_on
- IAM least-privilege access policies
- Server-side encryption and versioning on S3
