# Gaming Leaderboard Update System - Pulumi Python Implementation

Here's the complete Pulumi Python infrastructure code for the gaming leaderboard update system with asynchronous processing capabilities:

## tap_stack.py

```python
"""
tap_stack.py

Gaming leaderboard update system with SQS, Lambda, DynamoDB, and monitoring.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import sqs, dynamodb, iam, lambda_, logs, cloudwatch, Provider
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
            f"leaderboard-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Main SQS Queue with redrive policy
        self.main_queue = sqs.Queue(
            f"leaderboard-updates-{self.environment_suffix}",
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
        self.log_group = logs.LogGroup(
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
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
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
            maximum_batching_window_in_seconds=5,
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
```

## lambda/index.py

```python
import json
import os
import boto3
import time
from typing import Dict, Any, List
from decimal import Decimal
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Initialize Powertools
logger = Logger()
metrics = Metrics()
tracer = Tracer()

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
DLQ_URL = os.environ.get('DLQ_URL')

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

@tracer.capture_method
def process_leaderboard_update(record: Dict[str, Any]) -> bool:
    """
    Process a single leaderboard update.

    Args:
        record: SQS message record containing leaderboard update data

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Parse message body
        body = json.loads(record['body'])

        # Validate required fields
        player_id = body.get('player_id')
        score = body.get('score')
        game_id = body.get('game_id')

        if not all([player_id, score is not None, game_id]):
            logger.error(f"Missing required fields in message: {body}")
            metrics.add_metric(name="InvalidMessage", unit=MetricUnit.Count, value=1)
            return False

        # Prepare item for DynamoDB
        timestamp = int(time.time() * 1000)  # Milliseconds
        item = {
            'player_id': player_id,
            'timestamp': timestamp,
            'score': Decimal(str(score)),
            'game_id': game_id,
            'update_type': body.get('update_type', 'score_update'),
            'metadata': body.get('metadata', {}),
            'processing_timestamp': int(time.time()),
            'message_id': record.get('messageId')
        }

        # Write to DynamoDB
        response = table.put_item(Item=item)

        logger.info(f"Successfully processed leaderboard update for player {player_id}",
                   extra={"player_id": player_id, "score": score, "game_id": game_id})

        metrics.add_metric(name="LeaderboardUpdateSuccess", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="PlayerScore", unit=MetricUnit.None, value=float(score))

        return True

    except Exception as e:
        logger.error(f"Error processing leaderboard update: {str(e)}",
                    extra={"error": str(e), "record": record})
        metrics.add_metric(name="LeaderboardUpdateError", unit=MetricUnit.Count, value=1)

        # Send to DLQ if configured
        if DLQ_URL:
            try:
                sqs.send_message(
                    QueueUrl=DLQ_URL,
                    MessageBody=json.dumps({
                        'original_message': record,
                        'error': str(e),
                        'timestamp': int(time.time())
                    }),
                    MessageAttributes={
                        'ErrorType': {
                            'StringValue': type(e).__name__,
                            'DataType': 'String'
                        }
                    }
                )
                logger.info(f"Sent failed message to DLQ: {record.get('messageId')}")
            except Exception as dlq_error:
                logger.error(f"Failed to send message to DLQ: {str(dlq_error)}")

        raise

@logger.inject_lambda_context
@metrics.log_metrics
@tracer.capture_lambda_handler
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing SQS messages containing leaderboard updates.

    Args:
        event: SQS event containing messages
        context: Lambda context object

    Returns:
        dict: Response with batch item failures
    """
    logger.info(f"Processing {len(event.get('Records', []))} messages")

    batch_item_failures = []
    successful_count = 0
    failed_count = 0

    for record in event.get('Records', []):
        try:
            if process_leaderboard_update(record):
                successful_count += 1
            else:
                # Mark as failure if validation fails
                batch_item_failures.append({
                    'itemIdentifier': record['messageId']
                })
                failed_count += 1

        except Exception as e:
            # Mark as failure for processing errors
            batch_item_failures.append({
                'itemIdentifier': record['messageId']
            })
            failed_count += 1
            logger.error(f"Failed to process message {record['messageId']}: {str(e)}")

    # Log summary
    logger.info(f"Processing complete. Success: {successful_count}, Failed: {failed_count}")
    metrics.add_metric(name="BatchProcessingSuccess", unit=MetricUnit.Count, value=successful_count)
    metrics.add_metric(name="BatchProcessingFailed", unit=MetricUnit.Count, value=failed_count)

    # Return batch item failures for retry
    return {
        'batchItemFailures': batch_item_failures
    }
```

## lambda/requirements.txt

```
aws-lambda-powertools[all]==2.31.0
boto3>=1.28.0
```