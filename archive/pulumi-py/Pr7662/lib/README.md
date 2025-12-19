# Multi-Environment Infrastructure

This Pulumi Python project deploys consistent infrastructure across multiple AWS environments (dev, staging, production).

## Architecture

The infrastructure includes:

- **S3 Buckets**: Data storage with versioning, encryption, and lifecycle policies
- **Lambda Functions**: Python 3.9 runtime for data processing
- **DynamoDB Tables**: Metadata storage with GSI and point-in-time recovery
- **SNS Topics**: Notification system with email subscriptions
- **SQS Queues**: Task management with dead letter queues
- **IAM Roles**: Least privilege access policies

## Prerequisites

- Python 3.9 or later
- Pulumi CLI 3.x
- AWS CLI configured with credentials for target accounts
- AWS accounts for dev, staging, and production

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi for each environment:
```bash
# Initialize for dev
pulumi stack init dev
pulumi config set aws:region us-east-2

# Initialize for staging
pulumi stack init staging
pulumi config set aws:region us-west-1

# Initialize for production
pulumi stack init prod
pulumi config set aws:region us-east-1
```

## Configuration

Each environment uses a separate Pulumi stack configuration file:

- `Pulumi.dev.yaml` - Development environment (us-east-2, 512MB Lambda)
- `Pulumi.staging.yaml` - Staging environment (us-west-1, 512MB Lambda)
- `Pulumi.prod.yaml` - Production environment (us-east-1, 1024MB Lambda)

### Environment-Specific Parameters

Configure these values in each `Pulumi.<stack>.yaml` file:

```yaml
config:
  aws:region: <region>
  pulumi-infra:bucket_name: <bucket-name>
  pulumi-infra:lambda_memory: <memory-in-mb>
  pulumi-infra:table_name: <table-name>
  pulumi-infra:notification_email: <email-address>
  pulumi-infra:queue_name: <queue-name>
```

## Deployment

Deploy to each environment:

```bash
# Deploy to dev
pulumi stack select dev
export ENVIRONMENT_SUFFIX=dev
pulumi up

# Deploy to staging
pulumi stack select staging
export ENVIRONMENT_SUFFIX=staging
pulumi up

# Deploy to production
pulumi stack select prod
export ENVIRONMENT_SUFFIX=prod
pulumi up
```

## Validation

Validate configuration consistency:

```python
from lib.tap_stack import validate_configuration

results = validate_configuration()
print(results)
```

## Resource Naming

All resources include the environment suffix for uniqueness:

- S3 Bucket: `data-processing-<env>-<suffix>`
- Lambda: `data-processor-<suffix>`
- DynamoDB: `metadata-<env>-<suffix>`
- SNS: `data-processing-notifications-<suffix>`
- SQS: `task-queue-<env>-<suffix>`

## Outputs

Each stack exports:

- `bucket_name`, `bucket_arn` - S3 bucket identifiers
- `table_name`, `table_arn` - DynamoDB table identifiers
- `topic_arn` - SNS topic ARN
- `queue_url`, `queue_arn` - SQS queue identifiers
- `dlq_url`, `dlq_arn` - Dead letter queue identifiers
- `function_arn`, `function_name` - Lambda function identifiers
- `lambda_role_arn` - IAM role ARN

## Testing

Run tests:

```bash
pytest tests/ -v
```

## Cleanup

Destroy resources (all resources are fully destroyable):

```bash
pulumi stack select <environment>
pulumi destroy
```

## Key Features

- **Multi-Environment Consistency**: Identical infrastructure across all environments
- **Environment-Specific Configuration**: Memory sizes, emails, regions configurable per environment
- **Fully Destroyable**: No RETAIN policies, all resources can be cleanly removed
- **Least Privilege IAM**: Scoped policies using Pulumi resource interpolation
- **Production-Ready**: Versioning, encryption, monitoring, error handling included
