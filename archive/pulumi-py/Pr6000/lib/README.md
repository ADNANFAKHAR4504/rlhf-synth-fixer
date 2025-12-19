# Multi-Environment Payment Processing Infrastructure

A Pulumi Python implementation for multi-environment payment processing infrastructure supporting both development and production deployments with environment-specific configurations.

## Overview

This project deploys a complete payment processing infrastructure on AWS with different configurations for development and production environments. The infrastructure includes:

- VPC with isolated networks per environment
- RDS PostgreSQL database with environment-specific sizing and encryption
- Lambda functions for payment processing
- API Gateway REST endpoints
- DynamoDB for session management
- S3 for document storage
- KMS for encryption key management
- CloudWatch for logging and monitoring
- Secrets Manager for credential storage

## Architecture

### Development Environment
- VPC CIDR: 10.0.0.0/16
- RDS Instance: db.t3.small (no encryption)
- Lambda: Standard concurrency
- DynamoDB: Provisioned billing (5 RCU/5 WCU)
- S3: Standard storage (no versioning)
- CloudWatch Logs: 7-day retention

### Production Environment
- VPC CIDR: 10.1.0.0/16
- RDS Instance: db.m5.large (encrypted with KMS)
- Lambda: Reserved concurrency (100 units)
- DynamoDB: On-demand billing
- S3: Versioning enabled, 90-day lifecycle
- CloudWatch Logs: 30-day retention
- Custom domain support for API Gateway

## Prerequisites

- Python 3.11+
- Pulumi CLI installed
- AWS credentials configured
- AWS CLI installed

## Project Structure

```
.
├── tap.py                  # Main Pulumi entry point
├── Pulumi.yaml            # Pulumi project configuration
├── lib/
│   ├── tap_stack.py       # Main stack orchestrator
│   ├── config.py          # Environment configuration
│   ├── networking.py      # VPC and networking resources
│   ├── database.py        # RDS PostgreSQL resources
│   ├── storage.py         # S3 and DynamoDB resources
│   ├── compute.py         # Lambda function resources
│   ├── api.py            # API Gateway resources
│   ├── monitoring.py      # CloudWatch resources
│   └── lambda/
│       └── index.py       # Lambda function handler
└── test/
    ├── unit/             # Unit tests
    └── integration/      # Integration tests
```

## Deployment

### Set Environment Suffix

```bash
export ENVIRONMENT_SUFFIX="dev123"  # or "prod456"
```

### Deploy Infrastructure

```bash
# Initialize Pulumi project (first time only)
pulumi stack init dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Get Outputs

```bash
# View all outputs
pulumi stack output

# Get specific outputs
pulumi stack output api_endpoint
pulumi stack output db_endpoint
```

## Configuration

Environment-specific configurations are automatically applied based on the `ENVIRONMENT_SUFFIX`:

- Development: Detected when suffix doesn't contain "prod"
- Production: Detected when suffix contains "prod"

## Key Features

### Environment-Based Configuration
- Single codebase supports multiple environments
- Automatic configuration selection based on environment suffix
- Environment-specific resource sizing and features

### Security
- Customer-managed KMS keys for encryption (production)
- Secrets Manager for credential storage
- IAM least-privilege policies
- VPC-isolated Lambda functions
- Security groups with minimal required access

### Cost Optimization
- No NAT Gateways (uses VPC endpoints where possible)
- Single AZ deployment for cost efficiency
- Provisioned capacity for dev, on-demand for prod
- Appropriate instance sizing per environment

### Monitoring
- CloudWatch log groups for all services
- Environment-specific retention periods
- Structured logging from Lambda functions

## Testing

### Run Unit Tests

```bash
cd test/unit
python -m pytest
```

### Run Integration Tests

```bash
cd test/integration
python -m pytest
```

## Outputs

The stack exports the following outputs:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `db_endpoint`: RDS database endpoint
- `db_secret_arn`: Secrets Manager ARN for database credentials
- `s3_bucket_name`: S3 bucket name for documents
- `dynamodb_table_name`: DynamoDB table name for sessions
- `lambda_function_arn`: Lambda function ARN
- `lambda_function_name`: Lambda function name
- `api_endpoint`: API Gateway endpoint URL
- `api_id`: API Gateway ID

## API Usage

### Process Payment Endpoint

```bash
curl -X POST https://{api_id}.execute-api.us-east-1.amazonaws.com/v1/process \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_123",
    "amount": 99.99,
    "currency": "USD"
  }'
```

Response:
```json
{
  "payment_id": "pay_123",
  "amount": 99.99,
  "currency": "USD",
  "status": "processed",
  "environment": "dev123",
  "message": "Payment processed successfully in dev123 environment"
}
```

## Cleanup

```bash
# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Environment Variables

The Lambda function uses these environment variables:

- `DB_SECRET_ARN`: ARN of the database credentials secret
- `DYNAMODB_TABLE`: Name of the DynamoDB session table
- `ENVIRONMENT`: Environment suffix for identification

## Compliance

Production configuration supports PCI DSS requirements:

- Encryption at rest for all data stores (RDS, S3, DynamoDB)
- Customer-managed KMS keys
- Secrets Manager for credential management
- CloudWatch logging for audit trails
- Network isolation with VPC

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/payment-processor-{environment_suffix} --follow
```

### Database Connection Issues

Verify security group rules and VPC configuration. Lambda must be in private subnets with access to RDS security group.

### API Gateway 5xx Errors

Check Lambda execution role permissions and verify Lambda function is correctly deployed.

## License

This infrastructure code is part of the TAP (Test Automation Platform) synthetic task generation project.
