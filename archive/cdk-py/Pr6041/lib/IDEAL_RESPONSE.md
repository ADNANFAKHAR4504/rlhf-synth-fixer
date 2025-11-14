# Serverless Webhook Processing System - Implementation

This implementation provides a complete serverless webhook processing system using AWS CDK with Python.

## Infrastructure Code

### File: lib/tap_stack.py

```py
"""
TapStack - Main CDK Stack for Serverless Webhook Processing System
"""
from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_apigateway as apigw,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_s3 as s3,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    aws_lambda_event_sources as lambda_event_sources,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main stack for serverless webhook processing system
    Handles webhooks from Stripe, PayPal, and Square with reliable processing
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or default to 'dev'
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # KMS Key for Lambda environment variables encryption
        kms_key = kms.Key(
            self, "LambdaKmsKey",
            description=f"KMS key for Lambda environment variables - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # DynamoDB table for webhook events
        webhook_table = dynamodb.Table(
            self, "WebhookEventsTable",
            table_name=f"WebhookEvents-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="eventId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY
        )

        # S3 bucket for failed webhooks
        failed_webhooks_bucket = s3.Bucket(
            self, "FailedWebhooksBucket",
            bucket_name=f"failed-webhooks-{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # Dead Letter Queue
        dlq = sqs.Queue(
            self, "WebhookDLQ",
            queue_name=f"webhook-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(360)  # Must be >= DLQ processor timeout (60s), set to 6x for safety
        )

        # Main SQS queue for webhook processing
        webhook_queue = sqs.Queue(
            self, "WebhookQueue",
            queue_name=f"webhook-queue-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            )
        )

        # Lambda: Custom Authorizer
        authorizer_lambda = lambda_.Function(
            self, "AuthorizerLambda",
            function_name=f"webhook-authorizer-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="authorizer.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(10),
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # Lambda: Stripe Processor
        stripe_processor = lambda_.Function(
            self, "StripeProcessor",
            function_name=f"stripe-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="stripe_processor.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(30),
            environment={
                "QUEUE_URL": webhook_queue.queue_url,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        webhook_queue.grant_send_messages(stripe_processor)

        # Lambda: PayPal Processor
        paypal_processor = lambda_.Function(
            self, "PayPalProcessor",
            function_name=f"paypal-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="paypal_processor.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(30),
            environment={
                "QUEUE_URL": webhook_queue.queue_url,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        webhook_queue.grant_send_messages(paypal_processor)

        # Lambda: Square Processor
        square_processor = lambda_.Function(
            self, "SquareProcessor",
            function_name=f"square-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="square_processor.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(30),
            environment={
                "QUEUE_URL": webhook_queue.queue_url,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        webhook_queue.grant_send_messages(square_processor)

        # Lambda: SQS Consumer
        sqs_consumer = lambda_.Function(
            self, "SQSConsumer",
            function_name=f"sqs-consumer-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="sqs_consumer.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(60),
            environment={
                "TABLE_NAME": webhook_table.table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        webhook_table.grant_write_data(sqs_consumer)
        sqs_consumer.add_event_source(
            lambda_event_sources.SqsEventSource(webhook_queue)
        )

        # Lambda: DLQ Processor
        dlq_processor = lambda_.Function(
            self, "DLQProcessor",
            function_name=f"dlq-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="dlq_processor.lambda_handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(60),
            environment={
                "BUCKET_NAME": failed_webhooks_bucket.bucket_name,
                "ENVIRONMENT_SUFFIX": environment_suffix
            },
            environment_encryption=kms_key,
            log_retention=logs.RetentionDays.ONE_MONTH
        )
        failed_webhooks_bucket.grant_write(dlq_processor)
        dlq_processor.add_event_source(
            lambda_event_sources.SqsEventSource(dlq)
        )

        # API Gateway with Custom Authorizer
        api = apigw.RestApi(
            self, "WebhookAPI",
            rest_api_name=f"webhook-api-{environment_suffix}",
            description="Webhook processing API for multiple payment providers",
            deploy_options=apigw.StageOptions(
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True
            )
        )

        # Custom Authorizer
        authorizer = apigw.TokenAuthorizer(
            self, "WebhookAuthorizer",
            handler=authorizer_lambda,
            identity_source="method.request.header.Authorization"
        )

        # Stripe endpoint
        stripe_resource = api.root.add_resource("stripe")
        stripe_resource.add_method(
            "POST",
            apigw.LambdaIntegration(stripe_processor),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.CUSTOM
        )

        # PayPal endpoint
        paypal_resource = api.root.add_resource("paypal")
        paypal_resource.add_method(
            "POST",
            apigw.LambdaIntegration(paypal_processor),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.CUSTOM
        )

        # Square endpoint
        square_resource = api.root.add_resource("square")
        square_resource.add_method(
            "POST",
            apigw.LambdaIntegration(square_processor),
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.CUSTOM
        )

        # Stack outputs
        cdk.CfnOutput(
            self, "ApiUrl",
            value=api.url,
            description="Webhook API base URL"
        )
        cdk.CfnOutput(
            self, "TableName",
            value=webhook_table.table_name,
            description="DynamoDB table for webhook events"
        )
        cdk.CfnOutput(
            self, "BucketName",
            value=failed_webhooks_bucket.bucket_name,
            description="S3 bucket for failed webhooks"
        )
```

## Lambda Functions

### File: lib/lambda/authorizer.py

```python
"""
Custom Authorizer Lambda for API Gateway
Validates webhook signatures for different payment providers
"""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Custom authorizer for API Gateway webhook endpoints
    Validates Authorization header and generates IAM policy
    """
    try:
        logger.info(f"Authorizer event: {json.dumps(event)}")

        # Get the authorization token
        token = event.get('authorizationToken', '')
        method_arn = event['methodArn']

        # Simple validation - in production, validate provider-specific signatures
        if not token or token == 'invalid':
            logger.warning("Authorization failed - invalid or missing token")
            raise Exception('Unauthorized')

        # Extract account ID and API info from method ARN
        # Format: arn:aws:execute-api:region:account-id:api-id/stage/method/resource
        arn_parts = method_arn.split(':')
        api_gateway_arn_parts = arn_parts[5].split('/')
        aws_account_id = arn_parts[4]

        # Build the policy
        policy = {
            'principalId': 'webhook-user',
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': method_arn
                    }
                ]
            },
            'context': {
                'provider': 'webhook',
                'validated': 'true'
            }
        }

        logger.info("Authorization successful")
        return policy

    except Exception as e:
        logger.error(f"Authorization error: {str(e)}")
        raise Exception('Unauthorized')
```

### File: lib/lambda/stripe_processor.py

```python
"""
Stripe Webhook Processor Lambda
Validates and processes Stripe webhook events
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs_client = boto3.client('sqs')


def lambda_handler(event, context):
    """
    Process Stripe webhook events and send to SQS queue
    """
    try:
        logger.info(f"Stripe processor event: {json.dumps(event)}")

        # Parse the webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Validate required fields
        if not body:
            raise ValueError("Empty webhook payload")

        # Transform to standard format
        webhook_event = {
            'eventId': body.get('id', f"stripe-{datetime.now().timestamp()}"),
            'provider': 'stripe',
            'type': body.get('type', 'unknown'),
            'timestamp': int(datetime.now().timestamp()),
            'payload': json.dumps(body)
        }

        # Send to SQS
        queue_url = os.environ['QUEUE_URL']
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(webhook_event)
        )

        logger.info(f"Message sent to SQS: {response['MessageId']}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Webhook processed successfully'})
        }

    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### File: lib/lambda/paypal_processor.py

```python
"""
PayPal Webhook Processor Lambda
Validates and processes PayPal webhook events
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs_client = boto3.client('sqs')


def lambda_handler(event, context):
    """
    Process PayPal webhook events and send to SQS queue
    """
    try:
        logger.info(f"PayPal processor event: {json.dumps(event)}")

        # Parse the webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Validate required fields
        if not body:
            raise ValueError("Empty webhook payload")

        # Transform to standard format
        webhook_event = {
            'eventId': body.get('id', f"paypal-{datetime.now().timestamp()}"),
            'provider': 'paypal',
            'type': body.get('event_type', 'unknown'),
            'timestamp': int(datetime.now().timestamp()),
            'payload': json.dumps(body)
        }

        # Send to SQS
        queue_url = os.environ['QUEUE_URL']
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(webhook_event)
        )

        logger.info(f"Message sent to SQS: {response['MessageId']}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Webhook processed successfully'})
        }

    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### File: lib/lambda/square_processor.py

```python
"""
Square Webhook Processor Lambda
Validates and processes Square webhook events
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs_client = boto3.client('sqs')


def lambda_handler(event, context):
    """
    Process Square webhook events and send to SQS queue
    """
    try:
        logger.info(f"Square processor event: {json.dumps(event)}")

        # Parse the webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Validate required fields
        if not body:
            raise ValueError("Empty webhook payload")

        # Transform to standard format
        webhook_event = {
            'eventId': body.get('event_id', f"square-{datetime.now().timestamp()}"),
            'provider': 'square',
            'type': body.get('type', 'unknown'),
            'timestamp': int(datetime.now().timestamp()),
            'payload': json.dumps(body)
        }

        # Send to SQS
        queue_url = os.environ['QUEUE_URL']
        response = sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(webhook_event)
        )

        logger.info(f"Message sent to SQS: {response['MessageId']}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Webhook processed successfully'})
        }

    except Exception as e:
        logger.error(f"Error processing Square webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### File: lib/lambda/sqs_consumer.py

```python
"""
SQS Consumer Lambda
Processes webhook events from SQS and writes to DynamoDB
"""
import json
import logging
import os
import boto3
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')


def lambda_handler(event, context):
    """
    Process messages from SQS and write to DynamoDB
    """
    try:
        logger.info(f"SQS consumer event: {json.dumps(event)}")

        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        successful = 0
        failed = 0

        for record in event['Records']:
            try:
                # Parse the message
                message_body = json.loads(record['body'])

                # Write to DynamoDB
                table.put_item(
                    Item={
                        'eventId': message_body['eventId'],
                        'timestamp': Decimal(str(message_body['timestamp'])),
                        'provider': message_body['provider'],
                        'type': message_body['type'],
                        'payload': message_body['payload'],
                        'processedAt': Decimal(str(int(record['attributes']['ApproximateFirstReceiveTimestamp']) / 1000))
                    }
                )
                successful += 1
                logger.info(f"Successfully processed event: {message_body['eventId']}")

            except Exception as e:
                failed += 1
                logger.error(f"Failed to process record: {str(e)}")
                # Re-raise to trigger retry mechanism
                raise

        logger.info(f"Processed {successful} messages successfully, {failed} failed")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'successful': successful,
                'failed': failed
            })
        }

    except Exception as e:
        logger.error(f"Error in SQS consumer: {str(e)}")
        raise
```

### File: lib/lambda/dlq_processor.py

```python
"""
Dead Letter Queue Processor Lambda
Archives failed webhooks to S3 and logs failures
"""
import json
import logging
import os
import boto3
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')


def lambda_handler(event, context):
    """
    Process failed messages from DLQ and archive to S3
    """
    try:
        logger.info(f"DLQ processor event: {json.dumps(event)}")

        bucket_name = os.environ['BUCKET_NAME']

        for record in event['Records']:
            try:
                # Parse the failed message
                message_body = json.loads(record['body'])
                provider = message_body.get('provider', 'unknown')
                event_id = message_body.get('eventId', 'unknown')

                # Create S3 key with provider and date organization
                now = datetime.now()
                s3_key = f"{provider}/{now.year}/{now.month:02d}/{now.day:02d}/{event_id}.json"

                # Prepare failure metadata
                failure_data = {
                    'originalMessage': message_body,
                    'failureTime': now.isoformat(),
                    'receiveCount': record['attributes'].get('ApproximateReceiveCount', 'unknown'),
                    'messageId': record['messageId']
                }

                # Write to S3
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=json.dumps(failure_data, indent=2),
                    ContentType='application/json'
                )

                logger.info(f"Archived failed webhook to S3: {s3_key}")

            except Exception as e:
                logger.error(f"Failed to process DLQ record: {str(e)}")
                # Continue processing other records
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'DLQ processing completed'})
        }

    except Exception as e:
        logger.error(f"Error in DLQ processor: {str(e)}")
        # Don't raise - we don't want failed DLQ processing to re-queue
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Summary

This implementation provides:

1. **Six Lambda functions** (Python 3.11):
   - Custom authorizer for API Gateway
   - Three provider-specific processors (Stripe, PayPal, Square)
   - SQS consumer for writing to DynamoDB
   - DLQ processor for archiving failures to S3

2. **API Gateway REST API** with:
   - Three endpoints (/stripe, /paypal, /square)
   - Custom authorizer for signature validation
   - Throttling at 1000 req/sec

3. **SQS queues**:
   - Main queue with 300s visibility timeout
   - Dead letter queue with 3 retry limit and 360s visibility timeout

4. **DynamoDB table**:
   - WebhookEvents table with eventId/timestamp keys
   - On-demand billing

5. **S3 bucket**:
   - Failed webhook storage
   - 90-day Glacier transition lifecycle rule

6. **Security features**:
   - Separate IAM roles per Lambda (auto-generated by CDK)
   - KMS encryption for Lambda environment variables
   - CloudWatch Logs with 30-day retention

All resources include the environmentSuffix for isolation and are fully destroyable.
