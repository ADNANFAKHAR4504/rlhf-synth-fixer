"""tap_stack.py
Fixed version without nested stacks to avoid circular dependencies.
All resources are created directly in the main stack.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_lambda_event_sources as lambda_event_sources
from aws_cdk import aws_logs as logs
from aws_cdk import aws_sqs as sqs
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main CDK stack for the Shipment Events Processing Platform."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ========================================================================
        # DynamoDB Table
        # ========================================================================
        events_table = dynamodb.Table(
            self,
            "EventsTable",
            table_name=f"shipmentevents-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="shipment_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="event_timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            time_to_live_attribute="expires_at",
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        )
        
        # GSI for querying by processing status
        events_table.add_global_secondary_index(
            index_name="status-timestamp-index",
            partition_key=dynamodb.Attribute(
                name="processing_status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="event_timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # ========================================================================
        # SQS Queues
        # ========================================================================
        
        # Dead Letter Queue
        dlq = sqs.Queue(
            self,
            "ShipmentEventsDLQ",
            queue_name=f"shipmentevents-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(300),
        )
        
        # Main Processing Queue
        main_queue = sqs.Queue(
            self,
            "ShipmentEventsQueue",
            queue_name=f"shipmentevents-queue-{environment_suffix}",
            visibility_timeout=Duration.seconds(360),
            retention_period=Duration.days(4),
            receive_message_wait_time=Duration.seconds(20),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            ),
        )

        # ========================================================================
        # Lambda Function
        # ========================================================================
        
        # Lambda Execution Role
        lambda_role = iam.Role(
            self,
            "ProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for shipment event processor Lambda - {environment_suffix}",
        )
        
        # Attach managed policies
        lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        )
        
        # Grant permissions
        main_queue.grant_consume_messages(lambda_role)
        dlq.grant_send_messages(lambda_role)
        events_table.grant_read_write_data(lambda_role)
        
        # Lambda Function Code - Updated to handle EventBridge envelope
        lambda_code = '''
import json
import os
import boto3
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['EVENTS_TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    """Process shipment events from SQS with idempotent handling.
    
    Handles both direct SQS messages and EventBridge-wrapped messages.
    EventBridge wraps events in an envelope with the actual data in the 'detail' field.
    """
    logger.info(f"Received {len(event['Records'])} messages")
    
    batch_item_failures = []
    
    for record in event['Records']:
        message_id = record['messageId']
        
        try:
            # Parse message body
            body = json.loads(record['body'])
            
            # Check if this is an EventBridge envelope
            # EventBridge messages have 'detail-type', 'source', and 'detail' fields
            if 'detail' in body and 'source' in body and 'detail-type' in body:
                logger.info(f"Processing EventBridge envelope message: {message_id}")
                # Extract the actual event from the 'detail' field
                event_payload = body['detail']
            else:
                logger.info(f"Processing direct SQS message: {message_id}")
                # Direct SQS message - use body as is
                event_payload = body
            
            # Extract event data from the payload
            shipment_id = event_payload.get('shipment_id')
            event_timestamp = event_payload.get('event_timestamp')
            event_type = event_payload.get('event_type')
            event_data = event_payload.get('event_data', {})
            
            # Validate required fields
            if not all([shipment_id, event_timestamp, event_type]):
                logger.error(f"Missing required fields in message {message_id}")
                logger.error(f"Payload: {json.dumps(event_payload)}")
                raise ValueError("Missing required fields")
            
            # Calculate TTL (90 days from now)
            ttl = int((datetime.now() + timedelta(days=90)).timestamp())
            
            # Prepare DynamoDB item
            item = {
                'shipment_id': shipment_id,
                'event_timestamp': event_timestamp,
                'event_type': event_type,
                'processing_status': 'PROCESSED',
                'event_data': event_data,
                'processed_at': datetime.utcnow().isoformat(),
                'retry_count': int(record.get('attributes', {}).get('ApproximateReceiveCount', 1)),
                'message_id': message_id,
                'expires_at': ttl
            }
            
            # Idempotent write
            table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(shipment_id) AND attribute_not_exists(event_timestamp)'
            )
            
            logger.info(f"Successfully processed event for shipment {shipment_id}")
            
        except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            logger.info(f"Event already processed for message {message_id} - skipping")
            
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {str(e)}")
            logger.error(f"Message body: {json.dumps(body) if 'body' in locals() else 'Unable to parse body'}")
            
            # Try to write failure record
            try:
                # Extract event_payload if available, otherwise use body
                failure_payload = event_payload if 'event_payload' in locals() else body
                
                failure_item = {
                    'shipment_id': failure_payload.get('shipment_id', 'UNKNOWN'),
                    'event_timestamp': failure_payload.get('event_timestamp', datetime.utcnow().isoformat()),
                    'processing_status': 'FAILED',
                    'error_message': str(e),
                    'retry_count': int(record.get('attributes', {}).get('ApproximateReceiveCount', 1)),
                    'message_id': message_id,
                    'event_data': failure_payload,
                    'processed_at': datetime.utcnow().isoformat(),
                    'expires_at': int((datetime.now() + timedelta(days=90)).timestamp())
                }
                table.put_item(Item=failure_item)
            except Exception as db_error:
                logger.error(f"Failed to write error record: {str(db_error)}")
            
            # Add to batch failures for retry
            batch_item_failures.append({"itemIdentifier": message_id})
    
    return {"batchItemFailures": batch_item_failures}
'''
        
        # Create Lambda Function
        processor_function = lambda_.Function(
            self,
            "ShipmentEventProcessor",
            function_name=f"shipment-event-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(lambda_code),
            timeout=Duration.seconds(60),
            memory_size=512,
            role=lambda_role,
            environment={
                'EVENTS_TABLE_NAME': events_table.table_name,
                'ENVIRONMENT': environment_suffix
            },
            log_retention=logs.RetentionDays.ONE_MONTH,
            tracing=lambda_.Tracing.ACTIVE,
        )
        
        # Add SQS Event Source
        processor_function.add_event_source(
            lambda_event_sources.SqsEventSource(
                main_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(10),
                report_batch_item_failures=True,
            )
        )

        # ========================================================================
        # EventBridge
        # ========================================================================
        
        # Custom Event Bus
        event_bus = events.EventBus(
            self,
            "ShipmentEventBus",
            event_bus_name=f"shipmentevents-{environment_suffix}"
        )
        
        # Event Rule
        event_rule = events.Rule(
            self,
            "ShipmentEventRule",
            rule_name=f"shipment-event-rule-{environment_suffix}",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["shipment.service"],
                detail_type=events.Match.prefix("shipment.")
            ),
            targets=[
                targets.SqsQueue(
                    main_queue,
                    retry_attempts=2,
                    max_event_age=Duration.hours(2),
                )
            ]
        )
        
        # Archive
        archive = events.Archive(
            self,
            "ShipmentEventArchive",
            archive_name=f"shipmentevents-archive-{environment_suffix}",
            source_event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["shipment.service"]
            ),
            retention=Duration.days(7)
        )

        # ========================================================================
        # CloudWatch Monitoring
        # ========================================================================
        
        # Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            "ShipmentProcessingDashboard",
            dashboard_name=f"shipmentprocessing-{environment_suffix}",
        )
        
        # Queue Metrics Widget
        queue_widget = cloudwatch.GraphWidget(
            title="SQS Queue Metrics",
            left=[
                main_queue.metric_approximate_number_of_messages_visible(
                    label="Messages Visible",
                    statistic="Average",
                    period=Duration.minutes(1)
                ),
                main_queue.metric_approximate_age_of_oldest_message(
                    label="Oldest Message Age (seconds)",
                    statistic="Maximum",
                    period=Duration.minutes(1)
                ),
            ],
            right=[
                main_queue.metric_number_of_messages_sent(
                    label="Messages Sent",
                    statistic="Sum",
                    period=Duration.minutes(1)
                ),
                main_queue.metric_number_of_messages_received(
                    label="Messages Received",
                    statistic="Sum",
                    period=Duration.minutes(1)
                ),
            ]
        )
        
        # DLQ Widget
        dlq_widget = cloudwatch.GraphWidget(
            title="Dead Letter Queue Metrics",
            left=[
                dlq.metric_approximate_number_of_messages_visible(
                    label="Messages in DLQ",
                    statistic="Average",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.RED
                ),
            ]
        )
        
        # Lambda Widget
        lambda_widget = cloudwatch.GraphWidget(
            title="Lambda Processing Metrics",
            left=[
                processor_function.metric_invocations(
                    label="Invocations",
                    statistic="Sum",
                    period=Duration.minutes(1)
                ),
                processor_function.metric_errors(
                    label="Errors",
                    statistic="Sum",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.RED
                ),
            ],
            right=[
                processor_function.metric_throttles(
                    label="Throttles",
                    statistic="Sum",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.ORANGE
                ),
            ]
        )
        
        # Lambda Duration Widget
        duration_widget = cloudwatch.GraphWidget(
            title="Lambda Duration (ms)",
            left=[
                processor_function.metric_duration(
                    label="p50",
                    statistic="p50",
                    period=Duration.minutes(1)
                ),
                processor_function.metric_duration(
                    label="p99",
                    statistic="p99",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.ORANGE
                ),
                processor_function.metric_duration(
                    label="Average",
                    statistic="Average",
                    period=Duration.minutes(1)
                ),
            ]
        )
        
        # DynamoDB Widget
        dynamodb_widget = cloudwatch.GraphWidget(
            title="DynamoDB Metrics",
            left=[
                events_table.metric_consumed_read_capacity_units(
                    label="Read Capacity Units",
                    statistic="Sum",
                    period=Duration.minutes(1)
                ),
                events_table.metric_consumed_write_capacity_units(
                    label="Write Capacity Units",
                    statistic="Sum",
                    period=Duration.minutes(1)
                ),
            ],
            right=[
                events_table.metric_user_errors(
                    label="User Errors",
                    statistic="Sum",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.RED
                ),
                events_table.metric_system_errors_for_operations(
                    label="System Errors",
                    statistic="Sum",
                    period=Duration.minutes(1),
                    color=cloudwatch.Color.RED
                ),
            ]
        )
        
        # Add widgets to dashboard
        dashboard.add_widgets(queue_widget, dlq_widget)
        dashboard.add_widgets(lambda_widget, duration_widget)
        dashboard.add_widgets(dynamodb_widget)
        
        # ========================================================================
        # CloudWatch Alarms
        # ========================================================================
        
        # High Queue Depth Alarm
        queue_depth_alarm = cloudwatch.Alarm(
            self,
            "HighQueueDepthAlarm",
            alarm_name=f"shipment-high-queue-depth-{environment_suffix}",
            alarm_description="Alert when SQS queue depth exceeds 1000 messages",
            metric=main_queue.metric_approximate_number_of_messages_visible(
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=1000,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        
        # DLQ Messages Alarm
        dlq_alarm = cloudwatch.Alarm(
            self,
            "MessagesInDLQAlarm",
            alarm_name=f"shipment-messages-in-dlq-{environment_suffix}",
            alarm_description="Alert when messages appear in DLQ",
            metric=dlq.metric_approximate_number_of_messages_visible(
                statistic="Average",
                period=Duration.minutes(1)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )
        
        # Lambda Error Rate Alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "HighLambdaErrorRateAlarm",
            alarm_name=f"shipment-high-lambda-error-rate-{environment_suffix}",
            alarm_description="Alert when Lambda error rate exceeds 5%",
            metric=cloudwatch.MathExpression(
                expression="(errors / invocations) * 100",
                using_metrics={
                    "errors": processor_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                    "invocations": processor_function.metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5)
                    ),
                },
                label="Error Rate (%)"
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        
        # Lambda Throttles Alarm
        lambda_throttle_alarm = cloudwatch.Alarm(
            self,
            "LambdaThrottleAlarm",
            alarm_name=f"shipment-lambda-throttles-{environment_suffix}",
            alarm_description="Alert when Lambda function is throttled",
            metric=processor_function.metric_throttles(
                statistic="Sum",
                period=Duration.minutes(1)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )
        
        # Lambda Duration Alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self,
            "HighLambdaDurationAlarm",
            alarm_name=f"shipment-high-lambda-duration-{environment_suffix}",
            alarm_description="Alert when Lambda p99 duration exceeds 50 seconds",
            metric=processor_function.metric_duration(
                statistic="p99",
                period=Duration.minutes(5)
            ),
            threshold=50000,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        
        # Old Messages Alarm
        old_message_alarm = cloudwatch.Alarm(
            self,
            "OldMessageAlarm",
            alarm_name=f"shipment-old-messages-{environment_suffix}",
            alarm_description="Alert when messages are too old in queue (> 1 hour)",
            metric=main_queue.metric_approximate_age_of_oldest_message(
                statistic="Maximum",
                period=Duration.minutes(5)
            ),
            threshold=3600,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # ========================================================================
        # Stack Outputs
        # ========================================================================
        
        CfnOutput(self, "SQSQueueURL", value=main_queue.queue_url,
                  export_name=f"ShipmentEventsQueueURL-{environment_suffix}")
        CfnOutput(self, "SQSQueueARN", value=main_queue.queue_arn,
                  export_name=f"ShipmentEventsQueueARN-{environment_suffix}")
        CfnOutput(self, "DLQueueURL", value=dlq.queue_url,
                  export_name=f"ShipmentEventsDLQURL-{environment_suffix}")
        CfnOutput(self, "ProcessorLambdaARN", value=processor_function.function_arn,
                  export_name=f"ShipmentProcessorLambdaARN-{environment_suffix}")
        CfnOutput(self, "EventsTableName", value=events_table.table_name,
                  export_name=f"ShipmentEventsTableName-{environment_suffix}")
        CfnOutput(self, "EventBusName", value=event_bus.event_bus_name,
                  export_name=f"ShipmentEventBusName-{environment_suffix}")
        CfnOutput(self, "DashboardURL",
                  value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={dashboard.dashboard_name}",
                  export_name=f"ShipmentDashboardURL-{environment_suffix}")