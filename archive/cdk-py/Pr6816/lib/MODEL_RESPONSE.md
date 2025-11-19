# Payment Webhook Processing System - Implementation

This implementation provides a serverless payment webhook processing system using AWS CDK with Python.

## File: lib/tap_stack.py

```python
"""Payment Webhook Processing Stack"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    aws_apigateway as apigw,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_kms as kms,
    aws_iam as iam,
    aws_wafv2 as wafv2,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_lambda_event_sources as lambda_event_sources,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """Main stack for payment webhook processing system"""

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

        # Create KMS Key for encryption (INTENTIONAL ERROR: missing key policy)
        kms_key = kms.Key(
            self, "EncryptionKey",
            description=f"Encryption key for payment webhook system-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create DynamoDB Table (INTENTIONAL ERROR: table name doesn't include suffix)
        webhooks_table = dynamodb.Table(
            self, "WebhooksTable",
            table_name="PaymentWebhooks",  # Missing environmentSuffix
            partition_key=dynamodb.Attribute(
                name="webhookId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Dead Letter Queue (INTENTIONAL ERROR: queue name missing suffix)
        dlq = sqs.Queue(
            self, "WebhookDLQ",
            queue_name="webhook-dlq",  # Missing environmentSuffix
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=kms_key,
        )

        # Create SNS Topic for alerts (INTENTIONAL ERROR: topic name missing suffix)
        alert_topic = sns.Topic(
            self, "AlertTopic",
            topic_name="webhook-alerts",  # Missing environmentSuffix
            display_name="Payment Webhook Alerts",
            master_key=kms_key,
        )

        # Create Lambda Layer (INTENTIONAL ERROR: layer not properly created)
        shared_layer = lambda_.LayerVersion(
            self, "SharedLayer",
            code=lambda_.Code.from_asset("lib/lambda/layer"),  # Path may not exist
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
            description="Shared dependencies for webhook processing",
        )

        # Create Webhook Receiver Lambda (INTENTIONAL ERROR: reserved concurrency too high)
        webhook_receiver = lambda_.Function(
            self, "WebhookReceiver",
            function_name=f"webhook-receiver-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="receiver.handler",
            code=lambda_.Code.from_asset("lib/lambda/receiver"),
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=100,  # May exceed account limits
            layers=[shared_layer],
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
                "DLQ_URL": dlq.queue_url,
            },
        )

        # Grant permissions
        webhooks_table.grant_write_data(webhook_receiver)
        dlq.grant_send_messages(webhook_receiver)
        kms_key.grant_encrypt_decrypt(webhook_receiver)

        # Create Payment Processor Lambda (INTENTIONAL ERROR: missing DLQ configuration)
        payment_processor = lambda_.Function(
            self, "PaymentProcessor",
            function_name=f"payment-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="processor.handler",
            code=lambda_.Code.from_asset("lib/lambda/processor"),
            timeout=Duration.minutes(5),
            reserved_concurrent_executions=50,
            layers=[shared_layer],
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
            },
            # Missing dead_letter_queue configuration
        )

        webhooks_table.grant_read_write_data(payment_processor)
        kms_key.grant_encrypt_decrypt(payment_processor)

        # Create Audit Logger Lambda (INTENTIONAL ERROR: missing X-Ray tracing)
        audit_logger = lambda_.Function(
            self, "AuditLogger",
            function_name=f"audit-logger-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="audit.handler",
            code=lambda_.Code.from_asset("lib/lambda/audit"),
            timeout=Duration.seconds(60),
            layers=[shared_layer],
            # Missing tracing=lambda_.Tracing.ACTIVE
            environment={
                "TABLE_NAME": webhooks_table.table_name,
            },
        )

        # Add DynamoDB Stream as event source
        audit_logger.add_event_source(
            lambda_event_sources.DynamoEventSource(
                webhooks_table,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=10,
                retry_attempts=2,
            )
        )

        webhooks_table.grant_stream_read(audit_logger)
        kms_key.grant_encrypt_decrypt(audit_logger)

        # Create API Gateway (INTENTIONAL ERROR: missing throttling configuration)
        api = apigw.RestApi(
            self, "WebhookAPI",
            rest_api_name=f"webhook-api-{environment_suffix}",
            description="Payment Webhook Processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                tracing_enabled=True,
                # Missing throttling_rate_limit and throttling_burst_limit
            ),
        )

        # Add webhook resource with path parameter
        webhook_resource = api.root.add_resource("webhook")
        provider_resource = webhook_resource.add_resource("{provider}")

        # Integrate with Lambda
        webhook_integration = apigw.LambdaIntegration(
            webhook_receiver,
            proxy=True,
        )

        provider_resource.add_method("POST", webhook_integration)

        # Create WAF Web ACL (INTENTIONAL ERROR: rate limit rule missing)
        web_acl = wafv2.CfnWebACL(
            self, "WebhookWAF",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(
                allow={}
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"webhook-waf-{environment_suffix}",
                sampled_requests_enabled=True,
            ),
            rules=[
                # Missing rate-based rule for 10 req/sec per IP
            ],
        )

        # Associate WAF with API Gateway (INTENTIONAL ERROR: incorrect association)
        # This won't work properly without the stage ARN
        wafv2.CfnWebACLAssociation(
            self, "WAFAssociation",
            resource_arn=api.deployment_stage.stage_arn,
            web_acl_arn=web_acl.attr_arn,
        )

        # Create CloudWatch Alarm for DLQ (INTENTIONAL ERROR: wrong metric)
        dlq_alarm = cloudwatch.Alarm(
            self, "DLQAlarm",
            alarm_name=f"webhook-dlq-alarm-{environment_suffix}",
            metric=dlq.metric_approximate_number_of_messages_visible(),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )

        dlq_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))

        # Output important values
        cdk.CfnOutput(
            self, "APIEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        cdk.CfnOutput(
            self, "TableName",
            value=webhooks_table.table_name,
            description="DynamoDB table name",
        )

        cdk.CfnOutput(
            self, "DLQUrl",
            value=dlq.queue_url,
            description="Dead letter queue URL",
        )
```

## File: lib/lambda/receiver/receiver.py

```python
"""Webhook receiver Lambda function"""
import json
import os
import time
import uuid
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TABLE_NAME = os.environ['TABLE_NAME']
DLQ_URL = os.environ['DLQ_URL']

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """Process incoming webhook requests"""
    try:
        # Extract provider from path parameters
        provider = event.get('pathParameters', {}).get('provider')

        if not provider:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing provider parameter'})
            }

        # Parse webhook payload
        body = json.loads(event.get('body', '{}'))

        # Generate webhook ID
        webhook_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Store in DynamoDB
        table.put_item(
            Item={
                'webhookId': webhook_id,
                'timestamp': timestamp,
                'provider': provider,
                'payload': json.dumps(body),
                'status': 'received',
                'processedAt': None,
            }
        )

        # INTENTIONAL ERROR: Not sending to processor queue for async processing
        # Should integrate with SQS or invoke processor Lambda asynchronously

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Webhook received',
                'webhookId': webhook_id,
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {str(e)}")

        # Send to DLQ
        try:
            sqs.send_message(
                QueueUrl=DLQ_URL,
                MessageBody=json.dumps({
                    'error': str(e),
                    'event': event,
                })
            )
        except Exception as dlq_error:
            print(f"Failed to send to DLQ: {str(dlq_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/processor/processor.py

```python
"""Payment processor Lambda function"""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """Process payment webhooks"""
    try:
        # INTENTIONAL ERROR: Missing proper event source handling
        # Should handle SQS or EventBridge events properly

        for record in event.get('Records', []):
            # Process each webhook
            webhook_data = json.loads(record.get('body', '{}'))
            webhook_id = webhook_data.get('webhookId')

            if not webhook_id:
                continue

            # Simulate payment processing
            # In real implementation, this would call payment provider APIs
            process_payment(webhook_id)

            # Update DynamoDB
            table.update_item(
                Key={
                    'webhookId': webhook_id,
                    'timestamp': webhook_data.get('timestamp'),
                },
                UpdateExpression='SET #status = :status, processedAt = :processed',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'processed',
                    ':processed': datetime.utcnow().isoformat(),
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing complete'})
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        raise  # Re-raise to trigger DLQ


def process_payment(webhook_id):
    """Process individual payment"""
    # Placeholder for payment processing logic
    print(f"Processing payment for webhook: {webhook_id}")
    # INTENTIONAL ERROR: Missing actual business logic
    pass
```

## File: lib/lambda/audit/audit.py

```python
"""Audit logger Lambda function"""
import json
import os
from datetime import datetime

# INTENTIONAL ERROR: Missing boto3 import and logging setup
# In real implementation, this would log to CloudWatch Logs or separate audit table


def handler(event, context):
    """Log DynamoDB stream events for audit trail"""
    try:
        for record in event.get('Records', []):
            event_name = record.get('eventName')

            if event_name in ['INSERT', 'MODIFY', 'REMOVE']:
                # Extract data from stream record
                keys = record.get('dynamodb', {}).get('Keys', {})
                new_image = record.get('dynamodb', {}).get('NewImage', {})
                old_image = record.get('dynamodb', {}).get('OldImage', {})

                # Create audit log entry
                audit_entry = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'eventName': event_name,
                    'webhookId': keys.get('webhookId', {}).get('S'),
                    'changes': {
                        'old': old_image,
                        'new': new_image,
                    }
                }

                # INTENTIONAL ERROR: Just printing instead of persisting
                print(json.dumps(audit_entry))
                # Should write to separate audit table or CloudWatch Logs Insights

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Audit logging complete'})
        }

    except Exception as e:
        print(f"Error in audit logging: {str(e)}")
        # INTENTIONAL ERROR: Not raising exception, swallowing errors
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## File: lib/lambda/layer/python/requirements.txt

```text
boto3==1.34.51
cryptography==42.0.2
```

## Summary

This implementation provides:
- API Gateway REST API with `/webhook/{provider}` endpoint
- Three Lambda functions (receiver, processor, audit logger)
- DynamoDB table with streams
- SQS Dead Letter Queue
- SNS topic for alerts
- KMS encryption
- CloudWatch alarms
- WAF integration (partial)

Known Issues (Intentional for Training):
1. Resource names missing environmentSuffix in some places
2. Lambda reserved concurrency may exceed account limits
3. WAF rate limiting rule not implemented
4. API Gateway throttling not configured
5. Lambda layer path may not exist
6. Payment processor missing async invocation mechanism
7. Audit logger not persisting to durable storage
8. Missing proper error handling in some functions
9. No unit tests included
10. Lambda functions reference code directories that need to be created
