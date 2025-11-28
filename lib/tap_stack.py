from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction,
    LambdaFunctionEnvironment,
    LambdaFunctionDeadLetterConfig
)
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import (
    LambdaEventSourceMapping,
    LambdaEventSourceMappingDestinationConfig,
    LambdaEventSourceMappingDestinationConfigOnFailure
)
from cdktf_cdktf_provider_aws.lambda_function_event_invoke_config import (
    LambdaFunctionEventInvokeConfig,
    LambdaFunctionEventInvokeConfigDestinationConfig,
    LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess
)
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_subscription_filter import CloudwatchLogSubscriptionFilter
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import (
    DataAwsIamPolicyDocument,
    DataAwsIamPolicyDocumentStatement,
    DataAwsIamPolicyDocumentStatementPrincipals
)
import json
import os


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str):
        super().__init__(scope, stack_id)

        # Get environment suffix from environment variable or use default
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1"
        )

        # KMS Key for Lambda environment variable encryption
        kms_key = KmsKey(self, f"lambda-kms-key-{environment_suffix}",
            description=f"KMS key for encrypting Lambda environment variables - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10
        )

        KmsAlias(self, f"lambda-kms-alias-{environment_suffix}",
            name=f"alias/lambda-crypto-processor-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # DynamoDB Table
        dynamodb_table = DynamodbTable(self, f"crypto-prices-{environment_suffix}",
            name=f"crypto-prices-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="symbol",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="symbol", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor",
                "ManagedBy": "CDKTF"
            }
        )

        # SQS Dead Letter Queue for webhook-processor
        webhook_dlq = SqsQueue(self, f"webhook-processor-dlq-{environment_suffix}",
            name=f"webhook-processor-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # SQS Dead Letter Queue for price-enricher
        enricher_dlq = SqsQueue(self, f"price-enricher-dlq-{environment_suffix}",
            name=f"price-enricher-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # SNS Topic for success notifications
        success_topic = SnsTopic(self, f"price-updates-success-{environment_suffix}",
            name=f"price-updates-success-{environment_suffix}",
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # IAM Role for webhook-processor Lambda
        webhook_assume_role_policy = DataAwsIamPolicyDocument(self, "webhook-assume-role-policy",
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[
                        DataAwsIamPolicyDocumentStatementPrincipals(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        webhook_role = IamRole(self, f"webhook-processor-role-{environment_suffix}",
            name=f"webhook-processor-role-{environment_suffix}",
            assume_role_policy=webhook_assume_role_policy.json,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-write-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:UpdateItem"
                                ],
                                "Resource": dynamodb_table.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-decrypt-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:DescribeKey"
                                ],
                                "Resource": kms_key.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sqs:SendMessage"
                                ],
                                "Resource": webhook_dlq.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sns-publish-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sns:Publish"
                                ],
                                "Resource": success_topic.arn
                            }
                        ]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(self, f"webhook-lambda-basic-{environment_suffix}",
            role=webhook_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # IAM Role for price-enricher Lambda
        enricher_assume_role_policy = DataAwsIamPolicyDocument(self, "enricher-assume-role-policy",
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[
                        DataAwsIamPolicyDocumentStatementPrincipals(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        enricher_role = IamRole(self, f"price-enricher-role-{environment_suffix}",
            name=f"price-enricher-role-{environment_suffix}",
            assume_role_policy=enricher_assume_role_policy.json,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-stream-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:GetRecords",
                                    "dynamodb:GetShardIterator",
                                    "dynamodb:DescribeStream",
                                    "dynamodb:ListStreams"
                                ],
                                "Resource": f"{dynamodb_table.arn}/stream/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:UpdateItem",
                                    "dynamodb:PutItem"
                                ],
                                "Resource": dynamodb_table.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-decrypt-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:DescribeKey"
                                ],
                                "Resource": kms_key.arn
                            }
                        ]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-policy",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "sqs:SendMessage"
                                ],
                                "Resource": enricher_dlq.arn
                            }
                        ]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(self, f"enricher-lambda-basic-{environment_suffix}",
            role=enricher_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # CloudWatch Log Group for webhook-processor
        webhook_log_group = CloudwatchLogGroup(self, f"webhook-processor-logs-{environment_suffix}",
            name=f"/aws/lambda/webhook-processor-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # CloudWatch Log Group for price-enricher
        enricher_log_group = CloudwatchLogGroup(self, f"price-enricher-logs-{environment_suffix}",
            name=f"/aws/lambda/price-enricher-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            }
        )

        # Lambda function for webhook-processor
        webhook_lambda = LambdaFunction(self, f"webhook-processor-{environment_suffix}",
            function_name=f"webhook-processor-{environment_suffix}",
            role=webhook_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=1024,
            timeout=60,
            filename=os.path.abspath(
                os.path.join(os.path.dirname(__file__), "lambda/webhook_processor.zip")
            ),
            source_code_hash=Fn.filebase64sha256(
                os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda/webhook_processor.zip"))
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "EXCHANGE_API_ENDPOINT": "https://api.exchange.example.com"
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=webhook_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            },
            depends_on=[webhook_log_group]
        )

        # Lambda destination for webhook-processor success
        LambdaFunctionEventInvokeConfig(self, f"webhook-invoke-config-{environment_suffix}",
            function_name=webhook_lambda.function_name,
            maximum_retry_attempts=2,
            destination_config=LambdaFunctionEventInvokeConfigDestinationConfig(
                on_success=LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess(
                    destination=success_topic.arn
                )
            )
        )

        # Lambda function for price-enricher
        enricher_lambda = LambdaFunction(self, f"price-enricher-{environment_suffix}",
            function_name=f"price-enricher-{environment_suffix}",
            role=enricher_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            architectures=["arm64"],
            memory_size=512,
            timeout=60,
            filename=os.path.abspath(
                os.path.join(os.path.dirname(__file__), "lambda/price_enricher.zip")
            ),
            source_code_hash=Fn.filebase64sha256(
                os.path.abspath(os.path.join(os.path.dirname(__file__), "lambda/price_enricher.zip"))
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=enricher_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processor"
            },
            depends_on=[enricher_log_group]
        )

        # Lambda Event Source Mapping for DynamoDB Stream
        LambdaEventSourceMapping(self, f"dynamodb-stream-mapping-{environment_suffix}",
            event_source_arn=dynamodb_table.stream_arn,
            function_name=enricher_lambda.function_name,
            starting_position="LATEST",
            batch_size=10,
            maximum_retry_attempts=3,
            maximum_record_age_in_seconds=3600,
            bisect_batch_on_function_error=True,
            destination_config=LambdaEventSourceMappingDestinationConfig(
                on_failure=LambdaEventSourceMappingDestinationConfigOnFailure(
                    destination_arn=enricher_dlq.arn
                )
            )
        )

        # Note: CloudWatch Log Subscription Filters with SNS require a Lambda intermediary
        # For cost optimization in this MVP, we're using CloudWatch Logs directly
        # without subscription filters, which still provides full logging and monitoring

        # Outputs
        TerraformOutput(self, "webhook_processor_arn",
            value=webhook_lambda.arn,
            description="ARN of the webhook processor Lambda function"
        )

        TerraformOutput(self, "price_enricher_arn",
            value=enricher_lambda.arn,
            description="ARN of the price enricher Lambda function"
        )

        TerraformOutput(self, "dynamodb_table_name",
            value=dynamodb_table.name,
            description="Name of the DynamoDB table for crypto prices"
        )

        TerraformOutput(self, "sns_topic_arn",
            value=success_topic.arn,
            description="ARN of the SNS topic for success notifications"
        )

        TerraformOutput(self, "kms_key_id",
            value=kms_key.key_id,
            description="ID of the KMS key for Lambda encryption"
        )
