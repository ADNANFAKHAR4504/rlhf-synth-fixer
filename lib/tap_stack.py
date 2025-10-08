from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack, Environment
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cloudwatch_actions
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_lambda_event_sources as lambda_events
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sns_subscriptions as sns_subs
from aws_cdk import aws_sqs as sqs
from constructs import Construct
from dataclasses import dataclass
from typing import Optional


class LogisticsEventProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS Topic for publishing delivery events
        delivery_events_topic = sns.Topic(
            self, "DeliveryEventsTopic",
            display_name=f"Logistics Delivery Events Topic {environment_suffix}",
            topic_name=f"logistics-delivery-events{environment_suffix}"
        )

        # Create Dead Letter Queue for failed message processing
        dead_letter_queue = sqs.Queue(
            self, "DeliveryEventsDLQ",
            queue_name=f"logistics-delivery-events-dlq{environment_suffix}",
            retention_period=Duration.days(14)  # Keep failed messages longer for analysis
        )

        # Create SQS Queue for processing events with DLQ configuration
        events_queue = sqs.Queue(
            self, "DeliveryEventsQueue",
            queue_name=f"logistics-delivery-events-queue{environment_suffix}",
            visibility_timeout=Duration.seconds(300),  # 5 minutes
            retention_period=Duration.days(7),  # Keep messages for 7 days
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dead_letter_queue
            )
        )

        # Subscribe the SQS queue to the SNS topic
        delivery_events_topic.add_subscription(
            sns_subs.SqsSubscription(events_queue)
        )

        # Create DynamoDB table to store processed events
        events_table = dynamodb.Table(
            self, "ProcessedEventsTable",
            table_name=f"logistics-processed-events{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="event_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # Make destroyable to avoid conflicts
            time_to_live_attribute="ttl"  # Time-to-live for event records (90 days)
        )

        # Define Lambda code inline
        lambda_code = """
import json
import os
import boto3
import uuid
from datetime import datetime, timedelta

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

# Get environment variables
EVENTS_TABLE = os.environ['EVENTS_TABLE']
DLQ_URL = os.environ['DLQ_URL']

# Get table resource
table = dynamodb.Table(EVENTS_TABLE)

def handler(event, context):
    processed_count = 0
    failed_count = 0
    
    for record in event['Records']:
        try:
            # Extract message from SQS
            message_body = json.loads(record['body'])
            if 'Message' in message_body:  # Handle SNS->SQS format
                delivery_event = json.loads(message_body['Message'])
            else:
                delivery_event = message_body
                
            # Generate a unique event ID if not present - check both eventId and event_id
            if 'event_id' not in delivery_event and 'eventId' not in delivery_event:
                delivery_event['event_id'] = str(uuid.uuid4())
            elif 'eventId' in delivery_event and 'event_id' not in delivery_event:
                # Convert eventId to event_id for consistency
                delivery_event['event_id'] = delivery_event['eventId']
            
            # Add processing timestamp
            current_time = datetime.now().isoformat()
            delivery_event['processed_timestamp'] = current_time
            
            # Calculate TTL (90 days from now)
            ttl_date = datetime.now() + timedelta(days=90)
            delivery_event['ttl'] = int(ttl_date.timestamp())
            
            # Store in DynamoDB - ensure timestamp is always a string
            timestamp_value = delivery_event.get('timestamp', current_time)
            if isinstance(timestamp_value, (int, float)):
                # Convert numeric timestamp to ISO string format
                timestamp_str = datetime.fromtimestamp(timestamp_value).isoformat()
            else:
                # Assume it's already a string or use current_time
                timestamp_str = str(timestamp_value) if timestamp_value else current_time
            
            table.put_item(
                Item={
                    'event_id': delivery_event['event_id'],
                    'timestamp': timestamp_str,
                    'data': delivery_event,
                    'ttl': delivery_event['ttl']
                }
            )
            
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            failed_count += 1
            
            # Send to DLQ
            try:
                sqs.send_message(
                    QueueUrl=DLQ_URL,
                    MessageBody=json.dumps({
                        'original_message': record['body'],
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    })
                )
            except Exception as dlq_error:
                print(f"Error sending to DLQ: {str(dlq_error)}")
    
    print(f"Processed {processed_count} messages successfully, {failed_count} failed")
    return {
        'processed_count': processed_count,
        'failed_count': failed_count
    }
"""

        # Create Lambda function to process events
        event_processor_function = lambda_.Function(
            self, "EventProcessorFunction",
            function_name=f"logistics-event-processor{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.handler",
            timeout=Duration.seconds(300),  # 5 minute timeout
            environment={
                "EVENTS_TABLE": events_table.table_name,
                "DLQ_URL": dead_letter_queue.queue_url
            },
            memory_size=512
        )

        # Configure the Lambda to be triggered by the SQS queue
        event_processor_function.add_event_source(
            lambda_events.SqsEventSource(events_queue, batch_size=10)
        )

        # Grant the Lambda permissions to write to DynamoDB and send to DLQ
        events_table.grant_write_data(event_processor_function)
        dead_letter_queue.grant_send_messages(event_processor_function)

        # Create CloudWatch Alarms

        # Alarm for DLQ messages
        dlq_messages_alarm = cloudwatch.Alarm(
            self, "DLQMessagesAlarm",
            metric=dead_letter_queue.metric_approximate_number_of_messages_visible(),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when more than 10 messages in DLQ",
            alarm_name=f"LogisticsDLQMessagesAlarm{environment_suffix}"
        )

        # Alarm for Lambda errors
        lambda_errors_alarm = cloudwatch.Alarm(
            self, "LambdaErrorsAlarm",
            metric=event_processor_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when Lambda has more than 5 errors",
            alarm_name=f"LogisticsLambdaErrorsAlarm{environment_suffix}"
        )

        # Alarm for SQS queue delay
        queue_delay_alarm = cloudwatch.Alarm(
            self, "QueueDelayAlarm",
            metric=events_queue.metric_approximate_age_of_oldest_message(),
            threshold=300,  # 5 minutes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when messages wait in queue longer than 5 minutes",
            alarm_name=f"LogisticsQueueDelayAlarm{environment_suffix}"
        )

        # SNS Topic for operational alerts
        alerts_topic = sns.Topic(
            self, "OperationalAlertsTopic",
            display_name=f"Logistics Operational Alerts {environment_suffix}",
            topic_name=f"logistics-operational-alerts{environment_suffix}"
        )

        # Connect alarms to SNS topic
        dlq_messages_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )
        lambda_errors_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )
        queue_delay_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alerts_topic)
        )

        # Dashboard for monitoring the system
        dashboard = cloudwatch.Dashboard(
            self, "LogisticsEventsDashboard",
            dashboard_name=f"LogisticsEventsProcessing{environment_suffix}"
        )

        # Add widgets to the dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="SQS Queue Metrics",
                left=[
                    events_queue.metric_approximate_number_of_messages_visible(),
                    events_queue.metric_approximate_number_of_messages_not_visible(),
                    dead_letter_queue.metric_approximate_number_of_messages_visible()
                ]
            ),
            cloudwatch.GraphWidget(
                title="Lambda Metrics",
                left=[
                    event_processor_function.metric_invocations(),
                    event_processor_function.metric_errors(),
                    event_processor_function.metric_duration()
                ]
            )
        )

        # Outputs
        CfnOutput(
            self, "EventTopicArn",
            description="SNS topic ARN for delivery events",
            value=delivery_events_topic.topic_arn
        )
        CfnOutput(
            self, "ProcessingQueueUrl",
            description="SQS queue URL (main queue)",
            value=events_queue.queue_url
        )
        CfnOutput(
            self, "ProcessingQueueArn",
            description="SQS queue ARN (main)",
            value=events_queue.queue_arn
        )
        CfnOutput(
            self, "DlqQueueUrl",
            description="DLQ SQS queue URL",
            value=dead_letter_queue.queue_url
        )
        CfnOutput(
            self, "HandlerLambdaName",
            description="Lambda function name that processes messages",
            value=event_processor_function.function_name
        )
        CfnOutput(
            self, "DeliveryTableName",
            description="DynamoDB table name for processed logs",
            value=events_table.table_name
        )
        CfnOutput(
            self, "Region",
            description="AWS region where stack is deployed",
            value=self.region
        )
        CfnOutput(
            self, "MonitoringAlarmName",
            description="CloudWatch alarm name(s) for queue depth or errors (optional)",
            value=f"{dlq_messages_alarm.alarm_name},{lambda_errors_alarm.alarm_name},{queue_delay_alarm.alarm_name}"
        )


@dataclass
class TapStackProps:
    """Properties for TapStack configuration."""
    environment_suffix: str
    env: Optional[Environment] = None


class TapStack(LogisticsEventProcessingStack):
    """
    TapStack extends LogisticsEventProcessingStack to provide the required interface
    for the TAP (Test Automation Platform) infrastructure.
    """
    
    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
        # Pass the env from props if provided
        if props.env:
            kwargs['env'] = props.env
        
        super().__init__(scope, construct_id, props.environment_suffix, **kwargs)
        
        # Store the environment suffix for potential future use
        self.environment_suffix = props.environment_suffix
