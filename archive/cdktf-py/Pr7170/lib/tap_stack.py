from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction, LambdaFunctionEnvironment
)
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import (
    LambdaEventSourceMapping
)
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import (
    IamRolePolicyAttachment
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import (
    CloudwatchMetricAlarm
)
import json
import os


class TapStack(TerraformStack):
    # pylint: disable=redefined-builtin
    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str = "dev",
        state_bucket: str = "iac-rlhf-tf-states",
        state_bucket_region: str = "us-east-1",
        aws_region: str = "us-east-1",
        default_tags: dict = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # Configure S3 backend for Terraform state
        S3Backend(self,
            bucket=state_bucket,
            key=f"{environment_suffix}/terraform.tfstate",
            region=state_bucket_region
        )

        # AWS Provider with default tags
        provider_config = {
            "region": aws_region
        }
        if default_tags:
            provider_config["default_tags"] = [default_tags]

        AwsProvider(self, "aws", **provider_config)

        # KMS Key for Lambda environment variables
        self.kms_key = KmsKey(self, "lambda_kms_key",
            description=f"KMS key for Lambda environment variables - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"lambda-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        KmsAlias(self, "lambda_kms_alias",
            name=f"alias/lambda-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # Dead Letter Queue for failed messages
        self.dead_letter_queue = SqsQueue(self, "market_data_dlq",
            name=f"market-data-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={
                "Name": f"market-data-dlq-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # SQS Queue for market data
        self.sqs_queue = SqsQueue(self, "market_data_queue",
            name=f"market-data-queue-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=360,  # 6 times Lambda timeout
            redrive_policy=json.dumps({
                "deadLetterTargetArn": self.dead_letter_queue.arn,
                "maxReceiveCount": 3
            }),
            tags={
                "Name": f"market-data-queue-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # DynamoDB Table for market alerts
        self.dynamodb_table = DynamodbTable(self, "market_alerts_table",
            name=f"market-alerts-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="symbol",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="symbol", type="S"),
                DynamodbTableAttribute(name="timestamp", type="S")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            tags={
                "Name": f"market-alerts-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # SNS Topic for trading alerts
        self.sns_topic = SnsTopic(self, "trading_alerts_topic",
            name=f"trading-alerts-{environment_suffix}",
            tags={
                "Name": f"trading-alerts-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # IAM Role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Get absolute path to lambda_function.zip
        lambda_zip_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "lambda_function.zip"
        )

        # Lambda Function
        self.lambda_function = LambdaFunction(self, "data_processor",
            function_name=f"data-processor-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            role=self.lambda_role.arn,
            memory_size=3072,
            timeout=60,
            architectures=["arm64"],
            reserved_concurrent_executions=5,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "SNS_TOPIC_ARN": self.sns_topic.arn,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            kms_key_arn=self.kms_key.arn,
            tags={
                "Name": f"data-processor-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # Lambda Event Source Mapping
        self.event_source_mapping = LambdaEventSourceMapping(self, "sqs_trigger",
            event_source_arn=self.sqs_queue.arn,
            function_name=self.lambda_function.function_name,
            batch_size=25,
            maximum_batching_window_in_seconds=5,
            enabled=True
        )

        # CloudWatch Alarm for Lambda errors
        self.error_alarm = CloudwatchMetricAlarm(self, "lambda_error_alarm",
            alarm_name=f"data-processor-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,  # 5 minutes
            statistic="Average",
            threshold=0.01,  # 1% error rate
            alarm_description="Alert when Lambda error rate exceeds 1%",
            dimensions={
                "FunctionName": self.lambda_function.function_name
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"data-processor-errors-{environment_suffix}",
                "Environment": environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        # Outputs
        TerraformOutput(self, "sqs_queue_url",
            value=self.sqs_queue.url,
            description="SQS Queue URL for market data"
        )

        TerraformOutput(self, "sns_topic_arn",
            value=self.sns_topic.arn,
            description="SNS Topic ARN for trading alerts"
        )

        TerraformOutput(self, "dynamodb_table_name",
            value=self.dynamodb_table.name,
            description="DynamoDB table name for market alerts"
        )

        TerraformOutput(self, "lambda_function_name",
            value=self.lambda_function.function_name,
            description="Lambda function name"
        )

    def _create_lambda_role(self) -> IamRole:
        """Create IAM role for Lambda with required permissions"""

        # Trust policy for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }
            ]
        }

        # Inline policy with specific permissions
        inline_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": self.sqs_queue.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": self.dynamodb_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": self.sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": self.kms_key.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }

        role = IamRole(self, "lambda_role",
            name=f"data-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-permissions",
                    policy=json.dumps(inline_policy)
                )
            ],
            tags={
                "Name": f"data-processor-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Team": "trading",
                "CostCenter": "trading-platform"
            }
        )

        return role
