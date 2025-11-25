#!/usr/bin/env python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, TerraformAsset, AssetType, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider, AwsProviderDefaultTags
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionDeadLetterConfig
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.lambda_function_event_invoke_config import (
    LambdaFunctionEventInvokeConfig,
    LambdaFunctionEventInvokeConfigDestinationConfig,
    LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess
)
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json
import os
from typing import Dict, Any


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: Dict[str, Any],
    ):
        super().__init__(scope, construct_id)

        # Configure S3 Backend for Terraform state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"cdktf/{construct_id}/terraform.tfstate",
            region=state_bucket_region,
        )

        # Get absolute path to project root
        self.project_root = os.path.dirname(os.path.abspath(__file__))

        # AWS Provider with default tags
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[AwsProviderDefaultTags(**default_tags)],
        )

        # Get current AWS account ID
        caller_identity = DataAwsCallerIdentity(self, "current")

        # Customer-managed KMS key for Lambda environment variable encryption
        kms_key = KmsKey(self, "lambda-kms-key",
            description=f"KMS key for Lambda environment variables - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{caller_identity.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow Lambda to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        KmsAlias(self, "lambda-kms-alias",
            name=f"alias/lambda-env-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # DynamoDB Table
        dynamodb_table = DynamodbTable(self, "crypto-prices-table",
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
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # Dead Letter Queues for Lambda functions
        webhook_dlq = SqsQueue(self, "webhook-dlq",
            name=f"webhook-processor-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        enricher_dlq = SqsQueue(self, "enricher-dlq",
            name=f"price-enricher-dlq-{environment_suffix}",
            message_retention_seconds=345600,  # 4 days
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # SNS Topic for success notifications
        success_topic = SnsTopic(self, "success-topic",
            name=f"price-updates-success-{environment_suffix}",
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # IAM Role for Webhook Processor Lambda
        webhook_processor_role = self._create_lambda_role(
            "webhook-processor-role",
            environment_suffix,
            f"webhook-processor-{environment_suffix}",
            dynamodb_table.arn,
            kms_key.arn,
            webhook_dlq.arn,
            aws_region,
            caller_identity.account_id
        )

        # IAM Role for Price Enricher Lambda
        price_enricher_role = self._create_enricher_lambda_role(
            "price-enricher-role",
            environment_suffix,
            f"price-enricher-{environment_suffix}",
            dynamodb_table.arn,
            dynamodb_table.stream_arn,
            kms_key.arn,
            enricher_dlq.arn,
            aws_region,
            caller_identity.account_id,
            success_topic.arn
        )

        # CloudWatch Log Groups
        webhook_log_group = CloudwatchLogGroup(self, "webhook-log-group",
            name=f"/aws/lambda/webhook-processor-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        enricher_log_group = CloudwatchLogGroup(self, "enricher-log-group",
            name=f"/aws/lambda/price-enricher-{environment_suffix}",
            retention_in_days=3,
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        # Lambda Functions with TerraformAsset for proper path handling
        webhook_asset = TerraformAsset(self, "webhook-processor-asset",
            path=os.path.join(self.project_root, "lambda/webhook-processor.zip"),
            type=AssetType.FILE
        )

        webhook_processor = LambdaFunction(self, "webhook-processor",
            function_name=f"webhook-processor-{environment_suffix}",
            role=webhook_processor_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=1024,
            timeout=60,
            reserved_concurrent_executions=10,
            filename=webhook_asset.path,
            source_code_hash=Fn.filebase64sha256(webhook_asset.path),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=webhook_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            },
            depends_on=[webhook_log_group]
        )

        enricher_asset = TerraformAsset(self, "price-enricher-asset",
            path=os.path.join(self.project_root, "lambda/price-enricher.zip"),
            type=AssetType.FILE
        )

        price_enricher = LambdaFunction(self, "price-enricher",
            function_name=f"price-enricher-{environment_suffix}",
            role=price_enricher_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=512,
            timeout=30,
            reserved_concurrent_executions=5,
            filename=enricher_asset.path,
            source_code_hash=Fn.filebase64sha256(enricher_asset.path),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=kms_key.arn,
            dead_letter_config=LambdaFunctionDeadLetterConfig(
                target_arn=enricher_dlq.arn
            ),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            },
            depends_on=[enricher_log_group]
        )

        # Lambda Event Source Mapping for DynamoDB Streams
        LambdaEventSourceMapping(self, "enricher-stream-mapping",
            event_source_arn=dynamodb_table.stream_arn,
            function_name=price_enricher.arn,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            bisect_batch_on_function_error=True,
            maximum_retry_attempts=2
        )

        # Lambda Destination for Success Events
        LambdaFunctionEventInvokeConfig(self, "enricher-destination",
            function_name=price_enricher.function_name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=0,
            destination_config=LambdaFunctionEventInvokeConfigDestinationConfig(
                on_success=LambdaFunctionEventInvokeConfigDestinationConfigOnSuccess(
                    destination=success_topic.arn
                )
            ),
            qualifier="$LATEST"
        )

        # Outputs
        TerraformOutput(self, "webhook_processor_arn",
            value=webhook_processor.arn,
            description="ARN of the webhook processor Lambda function"
        )

        TerraformOutput(self, "price_enricher_arn",
            value=price_enricher.arn,
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

    def _create_lambda_role(
            self, construct_id: str, environment_suffix: str,
            function_name: str, dynamodb_arn: str, kms_arn: str, dlq_arn: str,
            aws_region: str, account_id: str
    ) -> IamRole:
        """Create IAM role for webhook processor Lambda with least-privilege permissions."""

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        role = IamRole(self, construct_id,
            name=f"{function_name}-role",
            assume_role_policy=assume_role_policy,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem"
                            ],
                            "Resource": dynamodb_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": kms_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "sqs:SendMessage"
                            ],
                            "Resource": dlq_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="cloudwatch-logs",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"arn:aws:logs:{aws_region}:{account_id}:log-group:/aws/lambda/{function_name}:*"
                        }]
                    })
                )
            ],
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        return role

    def _create_enricher_lambda_role(
            self, construct_id: str, environment_suffix: str, function_name: str,
            dynamodb_arn: str, stream_arn: str, kms_arn: str, dlq_arn: str,
            aws_region: str, account_id: str, sns_arn: str = None
    ) -> IamRole:
        """Create IAM role for price enricher Lambda with least-privilege permissions."""

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })

        role = IamRole(self, construct_id,
            name=f"{function_name}-role",
            assume_role_policy=assume_role_policy,
            inline_policy=[
                IamRoleInlinePolicy(
                    name="dynamodb-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:UpdateItem",
                                "dynamodb:GetItem",
                                "dynamodb:Query"
                            ],
                            "Resource": dynamodb_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="dynamodb-stream-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:GetRecords",
                                "dynamodb:GetShardIterator",
                                "dynamodb:DescribeStream",
                                "dynamodb:ListStreams"
                            ],
                            "Resource": stream_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="kms-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": kms_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="sqs-dlq-access",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "sqs:SendMessage"
                            ],
                            "Resource": dlq_arn
                        }]
                    })
                ),
                IamRoleInlinePolicy(
                    name="cloudwatch-logs",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": f"arn:aws:logs:{aws_region}:{account_id}:log-group:/aws/lambda/{function_name}:*"
                        }]
                    })
                )
            ] + ([
                IamRoleInlinePolicy(
                    name="sns-publish",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Action": ["sns:Publish"],
                            "Resource": sns_arn
                        }]
                    })
                )
            ] if sns_arn else []),
            tags={
                "Environment": environment_suffix,
                "Application": "crypto-price-processing"
            }
        )

        return role
