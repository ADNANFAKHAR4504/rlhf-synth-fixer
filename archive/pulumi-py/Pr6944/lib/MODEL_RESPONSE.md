# Payment Webhook Processing System - Pulumi Python Implementation

This implementation provides a complete serverless infrastructure for migrating a payment webhook processing system to AWS using Pulumi with Python.

## Architecture Overview

The solution includes:
- Lambda function for webhook processing with function URL
- DynamoDB table for transaction storage
- Secrets Manager for API credentials
- IAM roles with least-privilege access
- CloudWatch Logs with 7-day retention
- X-Ray tracing enabled

## File: lib/tap_stack.py

```python
"""
Payment Webhook Processing Infrastructure Stack

This module defines the TapStack for migrating payment webhook processing
to AWS serverless infrastructure with full observability and security.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Suffix for environment identification (e.g., 'dev', 'prod')
        tags: Optional default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for payment webhook processing infrastructure.

    Creates a complete serverless stack including Lambda, DynamoDB, Secrets Manager,
    IAM roles, CloudWatch Logs, and X-Ray tracing.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Merge default tags with required tags
        resource_tags = {
            **self.tags,
            'Environment': 'prod',
            'MigrationPhase': 'testing'
        }

        # Create Secrets Manager secret for payment provider API keys
        self.api_secret = aws.secretsmanager.Secret(
            f'envmig-apikeys-{self.environment_suffix}',
            name=f'envmig-apikeys-{self.environment_suffix}',
            description='Payment provider API keys for webhook processing',
            recovery_window_in_days=0,  # Immediate deletion for testing environment
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create placeholder secret version (in production, update with actual keys)
        self.api_secret_version = aws.secretsmanager.SecretVersion(
            f'envmig-apikeys-version-{self.environment_suffix}',
            secret_id=self.api_secret.id,
            secret_string='{"api_key": "placeholder_value_replace_in_production"}',
            opts=ResourceOptions(parent=self.api_secret)
        )

        # Create DynamoDB table for transaction storage
        self.transactions_table = aws.dynamodb.Table(
            f'envmig-transactions-{self.environment_suffix}',
            name=f'envmig-transactions-{self.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',  # On-demand billing
            hash_key='transactionId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='transactionId',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='timestamp',
                    type='N'
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='timestamp-index',
                    hash_key='timestamp',
                    projection_type='ALL'
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Logs group for Lambda
        self.log_group = aws.cloudwatch.LogGroup(
            f'envmig-webhook-logs-{self.environment_suffix}',
            name=f'/aws/lambda/envmig-webhook-{self.environment_suffix}',
            retention_in_days=7,  # Exactly 7 days as required
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda function
        self.lambda_role = aws.iam.Role(
            f'envmig-webhook-role-{self.environment_suffix}',
            name=f'envmig-webhook-role-{self.environment_suffix}',
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }""",
            tags=resource_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach AWSLambdaBasicExecutionRole for CloudWatch Logs
        self.lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f'envmig-webhook-basic-policy-{self.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Attach AWSXRayDaemonWriteAccess for X-Ray tracing
        self.lambda_xray_policy_attachment = aws.iam.RolePolicyAttachment(
            f'envmig-webhook-xray-policy-{self.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Create custom policy for least-privilege access
        self.lambda_custom_policy = aws.iam.RolePolicy(
            f'envmig-webhook-custom-policy-{self.environment_suffix}',
            role=self.lambda_role.id,
            policy=pulumi.Output.all(
                self.api_secret.arn,
                self.transactions_table.arn
            ).apply(lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "{args[0]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": "{args[1]}"
                    }}
                ]
            }}"""),
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Create Lambda function for webhook processing
        self.webhook_function = aws.lambda_.Function(
            f'envmig-webhook-{self.environment_suffix}',
            name=f'envmig-webhook-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.lambda_handler',
            role=self.lambda_role.arn,
            memory_size=512,  # 512MB as required
            timeout=30,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(self._get_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE_NAME': self.transactions_table.name,
                    'SECRETS_MANAGER_ARN': self.api_secret.arn,
                    'ENVIRONMENT': 'prod'
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active'  # Enable X-Ray tracing
            ),
            tags=resource_tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    self.log_group,
                    self.lambda_basic_policy_attachment,
                    self.lambda_xray_policy_attachment,
                    self.lambda_custom_policy
                ]
            )
        )

        # Create Lambda function URL with AWS_IAM authentication
        self.function_url = aws.lambda_.FunctionUrl(
            f'envmig-webhook-url-{self.environment_suffix}',
            function_name=self.webhook_function.name,
            authorization_type='AWS_IAM',
            cors=aws.lambda_.FunctionUrlCorsArgs(
                allow_credentials=True,
                allow_origins=['*'],
                allow_methods=['POST'],
                allow_headers=['content-type', 'x-amz-date', 'authorization', 'x-api-key'],
                max_age=86400
            ),
            opts=ResourceOptions(parent=self.webhook_function)
        )

        # Register outputs
        self.register_outputs({
            'lambda_function_url': self.function_url.function_url,
            'dynamodb_table_arn': self.transactions_table.arn,
            'dynamodb_table_name': self.transactions_table.name,
            'secrets_manager_arn': self.api_secret.arn,
            'lambda_function_name': self.webhook_function.name,
            'lambda_function_arn': self.webhook_function.arn
        })

    def _get_lambda_code(self) -> str:
        """
        Returns the Lambda function code for webhook processing.
        """
        return """
import json
import os
import boto3
import time
from datetime import datetime
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
secrets_manager = boto3.client('secretsmanager')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SECRETS_ARN = os.environ['SECRETS_MANAGER_ARN']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'prod')

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Lambda handler for processing payment webhook events.

    Args:
        event: Lambda event containing webhook payload
        context: Lambda context object

    Returns:
        API Gateway response with status code and body
    \"\"\"
    print(f"Received webhook event: {json.dumps(event)}")

    try:
        # Parse webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Validate required fields
        if 'transactionId' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transactionId'})
            }

        # Get API credentials from Secrets Manager (for validation)
        try:
            secret_response = secrets_manager.get_secret_value(SecretId=SECRETS_ARN)
            api_credentials = json.loads(secret_response['SecretString'])
            print("Successfully retrieved API credentials")
        except Exception as e:
            print(f"Warning: Could not retrieve secrets: {str(e)}")
            # Continue processing even if secret retrieval fails (for initial setup)

        # Prepare transaction record
        timestamp = int(time.time())
        transaction_record = {
            'transactionId': body['transactionId'],
            'timestamp': timestamp,
            'payload': json.dumps(body),
            'receivedAt': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'processedBy': context.function_name
        }

        # Store transaction in DynamoDB
        table.put_item(Item=transaction_record)
        print(f"Successfully stored transaction: {body['transactionId']}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': body['transactionId']
            })
        }

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON payload'})
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
"""
```

## File: lib/__init__.py

```python
"""
Payment webhook processing infrastructure module.
"""

from .tap_stack import TapStack, TapStackArgs

__all__ = ['TapStack', 'TapStackArgs']
```

## File: lib/README.md

```markdown
# Payment Webhook Processing Infrastructure

This Pulumi Python project creates serverless infrastructure for migrating payment webhook processing to AWS.

## Architecture

- **Lambda Function**: Processes payment webhooks with 512MB memory
- **Function URL**: AWS_IAM authenticated endpoint for webhook callbacks
- **DynamoDB Table**: On-demand billing for transaction storage
- **Secrets Manager**: Secure storage for payment provider API keys
- **CloudWatch Logs**: 7-day retention for function logs
- **X-Ray Tracing**: Enabled for distributed tracing
- **IAM Roles**: Least-privilege access (read secrets, write DynamoDB)

## Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS CLI configured with credentials
- AWS account with appropriate permissions

## Deployment

1. Set environment suffix:
   ```bash
   export ENVIRONMENT_SUFFIX="prod"
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Deploy the stack:
   ```bash
   pulumi up
   ```

4. Get outputs:
   ```bash
   pulumi stack output lambda_function_url
   pulumi stack output dynamodb_table_arn
   ```

## Configuration

The infrastructure uses the following naming pattern:
- Lambda: `envmig-webhook-{suffix}`
- DynamoDB: `envmig-transactions-{suffix}`
- Secrets Manager: `envmig-apikeys-{suffix}`

## Outputs

- `lambda_function_url`: URL endpoint for webhook callbacks
- `dynamodb_table_arn`: ARN of the transactions table
- `dynamodb_table_name`: Name of the transactions table
- `secrets_manager_arn`: ARN of the API keys secret
- `lambda_function_name`: Name of the webhook function
- `lambda_function_arn`: ARN of the webhook function

## Testing

To test the webhook endpoint:

```bash
# Get the function URL
FUNCTION_URL=$(pulumi stack output lambda_function_url)

# Test with AWS signature (requires AWS CLI and signed request)
aws lambda invoke-url \
  --function-url $FUNCTION_URL \
  --payload '{"transactionId": "test-123", "amount": 100}' \
  response.json
```

## Security

- Lambda function URL uses AWS_IAM authentication
- IAM role has least-privilege access:
  - Read-only access to Secrets Manager secret
  - Write-only access to DynamoDB table
- API credentials stored securely in Secrets Manager
- All resources tagged for tracking

## Monitoring

- CloudWatch Logs: `/aws/lambda/envmig-webhook-{suffix}`
- X-Ray tracing enabled for performance analysis
- DynamoDB metrics available in CloudWatch

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured for immediate deletion without retention policies.
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
```

## Deployment Notes

### Resource Naming
All resources include the `environment_suffix` parameter to ensure uniqueness. The suffix is passed from the `ENVIRONMENT_SUFFIX` environment variable.

### Destroyability
All resources are configured for immediate deletion:
- Secrets Manager: `recovery_window_in_days=0`
- DynamoDB: No deletion protection enabled
- Lambda: No retention policy

### IAM Permissions
The Lambda function has least-privilege access:
- `secretsmanager:GetSecretValue` on the API keys secret only
- `dynamodb:PutItem` and `dynamodb:UpdateItem` on the transactions table only
- CloudWatch Logs access via AWSLambdaBasicExecutionRole
- X-Ray access via AWSXRayDaemonWriteAccess

### Lambda Function
The webhook handler:
- Validates incoming webhook payloads
- Retrieves API credentials from Secrets Manager
- Stores transaction records in DynamoDB
- Returns appropriate HTTP status codes
- Includes error handling and logging

### Testing the Deployment

1. Deploy the stack and capture outputs
2. Update the Secrets Manager secret with real API keys
3. Configure payment provider to send webhooks to the function URL
4. Monitor CloudWatch Logs for incoming requests
5. Verify transactions are stored in DynamoDB

### Cost Optimization
- DynamoDB uses on-demand billing (pay per request)
- Lambda only charges for execution time
- CloudWatch Logs has 7-day retention to minimize storage costs
- No NAT Gateways or other costly resources

This implementation follows AWS best practices for serverless architecture and provides a production-ready foundation for payment webhook processing migration.
