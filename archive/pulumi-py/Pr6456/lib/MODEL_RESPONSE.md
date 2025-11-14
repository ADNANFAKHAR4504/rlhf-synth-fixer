# Payment Webhook Processor - Pulumi Python Implementation

This implementation creates a serverless payment webhook processing system using Pulumi with Python, including Lambda functions for Stripe and PayPal webhooks, DynamoDB for transaction storage, and complete monitoring with CloudWatch and X-Ray.

## File: __main__.py

```python
import pulumi
import pulumi_aws as aws
import json
import os

# Get configuration
config = pulumi.Config()
environment_suffix = config.require("environment_suffix")
aws_region = config.get("aws_region") or "us-east-1"

# Set AWS provider region
aws_provider = aws.Provider("aws-provider", region=aws_region)

# DynamoDB Table for Payment Transactions
payment_transactions_table = aws.dynamodb.Table(
    f"payment-transactions-{environment_suffix}",
    name=f"PaymentTransactions-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="transactionId",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transactionId",
            type="S"
        )
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    deletion_protection_enabled=False,
    tags={
        "Name": f"PaymentTransactions-{environment_suffix}",
        "Environment": environment_suffix,
        "Purpose": "webhook-transaction-storage"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider, protect=True)
)

# CloudWatch Log Groups
stripe_log_group = aws.cloudwatch.LogGroup(
    f"stripe-webhook-logs-{environment_suffix}",
    name=f"/aws/lambda/stripe-webhook-processor-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Name": f"stripe-webhook-logs-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

paypal_log_group = aws.cloudwatch.LogGroup(
    f"paypal-webhook-logs-{environment_suffix}",
    name=f"/aws/lambda/paypal-webhook-processor-{environment_suffix}",
    retention_in_days=7,
    tags={
        "Name": f"paypal-webhook-logs-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for Stripe Lambda
stripe_lambda_role = aws.iam.Role(
    f"stripe-lambda-role-{environment_suffix}",
    name=f"stripe-webhook-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={
        "Name": f"stripe-lambda-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - DynamoDB Access
stripe_dynamodb_policy = aws.iam.RolePolicy(
    f"stripe-dynamodb-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=payment_transactions_table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:GetItem"
            ],
            "Resource": arn
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - CloudWatch Logs
stripe_logs_policy = aws.iam.RolePolicy(
    f"stripe-logs-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=stripe_log_group.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": f"{arn}:*"
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for Stripe Lambda - X-Ray
stripe_xray_policy = aws.iam.RolePolicy(
    f"stripe-xray-policy-{environment_suffix}",
    role=stripe_lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }]
    }),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Role for PayPal Lambda
paypal_lambda_role = aws.iam.Role(
    f"paypal-lambda-role-{environment_suffix}",
    name=f"paypal-webhook-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={
        "Name": f"paypal-lambda-role-{environment_suffix}",
        "Environment": environment_suffix
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - DynamoDB Access
paypal_dynamodb_policy = aws.iam.RolePolicy(
    f"paypal-dynamodb-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=payment_transactions_table.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:GetItem"
            ],
            "Resource": arn
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - CloudWatch Logs
paypal_logs_policy = aws.iam.RolePolicy(
    f"paypal-logs-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=paypal_log_group.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": f"{arn}:*"
        }]
    })),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IAM Policy for PayPal Lambda - X-Ray
paypal_xray_policy = aws.iam.RolePolicy(
    f"paypal-xray-policy-{environment_suffix}",
    role=paypal_lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }]
    }),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create Lambda function code directory
import os
import shutil

lambda_dir = "lambda_functions"
os.makedirs(lambda_dir, exist_ok=True)

# Stripe Lambda Function Code
stripe_lambda_code = """import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS services for X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    \"\"\"
    Process Stripe webhook events and store transaction data in DynamoDB
    \"\"\"
    try:
        table_name = os.environ['TABLE_NAME']
        webhook_type = os.environ['WEBHOOK_TYPE']

        logger.info(f"Processing {webhook_type} webhook event")

        # Parse webhook payload
        if isinstance(event, dict) and 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('id', f"stripe-{datetime.utcnow().isoformat()}")

        # Store transaction in DynamoDB
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'webhookType': {'S': webhook_type},
                'payload': {'S': json.dumps(body)},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'status': {'S': 'processed'}
            }
        )

        logger.info(f"Transaction {transaction_id} stored successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing webhook',
                'error': str(e)
            })
        }
"""

with open(f"{lambda_dir}/stripe_handler.py", "w") as f:
    f.write(stripe_lambda_code)

# PayPal Lambda Function Code
paypal_lambda_code = """import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS services for X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    \"\"\"
    Process PayPal webhook events and store transaction data in DynamoDB
    \"\"\"
    try:
        table_name = os.environ['TABLE_NAME']
        webhook_type = os.environ['WEBHOOK_TYPE']

        logger.info(f"Processing {webhook_type} webhook event")

        # Parse webhook payload
        if isinstance(event, dict) and 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('id', f"paypal-{datetime.utcnow().isoformat()}")

        # Store transaction in DynamoDB
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'webhookType': {'S': webhook_type},
                'payload': {'S': json.dumps(body)},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'status': {'S': 'processed'}
            }
        )

        logger.info(f"Transaction {transaction_id} stored successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing webhook',
                'error': str(e)
            })
        }
"""

with open(f"{lambda_dir}/paypal_handler.py", "w") as f:
    f.write(paypal_lambda_code)

# Stripe Lambda Function
stripe_lambda = aws.lambda_.Function(
    f"stripe-webhook-processor-{environment_suffix}",
    name=f"stripe-webhook-processor-{environment_suffix}",
    runtime="python3.11",
    handler="stripe_handler.lambda_handler",
    role=stripe_lambda_role.arn,
    code=pulumi.AssetArchive({
        "stripe_handler.py": pulumi.FileAsset(f"{lambda_dir}/stripe_handler.py")
    }),
    timeout=30,
    memory_size=512,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": payment_transactions_table.name,
            "WEBHOOK_TYPE": "Stripe"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Name": f"stripe-webhook-processor-{environment_suffix}",
        "Environment": environment_suffix,
        "WebhookType": "Stripe"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[
            stripe_log_group,
            stripe_dynamodb_policy,
            stripe_logs_policy,
            stripe_xray_policy
        ]
    )
)

# PayPal Lambda Function
paypal_lambda = aws.lambda_.Function(
    f"paypal-webhook-processor-{environment_suffix}",
    name=f"paypal-webhook-processor-{environment_suffix}",
    runtime="python3.11",
    handler="paypal_handler.lambda_handler",
    role=paypal_lambda_role.arn,
    code=pulumi.AssetArchive({
        "paypal_handler.py": pulumi.FileAsset(f"{lambda_dir}/paypal_handler.py")
    }),
    timeout=30,
    memory_size=512,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "TABLE_NAME": payment_transactions_table.name,
            "WEBHOOK_TYPE": "PayPal"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags={
        "Name": f"paypal-webhook-processor-{environment_suffix}",
        "Environment": environment_suffix,
        "WebhookType": "PayPal"
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        depends_on=[
            paypal_log_group,
            paypal_dynamodb_policy,
            paypal_logs_policy,
            paypal_xray_policy
        ]
    )
)

# Export outputs
pulumi.export("stripe_lambda_arn", stripe_lambda.arn)
pulumi.export("paypal_lambda_arn", paypal_lambda.arn)
pulumi.export("dynamodb_table_name", payment_transactions_table.name)
pulumi.export("dynamodb_table_arn", payment_transactions_table.arn)
pulumi.export("stripe_log_group_name", stripe_log_group.name)
pulumi.export("paypal_log_group_name", paypal_log_group.name)
```

## File: Pulumi.yaml

```yaml
name: payment-webhook-processor
runtime: python
description: Serverless payment webhook processor for Stripe and PayPal

config:
  environment_suffix:
    description: Unique environment suffix for resource naming
    type: string
  aws_region:
    description: AWS region for deployment
    type: string
    default: us-east-1
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: lambda_functions/stripe_handler.py

```python
import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS services for X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
    Process Stripe webhook events and store transaction data in DynamoDB
    """
    try:
        table_name = os.environ['TABLE_NAME']
        webhook_type = os.environ['WEBHOOK_TYPE']

        logger.info(f"Processing {webhook_type} webhook event")

        # Parse webhook payload
        if isinstance(event, dict) and 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('id', f"stripe-{datetime.utcnow().isoformat()}")

        # Store transaction in DynamoDB
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'webhookType': {'S': webhook_type},
                'payload': {'S': json.dumps(body)},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'status': {'S': 'processed'}
            }
        )

        logger.info(f"Transaction {transaction_id} stored successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing webhook',
                'error': str(e)
            })
        }
```

## File: lambda_functions/paypal_handler.py

```python
import json
import boto3
import os
import logging
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS services for X-Ray tracing
patch_all()

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
    Process PayPal webhook events and store transaction data in DynamoDB
    """
    try:
        table_name = os.environ['TABLE_NAME']
        webhook_type = os.environ['WEBHOOK_TYPE']

        logger.info(f"Processing {webhook_type} webhook event")

        # Parse webhook payload
        if isinstance(event, dict) and 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract transaction details
        transaction_id = body.get('id', f"paypal-{datetime.utcnow().isoformat()}")

        # Store transaction in DynamoDB
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                'transactionId': {'S': transaction_id},
                'webhookType': {'S': webhook_type},
                'payload': {'S': json.dumps(body)},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'status': {'S': 'processed'}
            }
        )

        logger.info(f"Transaction {transaction_id} stored successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transactionId': transaction_id
            })
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing webhook',
                'error': str(e)
            })
        }
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set environment_suffix <your-suffix>
pulumi config set aws_region us-east-1
pulumi config set aws:region us-east-1
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Test the Lambda functions by invoking them with sample webhook payloads.

## Features Implemented

- Two Lambda functions (Stripe and PayPal) with Python 3.11 runtime
- DynamoDB table with on-demand billing and point-in-time recovery
- IAM roles with least privilege permissions
- CloudWatch Log Groups with 7-day retention
- X-Ray tracing enabled for both Lambda functions
- Environment variables for configuration
- Proper error handling and logging
- Resource naming with environment_suffix pattern
- DynamoDB deletion protection disabled for cleanup
- Stack outputs for all key resources
