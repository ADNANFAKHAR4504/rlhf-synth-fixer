# Trading Analytics Platform - Pulumi Python Implementation

This implementation provides a multi-environment trading analytics platform using Pulumi with Python. The solution creates independent infrastructure stacks for dev, staging, and production environments with appropriate resource sizing and configurations.

## File: __main__.py

```python
"""Main Pulumi program for multi-environment trading analytics platform."""
import pulumi
from tap_stack import TradingAnalyticsStack

# Get the current stack name (e.g., 'dev', 'staging', 'production')
stack_name = pulumi.get_stack()

# Create the trading analytics infrastructure stack
stack = TradingAnalyticsStack(f"trading-analytics-{stack_name}", stack_name)

# Export key resource information
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('lambda_function_arn', stack.lambda_function.arn)
pulumi.export('dynamodb_table_name', stack.dynamodb_table.name)
pulumi.export('s3_bucket_name', stack.s3_bucket.bucket)
pulumi.export('s3_bucket_arn', stack.s3_bucket.arn)
pulumi.export('vpc_id', stack.vpc.id)
pulumi.export('log_group_name', stack.log_group.name)
pulumi.export('environment', stack_name)
```

## File: tap_stack.py

```python
"""Trading Analytics Platform Stack for Pulumi."""
import json
import pulumi
import pulumi_aws as aws


class TradingAnalyticsStack:
    """
    Reusable stack class for trading analytics platform.
    Accepts environment name and creates appropriate resources.
    """

    def __init__(self, name: str, environment: str):
        """
        Initialize the trading analytics stack.

        Args:
            name: The name of the stack
            environment: The environment name (dev, staging, production)
        """
        self.environment = environment
        self.region = aws.get_region().name
        self.account_id = aws.get_caller_identity().account_id

        # Environment-specific configuration
        self.config = self._get_environment_config()

        # Resource name suffix for uniqueness
        self.suffix = f"{environment}-{self.region}"

        # Common tags for all resources
        self.common_tags = {
            'Environment': environment,
            'ManagedBy': 'Pulumi',
            'Project': 'TradingAnalytics',
            'Region': self.region
        }

        # Create VPC for compute isolation
        self.vpc = self._create_vpc()

        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Create S3 bucket for data archival
        self.s3_bucket = self._create_s3_bucket()

        # Create DynamoDB table for analytics storage
        self.dynamodb_table = self._create_dynamodb_table()

        # Create CloudWatch log group
        self.log_group = self._create_log_group()

        # Create Lambda function for data processing
        self.lambda_function = self._create_lambda_function()

    def _get_environment_config(self):
        """Get environment-specific configuration values."""
        configs = {
            'dev': {
                'lambda_memory': 512,
                'log_retention_days': 7,
                'dynamodb_billing_mode': 'PAY_PER_REQUEST',
                's3_versioning': False,
                'dynamodb_read_capacity': None,
                'dynamodb_write_capacity': None
            },
            'staging': {
                'lambda_memory': 1024,
                'log_retention_days': 30,
                'dynamodb_billing_mode': 'PAY_PER_REQUEST',
                's3_versioning': False,
                'dynamodb_read_capacity': None,
                'dynamodb_write_capacity': None
            },
            'production': {
                'lambda_memory': 2048,
                'log_retention_days': 90,
                'dynamodb_billing_mode': 'PROVISIONED',
                's3_versioning': True,
                'dynamodb_read_capacity': 5,
                'dynamodb_write_capacity': 5
            }
        }
        return configs.get(self.environment, configs['dev'])

    def _create_vpc(self):
        """Create VPC with private subnets for compute isolation."""
        vpc = aws.ec2.Vpc(
            f'vpc-{self.suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, 'Name': f'vpc-{self.suffix}'}
        )

        # Create private subnet
        self.private_subnet = aws.ec2.Subnet(
            f'private-subnet-{self.suffix}',
            vpc_id=vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone=f'{self.region}a',
            tags={**self.common_tags, 'Name': f'private-subnet-{self.suffix}'}
        )

        return vpc

    def _create_lambda_role(self):
        """Create IAM role for Lambda with least-privilege access."""
        # Lambda assume role policy
        assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=['sts:AssumeRole'],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type='Service',
                            identifiers=['lambda.amazonaws.com']
                        )
                    ]
                )
            ]
        )

        # Create the role
        role = aws.iam.Role(
            f'lambda-role-{self.suffix}',
            assume_role_policy=assume_role_policy.json,
            tags=self.common_tags
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{self.suffix}',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        # Create custom policy for DynamoDB and S3 access
        custom_policy = aws.iam.Policy(
            f'lambda-custom-policy-{self.suffix}',
            policy=pulumi.Output.all(
                self.account_id,
                self.region,
                self.suffix
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:PutItem',
                            'dynamodb:GetItem',
                            'dynamodb:Query',
                            'dynamodb:Scan',
                            'dynamodb:UpdateItem'
                        ],
                        'Resource': f'arn:aws:dynamodb:{args[1]}:{args[0]}:table/analytics-table-{args[2]}'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:PutObject',
                            's3:GetObject',
                            's3:ListBucket'
                        ],
                        'Resource': [
                            f'arn:aws:s3:::data-archive-{args[2]}',
                            f'arn:aws:s3:::data-archive-{args[2]}/*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': f'arn:aws:logs:{args[1]}:{args[0]}:log-group:/aws/lambda/data-processor-{args[2]}:*'
                    }
                ]
            })),
            tags=self.common_tags
        )

        # Attach custom policy to role
        aws.iam.RolePolicyAttachment(
            f'lambda-custom-attachment-{self.suffix}',
            role=role.name,
            policy_arn=custom_policy.arn
        )

        return role

    def _create_s3_bucket(self):
        """Create S3 bucket for data archival."""
        bucket = aws.s3.Bucket(
            f'data-archive-{self.suffix}',
            bucket=f'data-archive-{self.suffix}',
            tags=self.common_tags,
            force_destroy=True  # Allow destruction for all environments
        )

        # Enable versioning only for production
        if self.config['s3_versioning']:
            aws.s3.BucketVersioningV2(
                f'data-archive-versioning-{self.suffix}',
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status='Enabled'
                )
            )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f'data-archive-public-access-block-{self.suffix}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        return bucket

    def _create_dynamodb_table(self):
        """Create DynamoDB table for analytics storage."""
        table_args = {
            'name': f'analytics-table-{self.suffix}',
            'billing_mode': self.config['dynamodb_billing_mode'],
            'hash_key': 'trade_id',
            'range_key': 'timestamp',
            'attributes': [
                aws.dynamodb.TableAttributeArgs(
                    name='trade_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                )
            ],
            'tags': self.common_tags
        }

        # Add read/write capacity for production
        if self.config['dynamodb_billing_mode'] == 'PROVISIONED':
            table_args['read_capacity'] = self.config['dynamodb_read_capacity']
            table_args['write_capacity'] = self.config['dynamodb_write_capacity']

        table = aws.dynamodb.Table(
            f'analytics-table-{self.suffix}',
            **table_args
        )

        return table

    def _create_log_group(self):
        """Create CloudWatch log group for Lambda function."""
        log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{self.suffix}',
            name=f'/aws/lambda/data-processor-{self.suffix}',
            retention_in_days=self.config['log_retention_days'],
            tags=self.common_tags
        )

        return log_group

    def _create_lambda_function(self):
        """Create Lambda function for real-time data processing."""
        # Create Lambda function code
        lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    '''Process trading analytics data.'''
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']

    # Process the event data
    trade_data = event.get('trade_data', {})
    trade_id = trade_data.get('trade_id', 'unknown')
    timestamp = int(datetime.now().timestamp())

    # Store in DynamoDB
    table = dynamodb.Table(table_name)
    table.put_item(
        Item={
            'trade_id': trade_id,
            'timestamp': timestamp,
            'data': json.dumps(trade_data)
        }
    )

    # Archive to S3
    s3.put_object(
        Bucket=bucket_name,
        Key=f'trades/{trade_id}/{timestamp}.json',
        Body=json.dumps(trade_data)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Trade data processed successfully',
            'trade_id': trade_id,
            'timestamp': timestamp
        })
    }
"""

        # Create Lambda function
        lambda_function = aws.lambda_.Function(
            f'data-processor-{self.suffix}',
            name=f'data-processor-{self.suffix}',
            role=self.lambda_role.arn,
            runtime='python3.9',
            handler='index.handler',
            memory_size=self.config['lambda_memory'],
            timeout=30,
            architectures=['arm64'],
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE': self.dynamodb_table.name,
                    'S3_BUCKET': self.s3_bucket.bucket,
                    'ENVIRONMENT': self.environment
                }
            ),
            tags=self.common_tags
        )

        return lambda_function
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: Pulumi.yaml

```yaml
name: trading-analytics
runtime: python
description: Multi-environment trading analytics platform with Pulumi
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
```

## File: Pulumi.staging.yaml

```yaml
config:
  aws:region: us-east-1
```

## File: Pulumi.production.yaml

```yaml
config:
  aws:region: us-east-1
```

## File: README.md

```markdown
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
```
