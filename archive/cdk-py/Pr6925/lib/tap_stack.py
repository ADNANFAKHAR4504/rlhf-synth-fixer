"""tap_stack.py - Serverless Transaction Validation Pipeline Infrastructure"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    CfnOutput,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_s3 as s3,
    aws_events as events,
    aws_events_targets as targets,
    aws_apigateway as apigw,
    aws_sns as sns,
    aws_logs as logs,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK Stack for Serverless Transaction Validation Pipeline

    Implements all 12 mandatory requirements:
    1. Three Lambda functions (ingestion, validation, enrichment) with 512MB memory
    2. DynamoDB table with GSI and on-demand billing
    3. Step Functions state machine with exponential backoff retry
    4. SQS queues between stages with 300s visibility timeout
    5. Lambda Dead Letter Queues with maxReceiveCount=3
    6. X-Ray tracing across all Lambda and Step Functions
    7. CloudWatch Logs with 14-day retention
    8. Custom CloudWatch metrics for processing rates and errors
    9. RemovalPolicy.DESTROY on all resources
    10. EventBridge rule to trigger pipeline on S3 uploads
    11. API Gateway REST endpoint for manual transaction submission
    12. SNS topic for failure notifications
    """

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

        # ========================================
        # 1. S3 Bucket for Transaction Uploads
        # ========================================
        transaction_bucket = s3.Bucket(
            self,
            "TransactionBucket",
            bucket_name=f"transaction-uploads-{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # ========================================
        # 2. DynamoDB Table with GSI
        # ========================================
        # Requirement 2: DynamoDB table with on-demand billing and GSI
        transaction_table = dynamodb.Table(
            self,
            "TransactionTable",
            table_name=f"transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transactionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        )

        # GSI for status queries
        transaction_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # ========================================
        # 3. SNS Topic for Failure Notifications
        # ========================================
        # Requirement 12: SNS topic for failure notifications
        failure_topic = sns.Topic(
            self,
            "FailureTopic",
            topic_name=f"transaction-failures-{environment_suffix}",
            display_name="Transaction Pipeline Failure Notifications",
        )

        # Enable encryption
        failure_topic.apply_removal_policy(RemovalPolicy.DESTROY)

        # ========================================
        # 4. Dead Letter Queues for Lambda Functions
        # ========================================
        # Requirement 5: Lambda Dead Letter Queues with maxReceiveCount=3
        ingestion_dlq = sqs.Queue(
            self,
            "IngestionDLQ",
            queue_name=f"transaction-ingestion-dlq-{environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14),
        )

        validation_dlq = sqs.Queue(
            self,
            "ValidationDLQ",
            queue_name=f"transaction-validation-dlq-{environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14),
        )

        enrichment_dlq = sqs.Queue(
            self,
            "EnrichmentDLQ",
            queue_name=f"transaction-enrichment-dlq-{environment_suffix}",
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            retention_period=Duration.days(14),
        )

        # ========================================
        # 5. SQS Queues Between Processing Stages
        # ========================================
        # Requirement 4: SQS queues with 300s visibility timeout
        ingestion_to_validation_queue = sqs.Queue(
            self,
            "IngestionToValidationQueue",
            queue_name=f"ingestion-to-validation-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=validation_dlq
            )
        )

        validation_to_enrichment_queue = sqs.Queue(
            self,
            "ValidationToEnrichmentQueue",
            queue_name=f"validation-to-enrichment-{environment_suffix}",
            visibility_timeout=Duration.seconds(300),
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=enrichment_dlq
            )
        )

        # ========================================
        # 6. CloudWatch Log Groups
        # ========================================
        # Requirement 7: CloudWatch Logs with 14-day retention
        ingestion_log_group = logs.LogGroup(
            self,
            "IngestionLogGroup",
            log_group_name=f"/aws/lambda/transaction-ingestion-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        validation_log_group = logs.LogGroup(
            self,
            "ValidationLogGroup",
            log_group_name=f"/aws/lambda/transaction-validation-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        enrichment_log_group = logs.LogGroup(
            self,
            "EnrichmentLogGroup",
            log_group_name=f"/aws/lambda/transaction-enrichment-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ========================================
        # 7. Lambda Functions
        # ========================================
        # Requirement 1: Three Lambda functions (512MB memory each)
        # Requirement 6: X-Ray tracing enabled

        # Common Lambda environment variables
        common_env = {
            "DYNAMODB_TABLE_NAME": transaction_table.table_name,
            "ENVIRONMENT_SUFFIX": environment_suffix,
            "SNS_TOPIC_ARN": failure_topic.topic_arn,
        }

        # Ingestion Lambda
        ingestion_function = lambda_.Function(
            self,
            "IngestionFunction",
            function_name=f"transaction-ingestion-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="ingestion.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            memory_size=512,
            timeout=Duration.seconds(60),
            environment={
                **common_env,
                "OUTPUT_QUEUE_URL": ingestion_to_validation_queue.queue_url,
            },
            tracing=lambda_.Tracing.ACTIVE,
            dead_letter_queue=ingestion_dlq,
            log_group=ingestion_log_group,
        )

        # Validation Lambda
        validation_function = lambda_.Function(
            self,
            "ValidationFunction",
            function_name=f"transaction-validation-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            memory_size=512,
            timeout=Duration.seconds(60),
            environment={
                **common_env,
                "OUTPUT_QUEUE_URL": validation_to_enrichment_queue.queue_url,
            },
            tracing=lambda_.Tracing.ACTIVE,
            dead_letter_queue=validation_dlq,
            log_group=validation_log_group,
        )

        # Enrichment Lambda
        enrichment_function = lambda_.Function(
            self,
            "EnrichmentFunction",
            function_name=f"transaction-enrichment-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="enrichment.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            memory_size=512,
            timeout=Duration.seconds(60),
            environment=common_env,
            tracing=lambda_.Tracing.ACTIVE,
            dead_letter_queue=enrichment_dlq,
            log_group=enrichment_log_group,
        )

        # ========================================
        # 8. IAM Permissions (Least Privilege)
        # ========================================
        # Grant DynamoDB permissions
        transaction_table.grant_read_write_data(ingestion_function)
        transaction_table.grant_read_write_data(validation_function)
        transaction_table.grant_read_write_data(enrichment_function)

        # Grant SQS permissions
        ingestion_to_validation_queue.grant_send_messages(ingestion_function)
        validation_to_enrichment_queue.grant_send_messages(validation_function)

        ingestion_to_validation_queue.grant_consume_messages(validation_function)
        validation_to_enrichment_queue.grant_consume_messages(enrichment_function)

        # Grant SNS permissions
        failure_topic.grant_publish(ingestion_function)
        failure_topic.grant_publish(validation_function)
        failure_topic.grant_publish(enrichment_function)

        # Grant S3 permissions
        transaction_bucket.grant_read(ingestion_function)

        # Grant CloudWatch Metrics permissions
        for function in [ingestion_function, validation_function, enrichment_function]:
            function.add_to_role_policy(
                iam.PolicyStatement(
                    actions=[
                        "cloudwatch:PutMetricData",
                    ],
                    resources=["*"],
                    conditions={
                        "StringEquals": {
                            "cloudwatch:namespace": f"TransactionPipeline/{environment_suffix}"
                        }
                    }
                )
            )

        # ========================================
        # 9. Step Functions State Machine
        # ========================================
        # Requirement 3: Step Functions with exponential backoff retry

        # Define tasks
        ingestion_task = tasks.LambdaInvoke(
            self,
            "IngestionTask",
            lambda_function=ingestion_function,
            payload=sfn.TaskInput.from_object({
                "transactionId.$": "$.transactionId",
                "data.$": "$.data",
                "source.$": "$.source"
            }),
            result_path="$.ingestionResult",
            retry_on_service_exceptions=True,
        )

        validation_task = tasks.LambdaInvoke(
            self,
            "ValidationTask",
            lambda_function=validation_function,
            payload=sfn.TaskInput.from_object({
                "transactionId.$": "$.transactionId",
                "ingestionResult.$": "$.ingestionResult.Payload"
            }),
            result_path="$.validationResult",
            retry_on_service_exceptions=True,
        )

        enrichment_task = tasks.LambdaInvoke(
            self,
            "EnrichmentTask",
            lambda_function=enrichment_function,
            payload=sfn.TaskInput.from_object({
                "transactionId.$": "$.transactionId",
                "validationResult.$": "$.validationResult.Payload"
            }),
            result_path="$.enrichmentResult",
            retry_on_service_exceptions=True,
        )

        # Success state
        success_state = sfn.Succeed(self, "ProcessingComplete")

        # Failure state with SNS notification
        failure_notification = tasks.SnsPublish(
            self,
            "PublishFailure",
            topic=failure_topic,
            message=sfn.TaskInput.from_object({
                "transactionId.$": "$.transactionId",
                "error.$": "$.error",
                "cause.$": "$.cause",
                "timestamp.$": "$$.State.EnteredTime"
            }),
            result_path="$.notificationResult"
        )

        failure_state = sfn.Fail(
            self,
            "ProcessingFailed",
            cause="Transaction processing failed",
            error="ProcessingError"
        )

        # Chain tasks with error handling
        definition = ingestion_task.add_retry(
            errors=["States.ALL"],
            interval=Duration.seconds(2),
            max_attempts=3,
            backoff_rate=2.0  # Exponential backoff
        ).add_catch(
            failure_notification,
            result_path="$.error"
        ).next(
            validation_task.add_retry(
                errors=["States.ALL"],
                interval=Duration.seconds(2),
                max_attempts=3,
                backoff_rate=2.0
            ).add_catch(
                failure_notification,
                result_path="$.error"
            )
        ).next(
            enrichment_task.add_retry(
                errors=["States.ALL"],
                interval=Duration.seconds(2),
                max_attempts=3,
                backoff_rate=2.0
            ).add_catch(
                failure_notification,
                result_path="$.error"
            )
        ).next(success_state)

        failure_notification.next(failure_state)

        # Create state machine log group
        state_machine_log_group = logs.LogGroup(
            self,
            "StateMachineLogGroup",
            log_group_name=f"/aws/vendedlogs/states/transaction-pipeline-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create state machine
        state_machine = sfn.StateMachine(
            self,
            "TransactionPipeline",
            state_machine_name=f"transaction-pipeline-{environment_suffix}",
            definition=definition,
            tracing_enabled=True,
            logs=sfn.LogOptions(
                destination=state_machine_log_group,
                level=sfn.LogLevel.ALL,
            ),
        )

        # ========================================
        # 10. EventBridge Rule for S3 Triggers
        # ========================================
        # Requirement 10: EventBridge rule to trigger pipeline on S3 uploads
        s3_upload_rule = events.Rule(
            self,
            "S3UploadRule",
            rule_name=f"transaction-s3-upload-{environment_suffix}",
            description="Trigger transaction pipeline on S3 uploads",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={
                    "bucket": {
                        "name": [transaction_bucket.bucket_name]
                    }
                }
            ),
        )

        # Add state machine as target
        s3_upload_rule.add_target(
            targets.SfnStateMachine(
                state_machine,
                input=events.RuleTargetInput.from_object({
                    "transactionId": events.EventField.from_path("$.detail.object.key"),
                    "source": "s3",
                    "bucket": events.EventField.from_path("$.detail.bucket.name"),
                    "key": events.EventField.from_path("$.detail.object.key"),
                    "data": {
                        "eventTime": events.EventField.from_path("$.time")
                    }
                })
            )
        )

        # Enable EventBridge notifications on bucket
        transaction_bucket.enable_event_bridge_notification()

        # ========================================
        # 11. API Gateway REST Endpoint
        # ========================================
        # Requirement 11: API Gateway REST endpoint for manual submission

        # Create REST API
        api = apigw.RestApi(
            self,
            "TransactionApi",
            rest_api_name=f"transaction-api-{environment_suffix}",
            description="REST API for manual transaction submission",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
            ),
        )

        # Create Step Functions integration role
        api_role = iam.Role(
            self,
            "ApiStepFunctionsRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            description="Role for API Gateway to invoke Step Functions",
        )

        state_machine.grant_start_execution(api_role)

        # Create /transactions resource
        transactions_resource = api.root.add_resource("transactions")

        # Add POST method with Step Functions integration
        transactions_resource.add_method(
            "POST",
            apigw.AwsIntegration(
                service="states",
                action="StartExecution",
                integration_http_method="POST",
                options=apigw.IntegrationOptions(
                    credentials_role=api_role,
                    request_templates={
                        "application/json": json.dumps({
                            "input": "$util.escapeJavaScript($input.json('$'))",
                            "stateMachineArn": state_machine.state_machine_arn
                        })
                    },
                    integration_responses=[
                        apigw.IntegrationResponse(
                            status_code="200",
                            response_templates={
                                "application/json": json.dumps({
                                    "executionArn": "$input.path('$.executionArn')",
                                    "startDate": "$input.path('$.startDate')"
                                })
                            }
                        ),
                        apigw.IntegrationResponse(
                            status_code="400",
                            selection_pattern="4\\d{2}",
                        ),
                        apigw.IntegrationResponse(
                            status_code="500",
                            selection_pattern="5\\d{2}",
                        ),
                    ]
                )
            ),
            method_responses=[
                apigw.MethodResponse(status_code="200"),
                apigw.MethodResponse(status_code="400"),
                apigw.MethodResponse(status_code="500"),
            ]
        )

        # ========================================
        # 12. CloudWatch Custom Metrics and Alarms
        # ========================================
        # Requirement 8: Custom CloudWatch metrics

        # Metric namespace
        metric_namespace = f"TransactionPipeline/{environment_suffix}"

        # Create custom metrics (defined in Lambda functions)
        processing_rate_metric = cloudwatch.Metric(
            namespace=metric_namespace,
            metric_name="ProcessingRate",
            statistic="Sum",
            period=Duration.minutes(5),
        )

        error_count_metric = cloudwatch.Metric(
            namespace=metric_namespace,
            metric_name="ErrorCount",
            statistic="Sum",
            period=Duration.minutes(5),
        )

        # Create alarms
        high_error_alarm = cloudwatch.Alarm(
            self,
            "HighErrorAlarm",
            alarm_name=f"transaction-high-errors-{environment_suffix}",
            metric=error_count_metric,
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        high_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(failure_topic)
        )

        # ========================================
        # 13. CloudFormation Outputs
        # ========================================
        CfnOutput(
            self,
            "TransactionBucketName",
            value=transaction_bucket.bucket_name,
            description="S3 bucket for transaction uploads",
            export_name=f"transaction-bucket-{environment_suffix}"
        )

        CfnOutput(
            self,
            "TransactionTableName",
            value=transaction_table.table_name,
            description="DynamoDB table for transaction state",
            export_name=f"transaction-table-{environment_suffix}"
        )

        CfnOutput(
            self,
            "IngestionFunctionArn",
            value=ingestion_function.function_arn,
            description="ARN of ingestion Lambda function",
            export_name=f"ingestion-function-arn-{environment_suffix}"
        )

        CfnOutput(
            self,
            "ValidationFunctionArn",
            value=validation_function.function_arn,
            description="ARN of validation Lambda function",
            export_name=f"validation-function-arn-{environment_suffix}"
        )

        CfnOutput(
            self,
            "EnrichmentFunctionArn",
            value=enrichment_function.function_arn,
            description="ARN of enrichment Lambda function",
            export_name=f"enrichment-function-arn-{environment_suffix}"
        )

        CfnOutput(
            self,
            "StateMachineArn",
            value=state_machine.state_machine_arn,
            description="ARN of Step Functions state machine",
            export_name=f"state-machine-arn-{environment_suffix}"
        )

        CfnOutput(
            self,
            "IngestionQueueUrl",
            value=ingestion_to_validation_queue.queue_url,
            description="URL of ingestion-to-validation SQS queue",
            export_name=f"ingestion-queue-url-{environment_suffix}"
        )

        CfnOutput(
            self,
            "ValidationQueueUrl",
            value=validation_to_enrichment_queue.queue_url,
            description="URL of validation-to-enrichment SQS queue",
            export_name=f"validation-queue-url-{environment_suffix}"
        )

        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
            export_name=f"api-endpoint-{environment_suffix}"
        )

        CfnOutput(
            self,
            "FailureTopicArn",
            value=failure_topic.topic_arn,
            description="ARN of SNS failure notification topic",
            export_name=f"failure-topic-arn-{environment_suffix}"
        )
