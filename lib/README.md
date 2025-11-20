# Trading Analytics Platform - Pulumi Python

Multi-environment trading analytics platform for migrating legacy on-premises systems to AWS.

## Architecture

This solution deploys a complete trading analytics infrastructure across three independent environments:

- **Dev**: Minimal resources for development (512MB Lambda, 7-day logs)
- **Staging**: Mid-tier resources for testing (1024MB Lambda, 30-day logs)
- **Production**: Full-scale resources for live trading (2048MB Lambda, 90-day logs, versioning enabled)

### Components

- **Lambda Function**: Real-time data processing with ARM64 architecture
- **DynamoDB Table**: Analytics result storage with environment-specific billing
- **S3 Bucket**: Historical data archival with production-only versioning
- **VPC**: Isolated network per environment with private subnets
- **IAM Roles**: Least-privilege access for Lambda-DynamoDB-S3 integration
- **CloudWatch Logs**: Environment-specific retention periods

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions for Lambda, DynamoDB, S3, VPC, IAM, CloudWatch

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi backend (optional - for remote state):
```bash
pulumi login s3://your-pulumi-state-bucket
```

## Deployment

### Deploy Development Environment

```bash
pulumi stack init dev
pulumi stack select dev
pulumi up
```

### Deploy Staging Environment

```bash
pulumi stack init staging
pulumi stack select staging
pulumi up
```

### Deploy Production Environment

```bash
pulumi stack init production
pulumi stack select production
pulumi up
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{region}`

Examples:
- `data-processor-dev-us-east-1` (Lambda function)
- `analytics-table-production-us-east-1` (DynamoDB table)
- `data-archive-staging-us-east-1` (S3 bucket)

## Environment-Specific Configurations

| Configuration | Dev | Staging | Production |
|--------------|-----|---------|------------|
| Lambda Memory | 512MB | 1024MB | 2048MB |
| Lambda Architecture | ARM64 | ARM64 | ARM64 |
| DynamoDB Billing | On-Demand | On-Demand | Provisioned |
| S3 Versioning | Disabled | Disabled | Enabled |
| Log Retention | 7 days | 30 days | 90 days |
| VPC Isolation | Yes | Yes | Yes |

## Testing the Deployment

Invoke the Lambda function with test data:

```bash
aws lambda invoke \
  --function-name data-processor-dev-us-east-1 \
  --payload '{"trade_data": {"trade_id": "TEST123", "amount": 1000}}' \
  response.json
```

## Cleanup

To destroy an environment:

```bash
pulumi stack select dev
pulumi destroy
```

## Security Features

- Least-privilege IAM policies (no wildcard actions)
- Private VPC subnets for compute isolation
- S3 bucket public access blocked
- Environment-specific resource tagging
- ARM64 architecture for cost optimization

## State Management

Each environment maintains isolated state files. When using remote backend:

- Dev: `s3://bucket/trading-analytics/dev`
- Staging: `s3://bucket/trading-analytics/staging`
- Production: `s3://bucket/trading-analytics/production`

## Outputs

Each deployment exports:
- `lambda_function_name`: Name of the data processor function
- `lambda_function_arn`: ARN of the Lambda function
- `dynamodb_table_name`: Name of the analytics table
- `s3_bucket_name`: Name of the archive bucket
- `vpc_id`: VPC identifier
- `log_group_name`: CloudWatch log group name
- `environment`: Current environment name
