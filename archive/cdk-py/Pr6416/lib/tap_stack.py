from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_kms as kms,
    CfnOutput,
)
from constructs import Construct
import os

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Customer-managed KMS key for encryption
        encryption_key = kms.Key(
            self, f"webhook-encryption-key-{environment_suffix}",
            description="KMS key for webhook processing encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Lambda Layer for shared dependencies
        shared_layer = _lambda.LayerVersion(
            self, f"shared-dependencies-layer-{environment_suffix}",
            code=_lambda.Code.from_asset("lib/lambda/layers/shared"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_11],
            compatible_architectures=[_lambda.Architecture.ARM_64],
            description="Shared boto3 and cryptography libraries",
        )

        # DynamoDB table with on-demand billing and streams
        webhooks_table = dynamodb.Table(
            self, f"payment-webhooks-table-{environment_suffix}",
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
            encryption_key=encryption_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Dead Letter Queue for failed webhook processing
        webhook_dlq = sqs.Queue(
            self, f"webhook-dlq-{environment_suffix}",
            queue_name=f"webhook-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=encryption_key,
        )

        # SNS Topic for critical alerts
        alert_topic = sns.Topic(
            self, f"webhook-alerts-{environment_suffix}",
            topic_name=f"webhook-alerts-{environment_suffix}",
            master_key=encryption_key,
        )

        # Create CloudWatch alarm for DLQ messages
        webhook_dlq.metric_approximate_number_of_messages_visible().create_alarm(
            self, f"webhook-dlq-alarm-{environment_suffix}",
            threshold=1,
            evaluation_periods=1,
        )

        # Webhook Receiver Lambda
        webhook_receiver = _lambda.Function(
            self, f"webhook-receiver-{environment_suffix}",
            function_name=f"webhook-receiver-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/webhook_receiver"),
            handler="index.handler",
            timeout=Duration.seconds(30),
            environment={
                "TABLE_NAME": webhooks_table.table_name,
                "PROCESSOR_QUEUE": "processor-queue",
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
        )

        # Grant permissions
        webhooks_table.grant_write_data(webhook_receiver)
        encryption_key.grant_encrypt_decrypt(webhook_receiver)

        # Payment Processor Lambda
        processor_dlq = sqs.Queue(
            self, f"processor-dlq-{environment_suffix}",
            queue_name=f"processor-dlq-{environment_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=encryption_key,
        )

        payment_processor = _lambda.Function(
            self, f"payment-processor-{environment_suffix}",
            function_name=f"payment-processor-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/payment_processor"),
            handler="index.handler",
            timeout=Duration.minutes(5),
            environment={
                "TABLE_NAME": webhooks_table.table_name,
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
            dead_letter_queue=webhook_dlq,
        )

        # Grant permissions
        webhooks_table.grant_read_write_data(payment_processor)
        encryption_key.grant_encrypt_decrypt(payment_processor)
        webhook_dlq.grant_send_messages(payment_processor)

        # Audit Logger Lambda (triggered by DynamoDB Streams)
        audit_logger = _lambda.Function(
            self, f"audit-logger-{environment_suffix}",
            function_name=f"audit-logger-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            architecture=_lambda.Architecture.ARM_64,
            code=_lambda.Code.from_asset("lib/lambda/audit_logger"),
            handler="index.handler",
            timeout=Duration.seconds(60),
            environment={
                "ALERT_TOPIC_ARN": alert_topic.topic_arn,
            },
            environment_encryption=encryption_key,
            tracing=_lambda.Tracing.ACTIVE,
            layers=[shared_layer],
        )

        # Add DynamoDB Stream as event source
        from aws_cdk import aws_lambda_event_sources as event_sources
        audit_logger.add_event_source(
            event_sources.DynamoEventSource(
                webhooks_table,
                starting_position=_lambda.StartingPosition.LATEST,
                batch_size=100,
                retry_attempts=3,
            )
        )

        # Grant permissions
        webhooks_table.grant_stream_read(audit_logger)
        alert_topic.grant_publish(audit_logger)
        encryption_key.grant_encrypt_decrypt(audit_logger)

        # API Gateway REST API
        api = apigw.RestApi(
            self, f"webhook-api-{environment_suffix}",
            rest_api_name=f"webhook-api-{environment_suffix}",
            description="Payment webhook processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                tracing_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
            ),
        )

        # Add /webhook resource
        webhook_resource = api.root.add_resource("webhook")

        # Add {provider} path parameter
        provider_resource = webhook_resource.add_resource("{provider}")

        # Add POST method with Lambda integration
        webhook_integration = apigw.LambdaIntegration(
            webhook_receiver,
            proxy=True,
        )

        provider_resource.add_method(
            "POST",
            webhook_integration,
            method_responses=[
                apigw.MethodResponse(status_code="200"),
                apigw.MethodResponse(status_code="400"),
                apigw.MethodResponse(status_code="500"),
            ],
        )

        # WAF Web ACL for rate limiting
        from aws_cdk import aws_wafv2 as wafv2

        web_acl = wafv2.CfnWebACL(
            self, f"webhook-waf-{environment_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"webhook-waf-{environment_suffix}",
                sampled_requests_enabled=True,
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name=f"rate-limit-rule-{environment_suffix}",
                    priority=1,
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block={}
                    ),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=10,
                            aggregate_key_type="IP",
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name=f"rate-limit-{environment_suffix}",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
        )

        # Associate WAF with API Gateway
        waf_association = wafv2.CfnWebACLAssociation(
            self, f"waf-api-association-{environment_suffix}",
            resource_arn=f"arn:aws:apigateway:{self.region}::/restapis/{api.rest_api_id}/stages/prod",
            web_acl_arn=web_acl.attr_arn,
        )
        # Ensure the stage is deployed before associating WAF
        waf_association.node.add_dependency(api.deployment_stage)

        # Outputs
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self, "WebhooksTableName",
            value=webhooks_table.table_name,
            description="DynamoDB table name",
        )

        CfnOutput(
            self, "DLQUrl",
            value=webhook_dlq.queue_url,
            description="Dead Letter Queue URL",
        )
