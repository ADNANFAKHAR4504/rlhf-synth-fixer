"""
tap_stack.py

Gaming leaderboard update system with SQS, Lambda, DynamoDB, and monitoring.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import sqs, dynamodb, iam, lambda_, cloudwatch, Provider
import pulumi_aws as aws

class TapStackArgs:
    """Configuration arguments for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.tags.update({
            'Environment': self.environment_suffix,
            'Purpose': 'Gaming-Leaderboard-System'
        })

class TapStack(pulumi.ComponentResource):
    """Main Pulumi component for gaming leaderboard update system."""

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Dead Letter Queue
        self.dlq = sqs.Queue(
            f"dlq-{self.environment_suffix}",
            name=f"leaderboard-dlq-{self.environment_suffix}.fifo",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            fifo_queue=True,
            content_based_deduplication=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Main SQS Queue with redrive policy
        self.main_queue = sqs.Queue(
            f"queue-{self.environment_suffix}",
            name=f"leaderboard-updates-{self.environment_suffix}.fifo",
            message_retention_seconds=345600,  # 4 days
            visibility_timeout_seconds=60,
            redrive_policy=pulumi.Output.all(self.dlq.arn).apply(
                lambda args: json.dumps({
                    "deadLetterTargetArn": args[0],
                    "maxReceiveCount": 3
                })
            ),
            content_based_deduplication=True,
            fifo_queue=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB Table
        self.dynamodb_table = dynamodb.Table(
            f"leaderboard-data-{self.environment_suffix}",
            attributes=[
                dynamodb.TableAttributeArgs(
                    name="player_id",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            hash_key="player_id",
            range_key="timestamp",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for Lambda
        self.log_group = aws.cloudwatch.LogGroup(
            f"/aws/lambda/leaderboard-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda execution role
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        self.lambda_role = iam.Role(
            f"leaderboard-lambda-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role_policy,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda execution policy
        lambda_policy = iam.Policy(
            f"leaderboard-lambda-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.main_queue.arn,
                self.dlq.arn,
                self.dynamodb_table.arn,
                self.log_group.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:GetItem"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{args[3]}:*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to role
        lambda_role_attachment = iam.RolePolicyAttachment(
            f"leaderboard-lambda-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        self.lambda_function = lambda_.Function(
            f"leaderboard-processor-{self.environment_suffix}",
            role=self.lambda_role.arn,
            runtime="python3.11",
            handler="index.handler",
            code=pulumi.FileArchive("./lib/lambda-package/lambda-package.zip"),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=10,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table.name,
                    "DLQ_URL": self.dlq.url,
                    "POWERTOOLS_SERVICE_NAME": "leaderboard-processor",
                    "POWERTOOLS_LOG_LEVEL": "INFO"
                }
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[lambda_role_attachment, self.log_group])
        )

        # Event source mapping
        self.event_source_mapping = lambda_.EventSourceMapping(
            f"leaderboard-sqs-trigger-{self.environment_suffix}",
            event_source_arn=self.main_queue.arn,
            function_name=self.lambda_function.name,
            batch_size=10,
            # Note: maximum_batching_window_in_seconds is not supported for FIFO queues
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Alarm for DLQ
        self.dlq_alarm = cloudwatch.MetricAlarm(
            f"leaderboard-dlq-alarm-{self.environment_suffix}",
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            statistic="Average",
            period=300,
            evaluation_periods=1,
            threshold=10,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "QueueName": self.dlq.name
            },
            alarm_description="Alarm when DLQ has more than 10 messages",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "main_queue_url": self.main_queue.url,
            "dlq_url": self.dlq.url,
            "dynamodb_table_name": self.dynamodb_table.name,
            "lambda_function_name": self.lambda_function.name,
            "dlq_alarm_name": self.dlq_alarm.name
        })
