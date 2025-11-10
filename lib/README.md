# Multi-Environment Payment Processing Infrastructure

This Pulumi Python project deploys a complete payment processing infrastructure across multiple environments (dev, staging, production).

## Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Deployment

### Development Environment
```bash
pulumi stack select dev
pulumi up
```

### Staging Environment
```bash
pulumi stack select staging
pulumi up
```

### Production Environment
```bash
pulumi stack select prod
pulumi up
```

## Infrastructure Components

- **VPC**: Isolated network per environment with non-overlapping CIDR ranges
- **Subnets**: Public and private subnets across 2 availability zones
- **API Gateway**: REST API for payment processing endpoints
- **Lambda**: Python 3.11 functions for payment processing logic
- **DynamoDB**: Transaction storage with point-in-time recovery
- **RDS PostgreSQL**: Customer data with Multi-AZ in production
- **S3**: Audit log storage with versioning and encryption
- **Systems Manager**: Parameter Store for secrets management
- **CloudWatch**: Logging and monitoring

## Configuration

Environment-specific settings are defined in:
- `Pulumi.dev.yaml` - Development configuration
- `Pulumi.staging.yaml` - Staging configuration
- `Pulumi.prod.yaml` - Production configuration

## Outputs

After deployment, the following outputs are available:
- `vpc_id` - VPC identifier
- `public_subnet_ids` - Public subnet identifiers
- `private_subnet_ids` - Private subnet identifiers
- `api_gateway_url` - API Gateway endpoint URL
- `dynamodb_table_name` - DynamoDB table name
- `rds_endpoint` - RDS database endpoint
- `audit_bucket_name` - S3 audit bucket name
- `lambda_function_name` - Lambda function name

## Cleanup

To destroy the infrastructure:
```bash
pulumi destroy
```
