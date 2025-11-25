# Multi-Environment Infrastructure

This Pulumi Python project deploys identical infrastructure across development, staging, and production environments with configuration-driven differences.

## Architecture

The solution uses:
- **S3**: Storage buckets with environment-specific versioning
- **Lambda**: Serverless compute with environment-specific memory allocation
- **CloudWatch**: Logging and monitoring with environment-specific retention
- **IAM**: Least-privilege roles and policies
- **CloudWatch Alarms**: Error monitoring per environment

## Configuration

Each environment has its own stack file:
- `Pulumi.dev.yaml`: Development (512MB Lambda, 7-day logs, no versioning)
- `Pulumi.staging.yaml`: Staging (1024MB Lambda, 30-day logs, no versioning)
- `Pulumi.production.yaml`: Production (2048MB Lambda, 90-day logs, S3 versioning enabled)

## Deployment

### Prerequisites
- Python 3.9+
- Pulumi CLI installed
- AWS credentials configured

### Deploy to Development
```bash
export ENVIRONMENT_SUFFIX=dev
pulumi stack select dev  # or pulumi stack init dev if first time
pulumi up
```

### Deploy to Staging
```bash
export ENVIRONMENT_SUFFIX=staging
pulumi stack select staging  # or pulumi stack init staging if first time
pulumi up
```

### Deploy to Production
```bash
export ENVIRONMENT_SUFFIX=production
pulumi stack select production  # or pulumi stack init production if first time
pulumi up
```

## Destroying Infrastructure

To tear down an environment:
```bash
pulumi stack select <environment>
pulumi destroy
```

## Environment Isolation

Each environment:
- Has independent state files managed by Pulumi
- Uses separate AWS resources (no sharing)
- Applies environment-specific configurations
- Can be deployed/destroyed independently

## Resource Naming

All resources follow the pattern: `{service}-{resource}-{environment}`

Examples:
- `tap-storage-dev` (S3 bucket in dev)
- `tap-processor-staging` (Lambda in staging)
- `/aws/lambda/tap-processor-production` (CloudWatch log group in production)

## Configuration Options

Configurable per environment in stack YAML files:
- `lambda_memory_mb`: Lambda memory allocation (MB)
- `log_retention_days`: CloudWatch log retention period (days)
- `enable_versioning`: Enable S3 versioning (boolean)
- `environment_suffix`: Environment identifier (string)

## Outputs

After deployment, the stack exports:
- `environment`: Current environment name
- `bucket_name`: S3 bucket name
- `lambda_function_name`: Lambda function name
- `lambda_function_arn`: Lambda function ARN
- `log_group_name`: CloudWatch log group name

View outputs:
```bash
pulumi stack output
```

## Testing Lambda Function

Invoke the Lambda function:
```bash
aws lambda invoke \
  --function-name tap-processor-dev \
  --payload '{}' \
  response.json
```

## Monitoring

CloudWatch alarms monitor Lambda errors. Check alarms:
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix tap-lambda-errors
```

## Cost Optimization

- Development uses minimal resources (512MB Lambda, 7-day logs)
- Staging uses moderate resources (1024MB Lambda, 30-day logs)
- Production uses full resources (2048MB Lambda, 90-day logs, S3 versioning)
- All Lambda functions can scale to zero when not in use

## Security

- S3 buckets have public access blocked
- IAM roles follow least-privilege principle
- No wildcard actions in IAM policies
- All resources tagged with environment identifier
- Separate resources per environment (no cross-environment access)
