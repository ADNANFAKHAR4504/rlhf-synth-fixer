from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sqs as sqs,
    aws_sns as sns,
    CfnOutput,
)
from constructs import Construct
import hashlib


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Generate a deterministic unique suffix based on environment and account
        # This ensures idempotency while avoiding naming conflicts
        account_id = self.account or "default"
        region = self.region or "us-east-1"
        seed_str = f"{environment_suffix}-{account_id}-{region}"
        unique_id = hashlib.sha256(seed_str.encode()).hexdigest()[:8]

        # S3 Bucket for file storage with dynamic naming
        processing_bucket = s3.Bucket(
            self,
            "ProcessingBucket",
            bucket_name=f"etl-processing-{environment_suffix}-{unique_id}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="MoveToGlacier",
                    enabled=True,
                    prefix="processed/",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30),
                        )
                    ],
                )
            ],
        )

        # DynamoDB table for tracking processing status with dynamic naming
        status_table = dynamodb.Table(
            self,
            "StatusTable",
            table_name=f"etl-status-{environment_suffix}-{unique_id}",
            partition_key=dynamodb.Attribute(
                name="file_id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="chunk_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
        )

        # Lambda Layer with pandas and boto3
        lambda_layer = lambda_.LayerVersion(
            self,
            "DataProcessingLayer",
            code=lambda_.Code.from_asset("lib/lambda/layer"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_9],
            description="Layer with pandas and boto3 for data processing",
        )

        # Lambda function for file splitting with dynamic naming
        splitter_function = lambda_.Function(
            self,
            "FileSplitter",
            function_name=f"etl-splitter-{environment_suffix}-{unique_id}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="splitter.handler",
            code=lambda_.Code.from_asset("lib/lambda/splitter"),
            timeout=Duration.minutes(15),
            memory_size=3072,
            layers=[lambda_layer],
            environment={
                "STATUS_TABLE": status_table.table_name,
                "BUCKET_NAME": processing_bucket.bucket_name,
                "CHUNK_SIZE_MB": "50",
            },
            log_retention=logs.RetentionDays.ONE_MONTH,
        )

        # Lambda function for data validation with dynamic naming
        validator_function = lambda_.Function(
            self,
            "DataValidator",
            function_name=f"etl-validator-{environment_suffix}-{unique_id}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="validator.handler",
            code=lambda_.Code.from_asset("lib/lambda/validator"),
            timeout=Duration.minutes(15),
            memory_size=3072,
            layers=[lambda_layer],
            environment={
                "STATUS_TABLE": status_table.table_name,
                "BUCKET_NAME": processing_bucket.bucket_name,
            },
            log_retention=logs.RetentionDays.ONE_MONTH,
        )

        # Lambda function for chunk processing with dynamic naming
        processor_function = lambda_.Function(
            self,
            "ChunkProcessor",
            function_name=f"etl-processor-{environment_suffix}-{unique_id}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="processor.handler",
            code=lambda_.Code.from_asset("lib/lambda/processor"),
            timeout=Duration.minutes(15),
            memory_size=3072,
            layers=[lambda_layer],
            environment={
                "STATUS_TABLE": status_table.table_name,
                "BUCKET_NAME": processing_bucket.bucket_name,
            },
            log_retention=logs.RetentionDays.ONE_MONTH,
        )

        # Grant permissions to Lambda functions
        processing_bucket.grant_read_write(splitter_function)
        processing_bucket.grant_read_write(validator_function)
        processing_bucket.grant_read_write(processor_function)
        status_table.grant_read_write_data(splitter_function)
        status_table.grant_read_write_data(validator_function)
        status_table.grant_read_write_data(processor_function)

        # SNS Topic for failure alerts with dynamic naming
        failure_topic = sns.Topic(
            self,
            "FailureTopic",
            topic_name=f"etl-failures-{environment_suffix}-{unique_id}",
            display_name="ETL Pipeline Failure Notifications",
        )

        # SQS FIFO Queue for processing results with dynamic naming
        results_queue = sqs.Queue(
            self,
            "ResultsQueue",
            queue_name=f"etl-results-{environment_suffix}-{unique_id}.fifo",
            fifo=True,
            content_based_deduplication=True,
            visibility_timeout=Duration.minutes(15),
            retention_period=Duration.days(7),
        )

        # Step Functions state machine definition

        # Split file task
        split_file_task = tasks.LambdaInvoke(
            self,
            "SplitFile",
            lambda_function=splitter_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
        )

        # Validate data task
        validate_task = tasks.LambdaInvoke(
            self,
            "ValidateData",
            lambda_function=validator_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
        )

        # Process chunk task
        process_chunk_task = tasks.LambdaInvoke(
            self,
            "ProcessChunk",
            lambda_function=processor_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
        )

        # Add exponential backoff retry for processing
        process_chunk_task.add_retry(
            errors=["States.TaskFailed", "States.Timeout"],
            interval=Duration.seconds(2),
            max_attempts=3,
            backoff_rate=2.0,
        )

        # Send success notification to SQS
        send_success_task = tasks.SqsSendMessage(
            self,
            "SendSuccessNotification",
            queue=results_queue,
            message_body=sfn.TaskInput.from_json_path_at("$"),
            message_group_id="processing-results",
        )

        # Send failure notification to SNS
        send_failure_task = tasks.SnsPublish(
            self,
            "SendFailureNotification",
            topic=failure_topic,
            message=sfn.TaskInput.from_json_path_at("$.error"),
            subject="ETL Pipeline Processing Failure",
        )

        # Add error handling to process chunk task
        process_chunk_with_error = process_chunk_task.add_catch(
            send_failure_task,
            errors=["States.ALL"],
            result_path="$.error",
        )

        # Chain success notification
        process_workflow = process_chunk_with_error.next(send_success_task)

        # Parallel processing with Map state
        process_chunks_map = sfn.Map(
            self,
            "ProcessChunksMap",
            max_concurrency=10,
            items_path="$.chunks",
            parameters={
                "chunk.$": "$$.Map.Item.Value",
                "file_id.$": "$.file_id",
            },
        )

        process_chunks_map.iterator(process_workflow)

        # Define the workflow
        workflow_definition = (
            split_file_task
            .next(validate_task)
            .next(process_chunks_map)
        )

        # Step Functions state machine with dynamic naming
        state_machine = sfn.StateMachine(
            self,
            "ETLStateMachine",
            state_machine_name=f"etl-pipeline-{environment_suffix}-{unique_id}",
            definition=workflow_definition,
            timeout=Duration.hours(2),
            tracing_enabled=True,
            logs=sfn.LogOptions(
                destination=logs.LogGroup(
                    self,
                    "StateMachineLogGroup",
                    log_group_name=f"/aws/stepfunctions/etl-{environment_suffix}-{unique_id}",
                    removal_policy=RemovalPolicy.DESTROY,
                    retention=logs.RetentionDays.ONE_MONTH,
                ),
                level=sfn.LogLevel.ALL,
            ),
        )

        # Add tagging to state machine
        state_machine.node.add_metadata("Environment", "Production")
        state_machine.node.add_metadata("Project", "ETL")

        # EventBridge rule to trigger on S3 file uploads with dynamic naming
        s3_event_rule = events.Rule(
            self,
            "S3FileUploadRule",
            rule_name=f"etl-s3-trigger-{environment_suffix}-{unique_id}",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={
                    "bucket": {"name": [processing_bucket.bucket_name]},
                    "object": {"key": [{"prefix": "incoming/"}]},
                },
            ),
        )

        # Grant Step Functions permission to be invoked by EventBridge
        s3_event_rule.add_target(
            targets.SfnStateMachine(
                state_machine,
                input=events.RuleTargetInput.from_event_path("$.detail"),
            )
        )

        # Enable S3 EventBridge notifications
        processing_bucket.enable_event_bridge_notification()

        # CloudWatch Dashboard with dynamic naming
        dashboard = cloudwatch.Dashboard(
            self,
            "ETLDashboard",
            dashboard_name=f"etl-pipeline-{environment_suffix}-{unique_id}",
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="State Machine Executions",
                left=[
                    state_machine.metric_started(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    state_machine.metric_succeeded(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    state_machine.metric_failed(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    splitter_function.metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    validator_function.metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    processor_function.metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
                right=[
                    splitter_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    validator_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    processor_function.metric_errors(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Operations",
                left=[
                    status_table.metric_consumed_read_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    status_table.metric_consumed_write_capacity_units(
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
            )
        )

        # Add IAM policy to deny dangerous operations
        deny_dangerous_operations = iam.PolicyStatement(
            effect=iam.Effect.DENY,
            actions=[
                "s3:DeleteBucket",
                "dynamodb:DeleteTable",
            ],
            resources=[
                processing_bucket.bucket_arn,
                status_table.table_arn,
            ],
        )

        splitter_function.add_to_role_policy(deny_dangerous_operations)
        validator_function.add_to_role_policy(deny_dangerous_operations)
        processor_function.add_to_role_policy(deny_dangerous_operations)

        # Outputs
        CfnOutput(
            self,
            "ProcessingBucketName",
            value=processing_bucket.bucket_name,
            description="S3 bucket for file processing",
        )

        CfnOutput(
            self,
            "StatusTableName",
            value=status_table.table_name,
            description="DynamoDB table for processing status",
        )

        CfnOutput(
            self,
            "StateMachineArn",
            value=state_machine.state_machine_arn,
            description="Step Functions state machine ARN",
        )

        CfnOutput(
            self,
            "DashboardURL",
            value=(
                f"https://console.aws.amazon.com/cloudwatch/home?"
                f"region={self.region}#dashboards:name={dashboard.dashboard_name}"
            ),
            description="CloudWatch Dashboard URL",
        )

        CfnOutput(
            self,
            "ResultsQueueURL",
            value=results_queue.queue_url,
            description="SQS FIFO queue for processing results",
        )

        CfnOutput(
            self,
            "FailureTopicArn",
            value=failure_topic.topic_arn,
            description="SNS topic for failure notifications",
        )
