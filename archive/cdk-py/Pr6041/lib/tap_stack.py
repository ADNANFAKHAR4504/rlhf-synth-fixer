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
