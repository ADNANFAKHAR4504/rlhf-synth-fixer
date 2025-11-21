"""Payment Webhook Processing Stack"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import Duration, RemovalPolicy, Stack
from aws_cdk import aws_apigateway as apigw
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cw_actions
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_lambda_event_sources as lambda_event_sources
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sqs as sqs
from aws_cdk import aws_wafv2 as wafv2
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

        # Create KMS Key for encryption with proper policy
        kms_key = kms.Key(
            self, "EncryptionKey",
            description=f"Encryption key for payment webhook system-{environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Grant necessary permissions to services
        kms_key.grant_encrypt_decrypt(iam.ServicePrincipal("dynamodb.amazonaws.com"))
        kms_key.grant_encrypt_decrypt(iam.ServicePrincipal("sqs.amazonaws.com"))
        kms_key.grant_encrypt_decrypt(iam.ServicePrincipal("sns.amazonaws.com"))
        kms_key.grant_encrypt_decrypt(iam.ServicePrincipal("lambda.amazonaws.com"))

        # Create DynamoDB Table with environmentSuffix
        webhooks_table = dynamodb.Table(
            self, "WebhooksTable",
            table_name=f"PaymentWebhooks-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="webhookId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Dead Letter Queue with environmentSuffix
        dlq = sqs.Queue(
            self, "WebhookDLQ",
            queue_name=f"webhook-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=kms_key,
        )

        # Create SNS Topic for alerts with environmentSuffix
        alert_topic = sns.Topic(
            self, "AlertTopic",
            topic_name=f"webhook-alerts-{environment_suffix}",
            display_name="Payment Webhook Alerts",
            master_key=kms_key,
        )

        # Create Processing Queue for async webhook processing
        processing_queue = sqs.Queue(
            self, "ProcessingQueue",
            queue_name=f"webhook-processing-{environment_suffix}",
            visibility_timeout=Duration.minutes(6),  # Longer than processor timeout
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=kms_key,
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            ),
        )

        # Create Webhook Receiver Lambda with reduced concurrency
        # Note: Lambda will automatically create CloudWatch log groups on first invocation
        webhook_receiver = lambda_.Function(
            self, "WebhookReceiver",
            function_name=f"webhook-receiver-{environment_suffix}-lo",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="receiver.handler",
            code=lambda_.Code.from_asset("lib/lambda/receiver"),
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=10,  # Reduced from 100 to avoid account limits
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
                "QUEUE_URL": processing_queue.queue_url,
            },
        )

        # Grant permissions
        webhooks_table.grant_write_data(webhook_receiver)
        processing_queue.grant_send_messages(webhook_receiver)
        kms_key.grant_encrypt_decrypt(webhook_receiver)

        # Create Payment Processor Lambda with DLQ
        # Note: Lambda will automatically create CloudWatch log groups on first invocation
        payment_processor = lambda_.Function(
            self, "PaymentProcessor",
            function_name=f"payment-processor-{environment_suffix}-lo",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="processor.handler",
            code=lambda_.Code.from_asset("lib/lambda/processor"),
            timeout=Duration.minutes(5),
            reserved_concurrent_executions=5,  # Reduced from 50
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": webhooks_table.table_name,
            },
            dead_letter_queue=dlq,
        )

        # Add SQS as event source for payment processor
        payment_processor.add_event_source(
            lambda_event_sources.SqsEventSource(
                processing_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(5),
            )
        )

        webhooks_table.grant_read_write_data(payment_processor)
        kms_key.grant_encrypt_decrypt(payment_processor)

        # Create Audit Logger Lambda with X-Ray tracing
        # Note: Lambda will automatically create CloudWatch log groups on first invocation
        audit_logger = lambda_.Function(
            self, "AuditLogger",
            function_name=f"audit-logger-{environment_suffix}-lo",
            runtime=lambda_.Runtime.PYTHON_3_11,
            architecture=lambda_.Architecture.ARM_64,
            handler="audit.handler",
            code=lambda_.Code.from_asset("lib/lambda/audit"),
            timeout=Duration.seconds(60),
            tracing=lambda_.Tracing.ACTIVE,
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

        # Create API Gateway with throttling
        api = apigw.RestApi(
            self, "WebhookAPI",
            rest_api_name=f"webhook-api-{environment_suffix}",
            description="Payment Webhook Processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                tracing_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
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

        # Create WAF Web ACL with rate limiting
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
                wafv2.CfnWebACL.RuleProperty(
                    name="RateLimitRule",
                    priority=1,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=600,  # 10 requests per second (600 per 5 minutes)
                            aggregate_key_type="IP"
                        )
                    ),
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block={}
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        sampled_requests_enabled=True,
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"RateLimitRule-{environment_suffix}"
                    )
                )
            ],
        )

        # Associate WAF with API Gateway
        wafv2.CfnWebACLAssociation(
            self, "WAFAssociation",
            resource_arn=api.deployment_stage.stage_arn,
            web_acl_arn=web_acl.attr_arn,
        )

        # Create CloudWatch Alarm for DLQ
        dlq_alarm = cloudwatch.Alarm(
            self, "DLQAlarm",
            alarm_name=f"webhook-dlq-alarm-{environment_suffix}",
            alarm_description="Triggers when messages appear in DLQ",
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
            export_name=f"WebhookAPIEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self, "TableName",
            value=webhooks_table.table_name,
            description="DynamoDB table name",
            export_name=f"WebhooksTableName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self, "DLQUrl",
            value=dlq.queue_url,
            description="Dead letter queue URL",
            export_name=f"WebhookDLQUrl-{environment_suffix}",
        )

        cdk.CfnOutput(
            self, "ProcessingQueueUrl",
            value=processing_queue.queue_url,
            description="Processing queue URL",
            export_name=f"ProcessingQueueUrl-{environment_suffix}",
        )

        cdk.CfnOutput(
            self, "AlertTopicArn",
            value=alert_topic.topic_arn,
            description="SNS alert topic ARN",
            export_name=f"AlertTopicArn-{environment_suffix}",
        )
