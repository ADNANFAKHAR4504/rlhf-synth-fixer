"""tap_stack.py
Serverless ETL Pipeline Stack for Financial Transaction Processing

This module defines the TapStack class, which creates a complete serverless ETL
pipeline using AWS CDK with Python. The pipeline processes financial transaction
files uploaded to S3, validates them, transforms them, and tracks processing status.
"""

from dataclasses import dataclass
from typing import Optional

from aws_cdk import (
    Stack,
    StackProps,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    Tags,
    Environment,
)
from constructs import Construct


@dataclass
class TapStackProps(StackProps):
    """Properties for TapStack."""
    environment_suffix: str = "dev"
    env: Optional[Environment] = None


class TapStack(Stack):
    """
    Main CDK stack for serverless ETL pipeline.

    Implements a production-ready event-driven architecture for processing
    financial transaction files with validation, transformation, and monitoring.
    """

    def __init__(self, scope: Construct, construct_id: str,
                 props: Optional[TapStackProps] = None, **kwargs) -> None:
        # Extract TapStackProps-specific properties before calling super
        if props is None:
            props = TapStackProps()

        env_suffix = props.environment_suffix

        # Pass remaining properties to parent Stack
        stack_props = {}
        if props.env:
            stack_props['env'] = props.env

        super().__init__(scope, construct_id, **stack_props, **kwargs)

        # S3 Buckets for raw and processed data
        raw_bucket = s3.Bucket(
            self, "RawBucket",
            bucket_name=f"etl-raw-{env_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        processed_bucket = s3.Bucket(
            self, "ProcessedBucket",
            bucket_name=f"etl-processed-{env_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # DynamoDB table for processing status tracking
        processing_table = dynamodb.Table(
            self, "ProcessingTable",
            table_name=f"etl-processing-status-{env_suffix}",
            partition_key=dynamodb.Attribute(
                name="file_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda function for file validation
        validation_function = lambda_.Function(
            self, "ValidationFunction",
            function_name=f"etl-validation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
            log_retention=logs.RetentionDays.ONE_MONTH,
            environment={
                "TABLE_NAME": processing_table.table_name,
                "RAW_BUCKET": raw_bucket.bucket_name
            }
        )

        # Lambda function for data transformation
        transformation_function = lambda_.Function(
            self, "TransformationFunction",
            function_name=f"etl-transformation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="transformation.handler",
            code=lambda_.Code.from_asset("lib/lambda/transformation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
            log_retention=logs.RetentionDays.ONE_MONTH,
            environment={
                "TABLE_NAME": processing_table.table_name,
                "RAW_BUCKET": raw_bucket.bucket_name,
                "PROCESSED_BUCKET": processed_bucket.bucket_name
            }
        )

        # Grant permissions
        processing_table.grant_read_write_data(validation_function)
        processing_table.grant_read_write_data(transformation_function)
        raw_bucket.grant_read(validation_function)
        raw_bucket.grant_read(transformation_function)
        processed_bucket.grant_write(transformation_function)

        # Step Functions State Machine with retry logic
        validation_task = tasks.LambdaInvoke(
            self, "ValidateFile",
            lambda_function=validation_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True
        ).add_retry(
            errors=["States.TaskFailed", "States.Timeout"],
            max_attempts=3,
            backoff_rate=2.0,
            interval=Duration.seconds(2)
        )

        transformation_task = tasks.LambdaInvoke(
            self, "TransformFile",
            lambda_function=transformation_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True
        ).add_retry(
            errors=["States.TaskFailed", "States.Timeout"],
            max_attempts=3,
            backoff_rate=2.0,
            interval=Duration.seconds(2)
        )

        fail_state = sfn.Fail(
            self, "ProcessingFailed",
            cause="File processing failed",
            error="ValidationError"
        )

        success_state = sfn.Succeed(
            self, "ProcessingSucceeded"
        )

        # Add error handling to tasks
        validation_task.add_catch(
            fail_state,
            errors=["States.ALL"],
            result_path="$.error"
        )

        transformation_task.add_catch(
            fail_state,
            errors=["States.ALL"],
            result_path="$.error"
        )

        # Chain the tasks
        definition = validation_task.next(transformation_task).next(success_state)

        state_machine = sfn.StateMachine(
            self, "ETLStateMachine",
            state_machine_name=f"etl-pipeline-{env_suffix}",
            definition=definition,
            timeout=Duration.minutes(15)
        )

        # Enable EventBridge notifications on raw bucket
        raw_bucket.enable_event_bridge_notification()

        # EventBridge rule with file extension filtering
        rule = events.Rule(
            self, "S3EventRule",
            rule_name=f"etl-s3-event-{env_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.s3"],
                detail_type=["Object Created"],
                detail={
                    "bucket": {
                        "name": [raw_bucket.bucket_name]
                    },
                    "object": {
                        "key": [
                            {"suffix": ".csv"},
                            {"suffix": ".json"}
                        ]
                    }
                }
            )
        )

        rule.add_target(
            targets.SfnStateMachine(
                state_machine,
                input=events.RuleTargetInput.from_event_path("$.detail")
            )
        )

        # CloudWatch alarms for error rate monitoring
        validation_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": validation_function.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                "invocations": validation_function.metric_invocations(
                    statistic="Sum",
                    period=Duration.minutes(5)
                )
            }
        )

        # After creating the alarms, add them to outputs
        validation_alarm = cloudwatch.Alarm(
            self, "ValidationErrorAlarm",
            alarm_name=f"etl-validation-errors-{env_suffix}",
            metric=validation_error_rate,
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        transformation_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": transformation_function.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                "invocations": transformation_function.metric_invocations(
                    statistic="Sum",
                    period=Duration.minutes(5)
                )
            }
        )

        transformation_alarm = cloudwatch.Alarm(
            self, "TransformationErrorAlarm",
            alarm_name=f"etl-transformation-errors-{env_suffix}",
            metric=transformation_error_rate,
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Add resource tags
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "ETL-Pipeline")

        # CloudFormation Outputs for integration tests
        from aws_cdk import CfnOutput

        CfnOutput(
            self, "RawBucketName",
            value=raw_bucket.bucket_name,
            description="Name of the raw data S3 bucket",
            export_name=f"ETL-RawBucket-{env_suffix}"
        )

        CfnOutput(
            self, "ProcessedBucketName",
            value=processed_bucket.bucket_name,
            description="Name of the processed data S3 bucket",
            export_name=f"ETL-ProcessedBucket-{env_suffix}"
        )

        CfnOutput(
            self, "ProcessingTableName",
            value=processing_table.table_name,
            description="Name of the DynamoDB processing status table",
            export_name=f"ETL-ProcessingTable-{env_suffix}"
        )

        CfnOutput(
            self, "ValidationFunctionName",
            value=validation_function.function_name,
            description="Name of the validation Lambda function",
            export_name=f"ETL-ValidationFunction-{env_suffix}"
        )

        CfnOutput(
            self, "TransformationFunctionName",
            value=transformation_function.function_name,
            description="Name of the transformation Lambda function",
            export_name=f"ETL-TransformationFunction-{env_suffix}"
        )

        CfnOutput(
            self, "StateMachineArn",
            value=state_machine.state_machine_arn,
            description="ARN of the ETL Step Functions state machine",
            export_name=f"ETL-StateMachine-{env_suffix}"
        )

        CfnOutput(
            self, "EventRuleName",
            value=rule.rule_name,
            description="Name of the EventBridge rule for S3 events",
            export_name=f"ETL-EventRule-{env_suffix}"
        )

        # Add alarm names to outputs
        CfnOutput(
            self, "ValidationAlarmName",
            value=validation_alarm.alarm_name,
            description="Name of the validation error CloudWatch alarm",
            export_name=f"ETL-ValidationAlarm-{env_suffix}"
        )

        CfnOutput(
            self, "TransformationAlarmName",
            value=transformation_alarm.alarm_name,
            description="Name of the transformation error CloudWatch alarm",
            export_name=f"ETL-TransformationAlarm-{env_suffix}"
        )
