"""
TapStack: Main Pulumi stack for serverless webhook processor.

This stack creates all AWS resources needed for processing payment webhooks
including Lambda functions, DynamoDB tables, SNS topics, SQS queues, and KMS encryption.
"""
import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class TapStackArgs:
    """Arguments for TapStack configuration."""

    def __init__(self, environment_suffix: str):
        """
        Initialize TapStack arguments.

        Args:
            environment_suffix: Suffix for resource naming to ensure uniqueness
        """
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """
    Main infrastructure stack for serverless webhook processor.

    Creates all resources needed for secure, scalable webhook processing
    with encryption, monitoring, and error handling.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: ResourceOptions = None):
        """
        Initialize the TapStack with all required resources.

        Args:
            name: Stack name
            args: Configuration arguments
            opts: Pulumi resource options
        """
        super().__init__('custom:infrastructure:TapStack', name, {}, opts)

        self.environment_suffix = args.environment_suffix

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create DynamoDB table for transaction storage
        self.dynamodb_table = self._create_dynamodb_table()

        # Create SNS topic for event distribution
        self.sns_topic = self._create_sns_topic()

        # Create SQS dead letter queue
        self.dlq = self._create_dead_letter_queue()

        # Create Lambda execution role
        self.lambda_role = self._create_lambda_role()

        # Create CloudWatch log group
        self.log_group = self._create_log_group()

        # Create Lambda function
        self.lambda_function = self._create_lambda_function()

        # Create event source mapping for DLQ retry configuration
        self._configure_lambda_retries()

        # Export outputs
        self._export_outputs()

        self.register_outputs({
            'kms_key_id': self.kms_key.id,
            'dynamodb_table_name': self.dynamodb_table.name,
            'sns_topic_arn': self.sns_topic.arn,
            'lambda_function_arn': self.lambda_function.arn,
            'dlq_url': self.dlq.url,
        })

    def _create_kms_key(self) -> aws.kms.Key:
        """Create customer-managed KMS key for encryption."""
        key = aws.kms.Key(
            f"webhook-kms-key-{self.environment_suffix}",
            description=f"KMS key for webhook processor encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                'Name': f'webhook-kms-key-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        # Create alias for easier reference
        aws.kms.Alias(
            f"webhook-kms-alias-{self.environment_suffix}",
            name=f"alias/webhook-processor-{self.environment_suffix}",
            target_key_id=key.id,
            opts=ResourceOptions(parent=self)
        )

        return key

    def _create_dynamodb_table(self) -> aws.dynamodb.Table:
        """Create DynamoDB table for transaction storage."""
        table = aws.dynamodb.Table(
            f"payment-transactions-{self.environment_suffix}",
            name=f"payment-transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_key.arn
            ),
            tags={
                'Name': f'payment-transactions-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        return table

    def _create_sns_topic(self) -> aws.sns.Topic:
        """Create SNS topic for event distribution."""
        topic = aws.sns.Topic(
            f"payment-events-{self.environment_suffix}",
            name=f"payment-events-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            tags={
                'Name': f'payment-events-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        return topic

    def _create_dead_letter_queue(self) -> aws.sqs.Queue:
        """Create SQS queue for dead letter events."""
        queue = aws.sqs.Queue(
            f"webhook-dlq-{self.environment_suffix}",
            name=f"webhook-dlq-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            kms_data_key_reuse_period_seconds=300,
            message_retention_seconds=1209600,  # 14 days
            tags={
                'Name': f'webhook-dlq-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        return queue

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda function with least-privilege policies."""
        # Create assume role policy
        assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        role = aws.iam.Role(
            f"webhook-lambda-role-{self.environment_suffix}",
            name=f"webhook-lambda-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy.json,
            tags={
                'Name': f'webhook-lambda-role-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"webhook-lambda-basic-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach X-Ray write policy
        aws.iam.RolePolicyAttachment(
            f"webhook-lambda-xray-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for specific permissions
        lambda_policy = Output.all(
            self.dynamodb_table.arn,
            self.sns_topic.arn,
            self.dlq.arn,
            self.kms_key.arn
        ).apply(lambda args: aws.iam.get_policy_document(
            statements=[
                # DynamoDB permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                    ],
                    resources=[args[0]]
                ),
                # SNS publish permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=["sns:Publish"],
                    resources=[args[1]]
                ),
                # SQS DLQ permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes",
                    ],
                    resources=[args[2]]
                ),
                # KMS permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                    ],
                    resources=[args[3]]
                ),
                # SSM Parameter Store permissions
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                    ],
                    resources=["arn:aws:ssm:*:*:parameter/webhook-processor/*"]
                ),
            ]
        ).json)

        aws.iam.RolePolicy(
            f"webhook-lambda-policy-{self.environment_suffix}",
            role=role.id,
            policy=lambda_policy,
            opts=ResourceOptions(parent=self)
        )

        return role

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group with 30-day retention."""
        log_group = aws.cloudwatch.LogGroup(
            f"webhook-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/webhook-processor-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                'Name': f'webhook-lambda-logs-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(parent=self)
        )

        return log_group

    def _create_lambda_function(self) -> aws.lambda_.Function:
        """Create Lambda function for webhook processing."""
        # Create Lambda function code
        function_code = """
import json
import os
import time
import boto3
from decimal import Decimal
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ssm = boto3.client('ssm')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']


def validate_webhook_signature(event: Dict[str, Any]) -> bool:
    \"\"\"
    Validate webhook signature from payment provider.
    In production, this would verify the signature using provider's secret.
    \"\"\"
    # This is a placeholder - real implementation would:
    # 1. Get secret from SSM Parameter Store
    # 2. Compute signature from payload
    # 3. Compare with received signature
    return True


def process_webhook(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Process incoming payment webhook.

    Args:
        event: Lambda event containing webhook payload
        context: Lambda context

    Returns:
        Response with status code and body
    \"\"\"
    try:
        print(f"Processing webhook event: {json.dumps(event)}")

        # Parse webhook payload
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Validate webhook signature
        if not validate_webhook_signature(event):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

        # Extract transaction data
        transaction_id = body.get('transaction_id', f'txn-{int(time.time())}')
        timestamp = int(time.time() * 1000)  # milliseconds

        transaction_data = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'provider': body.get('provider', 'unknown'),
            'amount': Decimal(str(body.get('amount', 0))),
            'currency': body.get('currency', 'USD'),
            'status': body.get('status', 'pending'),
            'customer_id': body.get('customer_id'),
            'payment_method': body.get('payment_method'),
            'metadata': json.dumps(body.get('metadata', {})),
            'processed_at': int(time.time()),
        }

        # Store in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(Item=transaction_data)
        print(f"Stored transaction {transaction_id} in DynamoDB")

        # Publish to SNS for downstream processing
        # Convert Decimal to float for JSON serialization
        sns_data = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'provider': transaction_data['provider'],
            'amount': float(transaction_data['amount']),
            'currency': transaction_data['currency'],
            'status': transaction_data['status'],
        }

        sns_message = {
            'transaction_id': transaction_id,
            'event_type': 'payment_processed',
            'timestamp': timestamp,
            'data': sns_data
        }

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=json.dumps(sns_message),
            Subject=f'Payment Event: {transaction_id}'
        )
        print(f"Published event to SNS for transaction {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook processed successfully',
                'transaction_id': transaction_id
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        # Lambda will automatically retry and send to DLQ if configured
        raise


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"Main Lambda handler function.\"\"\"
    return process_webhook(event, context)
"""

        # Create Lambda function
        function = aws.lambda_.Function(
            f"webhook-processor-{self.environment_suffix}",
            name=f"webhook-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(function_code)
            }),
            architectures=["arm64"],
            memory_size=1024,
            timeout=60,
            # reserved_concurrent_executions=100,  # Removed due to AWS quota constraints
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE': self.dynamodb_table.name,
                    'SNS_TOPIC_ARN': self.sns_topic.arn,
                    'ENVIRONMENT_SUFFIX': self.environment_suffix,
                    'POWERTOOLS_SERVICE_NAME': 'webhook-processor',
                    'LOG_LEVEL': 'INFO',
                }
            ),
            tags={
                'Name': f'webhook-processor-{self.environment_suffix}',
                'Environment': self.environment_suffix,
                'CostCenter': 'engineering',
                'Owner': 'platform-team',
            },
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.log_group]
            )
        )

        return function

    def _configure_lambda_retries(self) -> None:
        """Configure Lambda retry behavior for failed invocations."""
        # Note: Dead letter queue is configured in Lambda function
        # Async invocation config for retry attempts (AWS allows max 2 retries)
        aws.lambda_.FunctionEventInvokeConfig(
            f"webhook-lambda-config-{self.environment_suffix}",
            function_name=self.lambda_function.name,
            maximum_retry_attempts=2,
            maximum_event_age_in_seconds=3600,  # 1 hour
            opts=ResourceOptions(parent=self)
        )

    def _export_outputs(self) -> None:
        """Export stack outputs."""
        pulumi.export('kms_key_id', self.kms_key.id)
        pulumi.export('kms_key_arn', self.kms_key.arn)
        pulumi.export('dynamodb_table_name', self.dynamodb_table.name)
        pulumi.export('dynamodb_table_arn', self.dynamodb_table.arn)
        pulumi.export('sns_topic_arn', self.sns_topic.arn)
        pulumi.export('sns_topic_name', self.sns_topic.name)
        pulumi.export('lambda_function_arn', self.lambda_function.arn)
        pulumi.export('lambda_function_name', self.lambda_function.name)
        pulumi.export('dlq_url', self.dlq.url)
        pulumi.export('dlq_arn', self.dlq.arn)
        pulumi.export('environment_suffix', self.environment_suffix)
