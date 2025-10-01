"""
Lambda function module for S3-triggered processing.
Addresses model failures around event notifications and Lambda permissions.
"""

from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


def create_lambda_function(
    config: ServerlessConfig,
    lambda_role: aws.iam.Role,
    input_bucket: aws.s3.Bucket,
    output_bucket: aws.s3.Bucket
) -> aws.lambda_.Function:
    """
    Create Lambda function with proper configuration and packaging.
    Addresses model failures around Lambda deployment and configuration.
    """
    
    # Create Lambda function
    lambda_function = aws.lambda_.Function(
        config.lambda_function_name,
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lib/infrastructure/lambda_code")
        }),
        role=lambda_role.arn,
        handler="app.lambda_handler",
        runtime="python3.9",
        timeout=config.lambda_timeout,
        memory_size=config.lambda_memory,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables=config.get_environment_variables()
        ),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return lambda_function


def create_s3_event_notification(
    config: ServerlessConfig,
    input_bucket: aws.s3.Bucket,
    lambda_function: aws.lambda_.Function
) -> aws.s3.BucketNotification:
    """
    Create S3 event notification for Lambda function.
    Addresses model failures around S3 event notification filter fields.
    """
    
    # Create Lambda permission for S3 to invoke Lambda
    lambda_permission = aws.lambda_.Permission(
        f"{config.lambda_function_name}-s3-permission",
        statement_id="AllowExecutionFromS3Bucket",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="s3.amazonaws.com",
        source_arn=input_bucket.arn,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Create S3 bucket notification with proper filter structure
    # Addresses model failure: S3 event notification filter fields incorrect
    # Uses correct lambda_functions structure with proper filter_prefix and filter_suffix
    bucket_notification = aws.s3.BucketNotification(
        f"{config.lambda_function_name}-notification",
        bucket=input_bucket.id,
        lambda_functions=[
            aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix=f"{config.environment_suffix}/",
                filter_suffix=".json"
            )
        ],
        opts=pulumi.ResourceOptions(
            provider=config.aws_provider,
            depends_on=[lambda_permission]
        )
    )
    
    return bucket_notification


def create_lambda_alarms(
    config: ServerlessConfig,
    lambda_function: aws.lambda_.Function
) -> Dict[str, aws.cloudwatch.MetricAlarm]:
    """
    Create CloudWatch alarms for Lambda function monitoring.
    """
    
    # Error rate alarm
    error_alarm = aws.cloudwatch.MetricAlarm(
        f"{config.lambda_function_name}-errors",
        name=f"{config.lambda_function_name}-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=1,
        alarm_description="Lambda function errors",
        alarm_actions=[],
        dimensions={
            "FunctionName": lambda_function.name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Duration alarm
    duration_alarm = aws.cloudwatch.MetricAlarm(
        f"{config.lambda_function_name}-duration",
        name=f"{config.lambda_function_name}-duration",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=240000,  # 4 minutes in milliseconds
        alarm_description="Lambda function duration",
        alarm_actions=[],
        dimensions={
            "FunctionName": lambda_function.name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    # Throttle alarm
    throttle_alarm = aws.cloudwatch.MetricAlarm(
        f"{config.lambda_function_name}-throttles",
        name=f"{config.lambda_function_name}-throttles",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Throttles",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=0,
        alarm_description="Lambda function throttles",
        alarm_actions=[],
        dimensions={
            "FunctionName": lambda_function.name
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )
    
    return {
        "error_alarm": error_alarm,
        "duration_alarm": duration_alarm,
        "throttle_alarm": throttle_alarm
    }


def create_lambda_resources(
    config: ServerlessConfig,
    lambda_role: aws.iam.Role,
    input_bucket: aws.s3.Bucket,
    output_bucket: aws.s3.Bucket
) -> Dict[str, Any]:
    """
    Create all Lambda-related resources.
    Addresses model failures around Lambda configuration and event handling.
    """
    
    # Create Lambda function
    lambda_function = create_lambda_function(config, lambda_role, input_bucket, output_bucket)
    
    # Create S3 event notification
    s3_notification = create_s3_event_notification(config, input_bucket, lambda_function)
    
    # Create CloudWatch alarms
    alarms = create_lambda_alarms(config, lambda_function)
    
    return {
        "lambda_function": lambda_function,
        "s3_notification": s3_notification,
        "alarms": alarms
    }
