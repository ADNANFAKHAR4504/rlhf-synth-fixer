# AWS Serverless Application with CDK Python

This solution creates a serverless AWS application using CDK Python that meets all requirements including VPC deployment, DynamoDB integration, API Gateway, and CloudWatch monitoring.

## Project Structure

```
├── tap.py                    # CDK app entry point
├── lib/
│   ├── __init__.py
│   ├── tap_stack.py         # Main orchestration stack
│   ├── metadata_stack.py    # Serverless infrastructure stack
│   └── lambda/
│       └── handler.py       # Lambda function code
├── tests/
│   ├── unit/
│   │   └── test_tap_stack.py
│   └── integration/
│       └── test_tap_stack.py
├── cdk.json                 # CDK configuration
├── Pipfile                  # Python dependencies
└── metadata.json           # Project metadata
```

## Implementation

### Main Stack - tap_stack.py

The TapStack orchestrates the ServerlessStack and exposes outputs.

### Serverless Infrastructure - metadata_stack.py

Creates:
- VPC with 2 AZs and public subnets
- DynamoDB table with on-demand billing
- Lambda function with VPC integration
- API Gateway REST API with /item endpoint
- CloudWatch alarm for error monitoring

### Lambda Function - handler.py

Handles GET /item requests:
- Reads TABLE_NAME from environment
- Creates items in DynamoDB
- Returns JSON response with CORS headers
- Comprehensive error handling

## Key Features

### 1. VPC Configuration
- VPC with 2 availability zones
- Public subnets with Internet Gateway routes
- Lambda security group with outbound access

### 2. DynamoDB Table
- Partition key: itemId
- On-demand billing mode
- IAM permissions for Lambda write access

### 3. Lambda Function
- Python 3.9 runtime
- VPC deployment with allow_public_subnet=True
- Environment variables for table name
- Proper IAM role with VPC and DynamoDB permissions

### 4. API Gateway
- REST API with CORS enabled
- GET /item endpoint
- Lambda proxy integration

### 5. CloudWatch Monitoring
- Alarm on Lambda errors
- Threshold: 1 error
- Evaluation period: 1

### 6. IAM Security
- Least privilege principle
- Network interface permissions for VPC Lambda
- DynamoDB write-only access
- CloudWatch logs access

## Deployment

```bash
# Install dependencies
pipenv install

# Synthesize
npx cdk synth --context environmentSuffix=dev

# Deploy
npx cdk deploy --all --require-approval never

# Destroy
npx cdk destroy --all --force
```
