### Reasoning Trace

---

Let me break down this task to ensure I understand the requirements clearly:

1. **Infrastructure**: AWS CDK v2 in Python
2. **Use Case**: A logistics firm's event-driven messaging system
3. **Volume**: 20,000 daily delivery events
4. **Architecture Components**:
   - SNS topics for event publishing
   - SQS queues for message processing
   - Lambda function for event handling
   - DynamoDB table for storing processed event logs
   - DLQ for failed messages
   - CloudWatch for monitoring and metrics
5. **Security**: Least-privilege IAM roles
6. **Output**: A fully deployable CDK program in a single stack file (tap_stack.py)

The architecture will likely look like:

1. SNS Topic receives delivery events
2. The topic publishes to an SQS Queue
3. Lambda function is triggered by messages in the SQS Queue
4. Lambda processes events and writes results to DynamoDB
5. Failed messages go to a DLQ
6. CloudWatch metrics and alarms monitor the system

Let me create the CDK stack file:

```python
# tap_stack.py
from aws_cdk import (
    Stack,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class LogisticsEventProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS Topic for publishing delivery events
        delivery_events_topic = sns.Topic(
            self, "DeliveryEventsTopic",
            display_name="Logistics Delivery Events Topic",
            topic_name="logistics-delivery-events"
        )

        # Create SQS Queue for processing events
        events_queue = sqs.Queue(
            self, "DeliveryEventsQueue",
            queue_name="logistics-delivery-events-queue",
            visibility_timeout=Duration.seconds(300),  # 5 minutes, matching Lambda timeout
            retention_period=Duration.days(7)  # Keep messages for 7 days
        )

        # Create Dead Letter Queue for failed message processing
        dead_letter_queue = sqs.Queue(
            self, "DeliveryEventsDLQ",
            queue_name="logistics-delivery-events-dlq",
            retention_period=Duration.days(14)  # Keep failed messages longer for analysis
        )

        # Configure main queue to use DLQ after 3 failed attempts
        events_queue.add_dead_letter_queue(
            max_receive_count=3,
            queue=dead_letter_queue
        )

        # Subscribe the SQS queue to the SNS topic
        delivery_events_topic.add_subscription(
            sns_subs.SqsSubscription(events_queue)
        )

        # Create DynamoDB table to store processed events
        events_table = dynamodb.Table(
            self, "ProcessedEventsTable",
            table_name="logistics-processed-events",
            partition_key=dynamodb.Attribute(
                name="event_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN  # Important data, don't delete by default
        )

        # Time-to-live for event records (90 days)
        events_table.add_time_to_live_attribute("ttl")

        # Create Lambda function to process events
        event_processor_function = lambda_.Function(
            self, "EventProcessorFunction",
            function_name="logistics-event-processor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda"),
            handler="event_processor.handler",
            timeout=Duration.seconds(300),  # 5 minute timeout
            environment={
                "EVENTS_TABLE": events_table.table_name,
                "DLQ_URL": dead_letter_queue.queue_url
            },
            memory_size=512  # 512 MB should be sufficient for basic event processing
        )

        # Configure the Lambda to be triggered by the SQS queue
        event_processor_function.add_event_source(
            lambda_.SqsEventSource(events_queue, batch_size=10)
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
            alarm_description="Alarm when more than 10 messages in DLQ",
            alarm_name="LogisticsDLQMessagesAlarm"
        )

        # Alarm for Lambda errors
        lambda_errors_alarm = cloudwatch.Alarm(
            self, "LambdaErrorsAlarm",
            metric=event_processor_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            alarm_description="Alarm when Lambda has more than 5 errors",
            alarm_name="LogisticsLambdaErrorsAlarm"
        )

        # Alarm for SQS queue delay
        queue_delay_alarm = cloudwatch.Alarm(
            self, "QueueDelayAlarm",
            metric=events_queue.metric_approximate_age_of_oldest_message(),
            threshold=300,  # 5 minutes
            evaluation_periods=1,
            alarm_description="Alarm when messages wait in queue longer than 5 minutes",
            alarm_name="LogisticsQueueDelayAlarm"
        )

        # SNS Topic for operational alerts
        alerts_topic = sns.Topic(
            self, "OperationalAlertsTopic",
            display_name="Logistics Operational Alerts",
            topic_name="logistics-operational-alerts"
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
            dashboard_name="LogisticsEventsProcessing"
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
            self, "DeliveryEventsTopicArn",
            description="ARN of the SNS topic for delivery events",
            value=delivery_events_topic.topic_arn
        )
        CfnOutput(
            self, "EventsQueueUrl",
            description="URL of the SQS queue for processing events",
            value=events_queue.queue_url
        )
        CfnOutput(
            self, "DeadLetterQueueUrl",
            description="URL of the DLQ for failed events",
            value=dead_letter_queue.queue_url
        )
        CfnOutput(
            self, "ProcessedEventsTableName",
            description="Name of the DynamoDB table for processed events",
            value=events_table.table_name
        )
        CfnOutput(
            self, "EventProcessorFunctionName",
            description="Name of the Lambda function processing events",
            value=event_processor_function.function_name
        )
        CfnOutput(
            self, "OperationalAlertsTopicArn",
            description="ARN of the SNS topic for operational alerts",
            value=alerts_topic.topic_arn
        )
```

I need to add some Lambda function code for the event processor to make this a complete example:

```python
# lambda/event_processor.py
import json
import os
import boto3
import time
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

            # Generate a unique event ID if not present
            if 'event_id' not in delivery_event:
                delivery_event['event_id'] = str(uuid.uuid4())

            # Add processing timestamp
            current_time = datetime.now().isoformat()
            delivery_event['processed_timestamp'] = current_time

            # Calculate TTL (90 days from now)
            ttl_date = datetime.now() + timedelta(days=90)
            delivery_event['ttl'] = int(ttl_date.timestamp())

            # Store in DynamoDB
            table.put_item(
                Item={
                    'event_id': delivery_event['event_id'],
                    'timestamp': delivery_event.get('timestamp', current_time),
                    'data': delivery_event,
                    'ttl': delivery_event['ttl']
                }
            )

            # Custom processing logic would go here

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
```

I need to update the CDK stack to include the Lambda code directly since the prompt seems to want a single file solution. I'll incorporate the Lambda code as a inline code in the stack definition:

```python
# tap_stack.py
from aws_cdk import (
    Stack,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class LogisticsEventProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS Topic for publishing delivery events
        delivery_events_topic = sns.Topic(
            self, "DeliveryEventsTopic",
            display_name="Logistics Delivery Events Topic",
            topic_name="logistics-delivery-events"
        )

        # Create SQS Queue for processing events
        events_queue = sqs.Queue(
            self, "DeliveryEventsQueue",
            queue_name="logistics-delivery-events-queue",
            visibility_timeout=Duration.seconds(300),  # 5 minutes, matching Lambda timeout
            retention_period=Duration.days(7)  # Keep messages for 7 days
        )

        # Create Dead Letter Queue for failed message processing
        dead_letter_queue = sqs.Queue(
            self, "DeliveryEventsDLQ",
            queue_name="logistics-delivery-events-dlq",
            retention_period=Duration.days(14)  # Keep failed messages longer for analysis
        )

        # Configure main queue to use DLQ after 3 failed attempts
        events_queue.add_dead_letter_queue(
            max_receive_count=3,
            queue=dead_letter_queue
        )

        # Subscribe the SQS queue to the SNS topic
        delivery_events_topic.add_subscription(
            sns_subs.SqsSubscription(events_queue)
        )

        # Create DynamoDB table to store processed events
        events_table = dynamodb.Table(
            self, "ProcessedEventsTable",
            table_name="logistics-processed-events",
            partition_key=dynamodb.Attribute(
                name="event_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN  # Important data, don't delete by default
        )

        # Time-to-live for event records (90 days)
        events_table.add_time_to_live_attribute("ttl")

        # Define Lambda code inline
        lambda_code = """
import json
import os
import boto3
import time
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

            # Generate a unique event ID if not present
            if 'event_id' not in delivery_event:
                delivery_event['event_id'] = str(uuid.uuid4())

            # Add processing timestamp
            current_time = datetime.now().isoformat()
            delivery_event['processed_timestamp'] = current_time

            # Calculate TTL (90 days from now)
            ttl_date = datetime.now() + timedelta(days=90)
            delivery_event['ttl'] = int(ttl_date.timestamp())

            # Store in DynamoDB
            table.put_item(
                Item={
                    'event_id': delivery_event['event_id'],
                    'timestamp': delivery_event.get('timestamp', current_time),
                    'data': delivery_event,
                    'ttl': delivery_event['ttl']
                }
            )

            # Custom processing logic would go here

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
            function_name="logistics-event-processor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.handler",
            timeout=Duration.seconds(300),  # 5 minute timeout
            environment={
                "EVENTS_TABLE": events_table.table_name,
                "DLQ_URL": dead_letter_queue.queue_url
            },
            memory_size=512  # 512 MB should be sufficient for basic event processing
        )

        # Configure the Lambda to be triggered by the SQS queue
        event_processor_function.add_event_source(
            lambda_.SqsEventSource(events_queue, batch_size=10)
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
            alarm_description="Alarm when more than 10 messages in DLQ",
            alarm_name="LogisticsDLQMessagesAlarm"
        )

        # Alarm for Lambda errors
        lambda_errors_alarm = cloudwatch.Alarm(
            self, "LambdaErrorsAlarm",
            metric=event_processor_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            alarm_description="Alarm when Lambda has more than 5 errors",
            alarm_name="LogisticsLambdaErrorsAlarm"
        )

        # Alarm for SQS queue delay
        queue_delay_alarm = cloudwatch.Alarm(
            self, "QueueDelayAlarm",
            metric=events_queue.metric_approximate_age_of_oldest_message(),
            threshold=300,  # 5 minutes
            evaluation_periods=1,
            alarm_description="Alarm when messages wait in queue longer than 5 minutes",
            alarm_name="LogisticsQueueDelayAlarm"
        )

        # SNS Topic for operational alerts
        alerts_topic = sns.Topic(
            self, "OperationalAlertsTopic",
            display_name="Logistics Operational Alerts",
            topic_name="logistics-operational-alerts"
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
            dashboard_name="LogisticsEventsProcessing"
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
            self, "DeliveryEventsTopicArn",
            description="ARN of the SNS topic for delivery events",
            value=delivery_events_topic.topic_arn
        )
        CfnOutput(
            self, "EventsQueueUrl",
            description="URL of the SQS queue for processing events",
            value=events_queue.queue_url
        )
        CfnOutput(
            self, "DeadLetterQueueUrl",
            description="URL of the DLQ for failed events",
            value=dead_letter_queue.queue_url
        )
        CfnOutput(
            self, "ProcessedEventsTableName",
            description="Name of the DynamoDB table for processed events",
            value=events_table.table_name
        )
        CfnOutput(
            self, "EventProcessorFunctionName",
            description="Name of the Lambda function processing events",
            value=event_processor_function.function_name
        )
        CfnOutput(
            self, "OperationalAlertsTopicArn",
            description="ARN of the SNS topic for operational alerts",
            value=alerts_topic.topic_arn
        )
```

I should also include the app.py file that would deploy this stack, so that the overall solution is complete:

```python
#!/usr/bin/env python3
import os
from aws_cdk import App, Environment

from tap_stack import LogisticsEventProcessingStack

app = App()

LogisticsEventProcessingStack(app, "LogisticsEventProcessingStack",
    env=Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

app.synth()
```

But since the prompt specifically asks for a single stack file (tap_stack.py), I'll focus on making sure that file is complete and properly contains all the necessary code.

Let me check if I've missed anything from the requirements:

1. ✅ AWS CDK v2 Python stack
2. ✅ Event-driven messaging system for logistics firm
3. ✅ SNS topics for event publishing
4. ✅ SQS queues for message processing
5. ✅ Lambda function for event handling
6. ✅ DynamoDB for processed event logs
7. ✅ Dead-Letter Queue for failed messages
8. ✅ CloudWatch for queue metrics and monitoring
9. ✅ Least-privilege IAM roles (grants are specific to actions needed)
10. ✅ Fully deployable, secure, and observable

I think we're good! The stack includes all the required components and follows best practices for security and observability. The Lambda function is included inline in the stack to meet the single-file requirement.

Now let me make a few small additions to ensure we have proper queue and topic policies:

Wait, I see that I'm using SqsEventSource for the Lambda but haven't imported it. Let me fix that:

```python
from aws_cdk import (
    Stack,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_event_sources,  # Added this import
    aws_dynamodb as dynamodb,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput
)
```

And then update the Lambda event source configuration:

```python
# Configure the Lambda to be triggered by the SQS queue
event_processor_function.add_event_source(
    lambda_event_sources.SqsEventSource(events_queue, batch_size=10)
)
```

With these corrections, the final version of the file is ready.

Let me now finalize the tap_stack.py file:

### Answer

---

# Event-Driven Messaging System for Logistics Firm (AWS CDK v2)

Below is a complete CDK stack in Python that implements a reliable, scalable event-driven messaging system as requested:

```python
# tap_stack.py
from aws_cdk import (
    Stack,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_sqs as sqs,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_events,
    aws_dynamodb as dynamodb,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class LogisticsEventProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS Topic for publishing delivery events
        delivery_events_topic = sns.Topic(
            self, "DeliveryEventsTopic",
            display_name="Logistics Delivery Events Topic",
            topic_name="logistics-delivery-events"
        )

        # Create SQS Queue for processing events
        events_queue = sqs.Queue(
            self, "DeliveryEventsQueue",
            queue_name="logistics-delivery-events-queue",
            visibility_timeout=Duration.seconds(300),  # 5 minutes
            retention_period=Duration.days(7)  # Keep messages for 7 days
        )

        # Create Dead Letter Queue for failed message processing
        dead_letter_queue = sqs.Queue(
            self, "DeliveryEventsDLQ",
            queue_name="logistics-delivery-events-dlq",
            retention_period=Duration.days(14)  # Keep failed messages longer for analysis
        )

        # Configure main queue to use DLQ after 3 failed attempts
        events_queue.add_dead_letter_queue(
            max_receive_count=3,
            queue=dead_letter_queue
        )

        # Subscribe the SQS queue to the SNS topic
        delivery_events_topic.add_subscription(
            sns_subs.SqsSubscription(events_queue)
        )

        # Create DynamoDB table to store processed events
        events_table = dynamodb.Table(
            self, "ProcessedEventsTable",
            table_name="logistics-processed-events",
            partition_key=dynamodb.Attribute(
                name="event_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN  # Important data, don't delete by default
        )

        # Time-to-live for event records (90 days)
        events_table.add_time_to_live_attribute("ttl")

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

            # Generate a unique event ID if not present
            if 'event_id' not in delivery_event:
                delivery_event['event_id'] = str(uuid.uuid4())

            # Add processing timestamp
            current_time = datetime.now().isoformat()
            delivery_event['processed_timestamp'] = current_time

            # Calculate TTL (90 days from now)
            ttl_date = datetime.now() + timedelta(days=90)
            delivery_event['ttl'] = int(ttl_date.timestamp())

            # Store in DynamoDB
            table.put_item(
                Item={
                    'event_id': delivery_event['event_id'],
                    'timestamp': delivery_event.get('timestamp', current_time),
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
            function_name="logistics-event-processor",
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
            alarm_name="LogisticsDLQMessagesAlarm"
        )

        # Alarm for Lambda errors
        lambda_errors_alarm = cloudwatch.Alarm(
            self, "LambdaErrorsAlarm",
            metric=event_processor_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when Lambda has more than 5 errors",
            alarm_name="LogisticsLambdaErrorsAlarm"
        )

        # Alarm for SQS queue delay
        queue_delay_alarm = cloudwatch.Alarm(
            self, "QueueDelayAlarm",
            metric=events_queue.metric_approximate_age_of_oldest_message(),
            threshold=300,  # 5 minutes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Alarm when messages wait in queue longer than 5 minutes",
            alarm_name="LogisticsQueueDelayAlarm"
        )

        # SNS Topic for operational alerts
        alerts_topic = sns.Topic(
            self, "OperationalAlertsTopic",
            display_name="Logistics Operational Alerts",
            topic_name="logistics-operational-alerts"
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
            dashboard_name="LogisticsEventsProcessing"
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
            self, "DeliveryEventsTopicArn",
            description="ARN of the SNS topic for delivery events",
            value=delivery_events_topic.topic_arn
        )
        CfnOutput(
            self, "EventsQueueUrl",
            description="URL of the SQS queue for processing events",
            value=events_queue.queue_url
        )
        CfnOutput(
            self, "DeadLetterQueueUrl",
            description="URL of the DLQ for failed events",
            value=dead_letter_queue.queue_url
        )
        CfnOutput(
            self, "ProcessedEventsTableName",
            description="Name of the DynamoDB table for processed events",
            value=events_table.table_name
        )
        CfnOutput(
            self, "EventProcessorFunctionName",
            description="Name of the Lambda function processing events",
            value=event_processor_function.function_name
        )
```

## Architecture Overview

This infrastructure deploys a complete event-driven messaging system with:

1. **SNS Topic** - Acts as the entry point for delivery events from various sources
2. **SQS Queue** - Buffers messages for processing, ensuring reliable delivery
3. **Lambda Function** - Processes events asynchronously from the queue
4. **DynamoDB Table** - Stores processed event logs with TTL for automatic cleanup
5. **Dead Letter Queue** - Captures failed messages for troubleshooting
6. **CloudWatch Monitoring** - Provides observability with alarms and dashboards

## Security Features

- **Least-Privilege IAM**: Lambda has only the specific permissions needed:
  - Read from SQS queue
  - Write to DynamoDB
  - Send messages to DLQ
- **Data Retention**: 90-day TTL for event data in DynamoDB
- **Failure Handling**: Configures DLQ after 3 processing attempts

## Monitoring and Alerting

- **CloudWatch Alarms** for:
  - DLQ message count
  - Lambda function errors
  - Message processing delays
- **Operational Dashboard** with key metrics
- **SNS Alerts** sent when thresholds are exceeded

## Deployment Instructions

1. Install AWS CDK: `npm install -g aws-cdk`
2. Configure AWS credentials
3. Create a file named `app.py`:

```python
#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from tap_stack import LogisticsEventProcessingStack

app = App()
LogisticsEventProcessingStack(app, "LogisticsEventProcessingStack")
app.synth()
```

4. Deploy: `cdk deploy`

This system can reliably handle the 20,000 daily delivery events with built-in scalability, error handling, and observability.
