# Multi-Environment Infrastructure Deployment - Implementation

This implementation provides a complete Pulumi Python solution for deploying identical infrastructure across development, staging, and production environments with configuration-driven differences.

## Architecture Overview

The solution uses Pulumi's stack mechanism to manage multiple environments from a single codebase. Each environment (dev, staging, production) has its own stack configuration file that defines environment-specific values like memory sizes, retention periods, and other settings.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Multi-environment infrastructure stack for deploying consistent infrastructure
across development, staging, and production environments.
"""

from typing import Optional, Dict, Any
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Environment identifier (dev, staging, production)
        lambda_memory_mb: Memory allocation for Lambda functions
        log_retention_days: CloudWatch log retention period
        enable_versioning: Whether to enable S3 versioning
        tags: Additional tags to apply to resources
    """

    def __init__(
        self,
        environment_suffix: str,
        lambda_memory_mb: int = 512,
        log_retention_days: int = 7,
        enable_versioning: bool = False,
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.lambda_memory_mb = lambda_memory_mb
        self.log_retention_days = log_retention_days
        self.enable_versioning = enable_versioning
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi ComponentResource for multi-environment infrastructure.

    This component creates identical infrastructure across different environments
    with configuration-driven differences for environment-specific settings.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        child_opts = ResourceOptions(parent=self)

        # Merge environment tags with provided tags
        resource_tags = {
            'Environment': args.environment_suffix,
            'ManagedBy': 'Pulumi',
            **args.tags
        }

        # Create S3 bucket for storage
        self.bucket = aws.s3.Bucket(
            f'storage-bucket-{args.environment_suffix}',
            bucket=f'tap-storage-{args.environment_suffix}',
            versioning=aws.s3.BucketVersioningArgs(
                enabled=args.enable_versioning
            ),
            tags=resource_tags,
            opts=child_opts
        )

        # Block public access to S3 bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f'storage-bucket-public-access-{args.environment_suffix}',
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=child_opts
        )

        # Create IAM role for Lambda execution
        lambda_role = aws.iam.Role(
            f'lambda-execution-role-{args.environment_suffix}',
            name=f'tap-lambda-execution-{args.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags=resource_tags,
            opts=child_opts
        )

        # Attach basic Lambda execution policy
        lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{args.environment_suffix}',
            role=lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=child_opts
        )

        # Create custom policy for S3 access
        lambda_s3_policy = aws.iam.Policy(
            f'lambda-s3-policy-{args.environment_suffix}',
            name=f'tap-lambda-s3-access-{args.environment_suffix}',
            policy=self.bucket.arn.apply(lambda arn: json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObject',
                        's3:PutObject',
                        's3:ListBucket'
                    ],
                    'Resource': [
                        arn,
                        f'{arn}/*'
                    ]
                }]
            })),
            tags=resource_tags,
            opts=child_opts
        )

        # Attach S3 policy to Lambda role
        lambda_s3_policy_attachment = aws.iam.RolePolicyAttachment(
            f'lambda-s3-policy-attachment-{args.environment_suffix}',
            role=lambda_role.name,
            policy_arn=lambda_s3_policy.arn,
            opts=child_opts
        )

        # Create CloudWatch log group for Lambda
        self.log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{args.environment_suffix}',
            name=f'/aws/lambda/tap-processor-{args.environment_suffix}',
            retention_in_days=args.log_retention_days,
            tags=resource_tags,
            opts=child_opts
        )

        # Create Lambda function for data processing
        self.lambda_function = aws.lambda_.Function(
            f'processor-lambda-{args.environment_suffix}',
            name=f'tap-processor-{args.environment_suffix}',
            role=lambda_role.arn,
            runtime='python3.11',
            handler='index.handler',
            memory_size=args.lambda_memory_mb,
            timeout=30,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset("""
import json
import boto3
import os

s3_client = boto3.client('s3')

def handler(event, context):
    '''
    Process data and store results in S3.
    '''
    bucket_name = os.environ.get('BUCKET_NAME')
    environment = os.environ.get('ENVIRONMENT')

    print(f'Processing data in {environment} environment')

    # Sample processing logic
    result = {
        'status': 'success',
        'environment': environment,
        'message': 'Data processed successfully'
    }

    # Store result in S3
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f'results/{environment}/latest.json',
            Body=json.dumps(result),
            ContentType='application/json'
        )
    except Exception as e:
        print(f'Error storing result: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

    return {
        'statusCode': 200,
        'body': json.dumps(result)
    }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.bucket.id,
                    'ENVIRONMENT': args.environment_suffix,
                }
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    lambda_basic_policy_attachment,
                    lambda_s3_policy_attachment,
                    self.log_group
                ]
            )
        )

        # Create CloudWatch metric alarm for Lambda errors
        self.error_alarm = aws.cloudwatch.MetricAlarm(
            f'lambda-error-alarm-{args.environment_suffix}',
            name=f'tap-lambda-errors-{args.environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Errors',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=5,
            alarm_description=f'Lambda error count exceeded in {args.environment_suffix}',
            dimensions={
                'FunctionName': self.lambda_function.name
            },
            tags=resource_tags,
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'bucket_name': self.bucket.id,
            'lambda_function_name': self.lambda_function.name,
            'lambda_function_arn': self.lambda_function.arn,
            'log_group_name': self.log_group.name,
            'environment': args.environment_suffix
        })
```

## File: Pulumi.yaml

```yaml
name: tap-infrastructure
runtime: python
description: Multi-environment infrastructure deployment with Pulumi

config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
```

## File: Pulumi.dev.yaml

```yaml
config:
  tap-infrastructure:lambda_memory_mb: "512"
  tap-infrastructure:log_retention_days: "7"
  tap-infrastructure:enable_versioning: "false"
  tap-infrastructure:environment_suffix: "dev"
```

## File: Pulumi.staging.yaml

```yaml
config:
  tap-infrastructure:lambda_memory_mb: "1024"
  tap-infrastructure:log_retention_days: "30"
  tap-infrastructure:enable_versioning: "false"
  tap-infrastructure:environment_suffix: "staging"
```

## File: Pulumi.production.yaml

```yaml
config:
  tap-infrastructure:lambda_memory_mb: "2048"
  tap-infrastructure:log_retention_days: "90"
  tap-infrastructure:enable_versioning: "true"
  tap-infrastructure:environment_suffix: "production"
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for multi-environment infrastructure.

This module instantiates the TapStack with configuration from the active
Pulumi stack (dev, staging, or production).
"""
import os
from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('environment_suffix') or 'dev'

# Get environment-specific configuration
lambda_memory_mb = config.get_int('lambda_memory_mb') or 512
log_retention_days = config.get_int('log_retention_days') or 7
enable_versioning = config.get_bool('enable_versioning') or False

# Deployment metadata
repository_name = os.getenv('REPOSITORY', 'tap-infrastructure')
commit_author = os.getenv('COMMIT_AUTHOR', 'system')
pr_number = os.getenv('PR_NUMBER', 'local')
team = os.getenv('TEAM', 'platform')
created_at = datetime.now(timezone.utc).isoformat()

# Default tags for all resources
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
    'PRNumber': pr_number,
    'Team': team,
    'CreatedAt': created_at,
}

# Configure AWS provider with default tags
provider = aws.Provider(
    'aws',
    region=os.getenv('AWS_REGION', 'us-east-1'),
    default_tags=aws.ProviderDefaultTagsArgs(
        tags=default_tags
    )
)

# Create the infrastructure stack
stack = TapStack(
    name=f'tap-stack-{environment_suffix}',
    args=TapStackArgs(
        environment_suffix=environment_suffix,
        lambda_memory_mb=lambda_memory_mb,
        log_retention_days=log_retention_days,
        enable_versioning=enable_versioning,
        tags=default_tags
    ),
    opts=ResourceOptions(provider=provider)
)

# Export stack outputs
pulumi.export('environment', environment_suffix)
pulumi.export('bucket_name', stack.bucket.id)
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('lambda_function_arn', stack.lambda_function.arn)
pulumi.export('log_group_name', stack.log_group.name)
```

## File: lib/__init__.py

```python
"""
TAP Infrastructure Library

Multi-environment infrastructure components for Pulumi.
"""

__version__ = '1.0.0'
```

## File: lib/README.md

```markdown
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
```

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   pip install pulumi pulumi-aws
   ```

2. **Initialize Stacks**:
   ```bash
   pulumi stack init dev
   pulumi stack init staging
   pulumi stack init production
   ```

3. **Deploy to Each Environment**:
   ```bash
   # Development
   pulumi stack select dev
   pulumi up

   # Staging
   pulumi stack select staging
   pulumi up

   # Production
   pulumi stack select production
   pulumi up
   ```

4. **Verify Deployment**:
   ```bash
   pulumi stack output
   aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `tap-processor`)]'
   ```

## Key Features

1. **Identical Infrastructure**: Same code deploys to all environments
2. **Configuration-Driven**: Environment differences controlled by stack YAML files
3. **Environment Isolation**: Separate state files and AWS resources per environment
4. **Resource Naming**: All resources include environment suffix for uniqueness
5. **Cost Optimization**: Environment-appropriate resource sizing
6. **Destroyability**: All resources can be cleanly torn down
7. **Monitoring**: CloudWatch alarms per environment
8. **Security**: Least-privilege IAM, blocked public access

## Configuration Drift Prevention

- Single source of truth in code repository
- Infrastructure changes require code changes
- Pulumi state tracks actual vs desired state
- No manual AWS console changes
- Stack configurations version-controlled
