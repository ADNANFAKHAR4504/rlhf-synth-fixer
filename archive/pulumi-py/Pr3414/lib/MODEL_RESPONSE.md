# Pulumi Python Infrastructure for Asynchronous Event Processing System

Here's the complete Pulumi Python infrastructure code for your marketing firm's asynchronous event processing system:

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project implementing an asynchronous event
processing system for marketing campaign events.
"""

import json
import base64
from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import sqs, dynamodb, lambda_, iam, cloudwatch, logs

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}

class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the event processing system.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Environment': self.environment_suffix,
            'System': 'EventProcessing'
        }

        # Create Dead Letter Queue
        self.dlq = sqs.Queue(
            f"campaign-events-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create main SQS Queue with DLQ configuration
        self.main_queue = sqs.Queue(
            f"campaign-events-queue-{self.environment_suffix}",
            visibility_timeout_seconds=120,
            message_retention_seconds=1209600,  # 14 days
            redrive_policy=self.dlq.arn.apply(lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": 3
            })),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for event logging
        self.event_log_table = dynamodb.Table(
            f"campaign-events-log-{self.environment_suffix}",
            name=f"campaign-events-log-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="event_id",
            range_key="timestamp",
            attributes=[
                dynamodb.TableAttributeArgs(
                    name="event_id",
                    type="S"
                ),
                dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="S"
                )
            ],
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = logs.LogGroup(
            f"/aws/lambda/campaign-event-processor-{self.environment_suffix}",
            name=f"/aws/lambda/campaign-event-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = iam.Role(
            f"campaign-event-processor-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM policy for Lambda execution
        self.lambda_policy = iam.Policy(
            f"campaign-event-processor-policy-{self.environment_suffix}",
            policy=Output.all(
                self.main_queue.arn,
                self.event_log_table.arn,
                self.lambda_log_group.arn
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
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{args[2]}:*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to role
        self.lambda_role_policy_attachment = iam.RolePolicyAttachment(
            f"campaign-event-processor-policy-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function code
        lambda_code = """
import json
import boto3
import os
from datetime import datetime
import traceback
import uuid

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']

def handler(event, context):
    table = dynamodb.Table(table_name)
    batch_results = {
        'successful': 0,
        'failed': 0,
        'records': []
    }

    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            message_id = record['messageId']

            # Process campaign event
            event_id = message_body.get('event_id', str(uuid.uuid4()))
            timestamp = datetime.utcnow().isoformat()

            # Simulate event processing
            if 'campaign_id' not in message_body:
                raise ValueError('Missing campaign_id in message')

            # Log successful processing to DynamoDB
            table.put_item(
                Item={
                    'event_id': event_id,
                    'timestamp': timestamp,
                    'status': 'SUCCESS',
                    'message_body': json.dumps(message_body),
                    'message_id': message_id,
                    'campaign_id': message_body.get('campaign_id'),
                    'processed_at': timestamp
                }
            )

            batch_results['successful'] += 1
            batch_results['records'].append({
                'event_id': event_id,
                'status': 'SUCCESS'
            })

            print(f"Successfully processed event {event_id}")

        except Exception as e:
            error_message = str(e)
            print(f"Error processing record: {error_message}")
            print(traceback.format_exc())

            # Log failed processing to DynamoDB
            try:
                failed_event_id = message_body.get('event_id', str(uuid.uuid4())) if 'message_body' in locals() else str(uuid.uuid4())
                table.put_item(
                    Item={
                        'event_id': failed_event_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'status': 'FAILED',
                        'message_body': record.get('body', ''),
                        'error_message': error_message,
                        'message_id': record.get('messageId', 'unknown')
                    }
                )
            except Exception as log_error:
                print(f"Failed to log error to DynamoDB: {str(log_error)}")

            batch_results['failed'] += 1
            batch_results['records'].append({
                'event_id': failed_event_id if 'failed_event_id' in locals() else 'unknown',
                'status': 'FAILED',
                'error': error_message
            })

            # Re-raise to trigger retry via DLQ
            raise

    print(f"Batch processing complete. Successful: {batch_results['successful']}, Failed: {batch_results['failed']}")
    return batch_results
"""

        # Create Lambda function
        self.event_processor = lambda_.Function(
            f"campaign-event-processor-{self.environment_suffix}",
            name=f"campaign-event-processor-{self.environment_suffix}",
            role=self.lambda_role.arn,
            handler="index.handler",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=90,
            memory_size=256,
            reserved_concurrent_executions=10,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.event_log_table.name,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            dead_letter_config=lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.dlq.arn
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_role_policy_attachment])
        )

        # Create SQS Event Source Mapping
        self.event_source_mapping = lambda_.EventSourceMapping(
            f"sqs-lambda-mapping-{self.environment_suffix}",
            event_source_arn=self.main_queue.arn,
            function_name=self.event_processor.arn,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Alarms

        # Alarm for queue message age
        self.queue_age_alarm = cloudwatch.MetricAlarm(
            f"campaign-queue-message-age-alarm-{self.environment_suffix}",
            name=f"campaign-queue-message-age-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateAgeOfOldestMessage",
            namespace="AWS/SQS",
            period=60,
            statistic="Maximum",
            threshold=300,
            alarm_description="Alert when messages are older than 5 minutes",
            dimensions={
                "QueueName": self.main_queue.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Alarm for DLQ messages
        self.dlq_alarm = cloudwatch.MetricAlarm(
            f"campaign-dlq-messages-alarm-{self.environment_suffix}",
            name=f"campaign-dlq-messages-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alert when messages appear in DLQ",
            dimensions={
                "QueueName": self.dlq.name
            },
            treat_missing_data="notBreaching",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "main_queue_url": self.main_queue.url,
            "main_queue_arn": self.main_queue.arn,
            "dlq_url": self.dlq.url,
            "dynamodb_table_name": self.event_log_table.name,
            "lambda_function_name": self.event_processor.name,
            "lambda_function_arn": self.event_processor.arn
        })
```

## File: lib/lambda_handler.py

```python
"""
Lambda handler for processing campaign events from SQS queue.
This module contains the main handler function for processing marketing campaign events.
"""

import json
import boto3
import os
from datetime import datetime
import traceback
import uuid

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']

def handler(event, context):
    """
    Process campaign events from SQS queue and log to DynamoDB.

    Args:
        event: SQS event containing campaign messages
        context: Lambda context object

    Returns:
        dict: Processing results with success/failure counts
    """
    table = dynamodb.Table(table_name)
    batch_results = {
        'successful': 0,
        'failed': 0,
        'records': []
    }

    for record in event.get('Records', []):
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            message_id = record['messageId']

            # Process campaign event
            event_id = message_body.get('event_id', str(uuid.uuid4()))
            timestamp = datetime.utcnow().isoformat()

            # Validate required fields
            required_fields = ['campaign_id', 'user_id', 'action_type']
            for field in required_fields:
                if field not in message_body:
                    raise ValueError(f'Missing required field: {field}')

            # Simulate event processing logic
            processed_data = process_campaign_event(message_body)

            # Log successful processing to DynamoDB
            table.put_item(
                Item={
                    'event_id': event_id,
                    'timestamp': timestamp,
                    'status': 'SUCCESS',
                    'message_body': json.dumps(message_body),
                    'message_id': message_id,
                    'campaign_id': message_body.get('campaign_id'),
                    'user_id': message_body.get('user_id'),
                    'action_type': message_body.get('action_type'),
                    'processed_data': json.dumps(processed_data),
                    'processed_at': timestamp
                }
            )

            batch_results['successful'] += 1
            batch_results['records'].append({
                'event_id': event_id,
                'status': 'SUCCESS'
            })

            print(f"Successfully processed event {event_id} for campaign {message_body.get('campaign_id')}")

        except Exception as e:
            error_message = str(e)
            print(f"Error processing record: {error_message}")
            print(traceback.format_exc())

            # Log failed processing to DynamoDB
            try:
                failed_event_id = message_body.get('event_id', str(uuid.uuid4())) if 'message_body' in locals() else str(uuid.uuid4())
                table.put_item(
                    Item={
                        'event_id': failed_event_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'status': 'FAILED',
                        'message_body': record.get('body', ''),
                        'error_message': error_message,
                        'message_id': record.get('messageId', 'unknown'),
                        'retry_count': record.get('attributes', {}).get('ApproximateReceiveCount', 0)
                    }
                )
            except Exception as log_error:
                print(f"Failed to log error to DynamoDB: {str(log_error)}")

            batch_results['failed'] += 1
            batch_results['records'].append({
                'event_id': failed_event_id if 'failed_event_id' in locals() else 'unknown',
                'status': 'FAILED',
                'error': error_message
            })

            # Re-raise to trigger retry via DLQ
            raise

    print(f"Batch processing complete. Successful: {batch_results['successful']}, Failed: {batch_results['failed']}")
    return batch_results

def process_campaign_event(event_data):
    """
    Process individual campaign event.

    Args:
        event_data: Campaign event data from SQS message

    Returns:
        dict: Processed event data
    """
    # Simulate campaign event processing
    action_type = event_data.get('action_type', 'unknown')

    processing_result = {
        'action_type': action_type,
        'processed_timestamp': datetime.utcnow().isoformat()
    }

    if action_type == 'email_open':
        processing_result['engagement_score'] = 5
    elif action_type == 'link_click':
        processing_result['engagement_score'] = 10
    elif action_type == 'conversion':
        processing_result['engagement_score'] = 20
    else:
        processing_result['engagement_score'] = 1

    return processing_result
```