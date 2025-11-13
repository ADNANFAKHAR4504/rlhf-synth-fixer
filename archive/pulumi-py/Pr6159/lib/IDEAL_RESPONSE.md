# Ideal Pulumi Python Implementation

The sections below capture the final Pulumi Python source code that provisions the fraud-detection stack. Every code file in `lib/` is reproduced verbatim so reviewers can validate the delivered implementation directly from this document.

---

## `lib/__init__.py`

```python
```

---

## `lib/helpers.py`

```python
"""
Helper functions for fraud detection pipeline.

These functions contain the core business logic that can be unit tested
independently of the Pulumi infrastructure code.
"""


def validate_transaction(body):
    """
    Validate transaction data.

    Args:
        body (dict): Transaction data

    Returns:
        tuple: (is_valid, error_message)
    """
    if not body:
        return False, "Empty transaction body"

    if 'transaction_id' not in body:
        return False, "Missing transaction_id"

    return True, None


def detect_fraud(amount):
    """
    Detect if a transaction is suspicious based on amount.

    Args:
        amount (float): Transaction amount

    Returns:
        tuple: (is_suspicious, reasons, severity)
    """
    is_suspicious = False
    reasons = []
    severity = 'low'

    if amount > 1000:
        is_suspicious = True
        reasons.append('High amount transaction')
        severity = 'medium'

    if amount > 5000:
        reasons.append('Very high amount transaction')
        severity = 'high'

    return is_suspicious, reasons, severity


def format_notification_message(transaction_id, amount, reasons, severity):
    """
    Format notification message for fraud alerts.

    Args:
        transaction_id (str): Transaction ID
        amount (float): Transaction amount
        reasons (list): List of fraud reasons
        severity (str): Severity level

    Returns:
        str: Formatted notification message
    """
    message = f"\n"
    message += f"FRAUD ALERT - {severity.upper()} SEVERITY\n\n"
    message += f"Transaction ID: {transaction_id}\n"
    message += f"Amount: ${amount}\n"
    message += f"Reasons: {', '.join(reasons)}\n\n"
    message += f"Please investigate this transaction immediately.\n"

    return message


def get_configuration_values():
    """
    Get all configuration values for the infrastructure.

    Returns:
        dict: Configuration values
    """
    return {
        'lambda_memory': 512,
        'lambda_concurrency': 50,
        'lambda_runtime': 'python3.9',
        'dynamodb_billing': 'PAY_PER_REQUEST',
        'dynamodb_stream_view': 'NEW_AND_OLD_IMAGES',
        'sqs_visibility_timeout': 300,
        'cloudwatch_retention': 7,
        'common_tags': {
            'Environment': 'production',
            'CostCenter': 'fraud-detection'
        }
    }
```

---

## `lib/tap_stack.py`

```python
"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project. It now encapsulates the full
infrastructure previously defined in `tap_stack.py`.
"""

from typing import Optional, Dict
import json

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[Dict[str, str]]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project. All resource
    definitions that previously lived in `tap_stack.py` are now defined within this class.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        config = pulumi.Config()
        environment_suffix = args.environment_suffix or config.get("environmentSuffix") or "dev"
        common_tags = args.tags or {
            "Environment": "production",
            "CostCenter": "fraud-detection",
        }

        self.environment_suffix = environment_suffix
        self.common_tags = common_tags
        self.tags = common_tags

        parent_opts = ResourceOptions(parent=self)

        # KMS Key for encryption
        self.kms_key = aws.kms.Key(
            f"fraud-detection-kms-{environment_suffix}",
            description="KMS key for fraud detection pipeline encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=common_tags,
            opts=parent_opts,
        )

        self.kms_alias = aws.kms.Alias(
            f"fraud-detection-kms-alias-{environment_suffix}",
            target_key_id=self.kms_key.id,
            name=f"alias/fraud-detection-{environment_suffix}",
            opts=parent_opts,
        )

        # IAM Role for process-transaction Lambda
        self.process_transaction_role = aws.iam.Role(
            f"process-transaction-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=common_tags,
            opts=parent_opts,
        )

        # Attach basic execution policy
        aws.iam.RolePolicyAttachment(
            f"process-transaction-basic-{environment_suffix}",
            role=self.process_transaction_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # DynamoDB Table
        self.transactions_table = aws.dynamodb.Table(
            f"transactions-{environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="transaction_id",
            range_key="timestamp",
            billing_mode="PAY_PER_REQUEST",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags=common_tags,
            opts=parent_opts,
        )

        # Policy for process-transaction Lambda
        self.process_transaction_policy = aws.iam.RolePolicy(
            f"process-transaction-policy-{environment_suffix}",
            role=self.process_transaction_role.id,
            policy=pulumi.Output.all(self.transactions_table.arn, self.kms_key.arn).apply(
                lambda args2: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": args2[0]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args2[1]
                        }
                    ]
                })
            ),
            opts=parent_opts,
        )

        # CloudWatch Log Group for process-transaction
        self.process_transaction_log_group = aws.cloudwatch.LogGroup(
            f"process-transaction-logs-{environment_suffix}",
            name=f"/aws/lambda/process-transaction-{environment_suffix}",
            retention_in_days=7,
            tags=common_tags,
            opts=parent_opts,
        )

        # Lambda Function: process-transaction
        self.process_transaction_lambda = aws.lambda_.Function(
            f"process-transaction-{environment_suffix}",
            runtime="python3.9",
            role=self.process_transaction_role.arn,
            handler="index.handler",
            memory_size=512,
            reserved_concurrent_executions=50,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset("""
import json
import boto3
import time
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if 'transaction_id' not in body:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id'})
            }

        # Store transaction in DynamoDB
        item = {
            'transaction_id': body['transaction_id'],
            'timestamp': int(time.time() * 1000),
            'amount': body.get('amount', 0),
            'merchant': body.get('merchant', ''),
            'card_number': body.get('card_number', ''),
            'location': body.get('location', ''),
            'status': 'pending'
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': body['transaction_id']
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
""")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.transactions_table.name
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self, depends_on=[self.process_transaction_log_group]),
        )

        # SQS Queue for fraud alerts
        self.fraud_alerts_queue = aws.sqs.Queue(
            f"fraud-alerts-{environment_suffix}",
            visibility_timeout_seconds=300,
            tags=common_tags,
            opts=parent_opts,
        )

        # IAM Role for detect-fraud Lambda
        self.detect_fraud_role = aws.iam.Role(
            f"detect-fraud-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=common_tags,
            opts=parent_opts,
        )

        aws.iam.RolePolicyAttachment(
            f"detect-fraud-basic-{environment_suffix}",
            role=self.detect_fraud_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=parent_opts,
        )

        # Policy for detect-fraud Lambda
        self.detect_fraud_policy = aws.iam.RolePolicy(
            f"detect-fraud-policy-{environment_suffix}",
            role=self.detect_fraud_role.id,
            policy=pulumi.Output.all(
                self.transactions_table.stream_arn,
                self.fraud_alerts_queue.arn,
                self.kms_key.arn