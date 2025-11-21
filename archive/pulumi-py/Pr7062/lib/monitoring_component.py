"""
CloudWatch Monitoring Component.
Creates CloudWatch alarms with environment-specific thresholds.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from lib.environment_config import EnvironmentConfig


class MonitoringComponentArgs:
    """Arguments for Monitoring Component."""

    def __init__(
        self,
        environment_suffix: str,
        env_config: EnvironmentConfig,
        lambda_function_name: Output[str],
        dynamodb_table_name: Output[str],
        tags: Optional[Dict[str, str]] = None
    ):
        self.environment_suffix = environment_suffix
        self.env_config = env_config
        self.lambda_function_name = lambda_function_name
        self.dynamodb_table_name = dynamodb_table_name
        self.tags = tags or {}


class MonitoringComponent(pulumi.ComponentResource):
    """
    Reusable monitoring component with CloudWatch alarms.
    Creates alarms with environment-specific thresholds.
    """

    def __init__(
        self,
        name: str,
        args: MonitoringComponentArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('payment:monitoring:MonitoringComponent', name, None, opts)

        child_opts = ResourceOptions(parent=self)

        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-lambda-errors-{args.environment_suffix}",
            name=f"payment-lambda-errors-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.lambda_error_alarm_threshold,
            alarm_description=(
                f"Lambda errors exceeded "
                f"{args.env_config.lambda_error_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'FunctionName': args.lambda_function_name
            },
            tags={
                **args.tags,
                'Name': f"payment-lambda-errors-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # DynamoDB read throttle alarm
        self.dynamodb_read_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            name=f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.dynamodb_throttle_alarm_threshold,
            alarm_description=(
                f"DynamoDB read throttle exceeded "
                f"{args.env_config.dynamodb_throttle_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'TableName': args.dynamodb_table_name
            },
            tags={
                **args.tags,
                'Name': f"payment-dynamodb-read-throttle-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # DynamoDB write throttle alarm
        self.dynamodb_write_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            name=f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=args.env_config.dynamodb_throttle_alarm_threshold,
            alarm_description=(
                f"DynamoDB write throttle exceeded "
                f"{args.env_config.dynamodb_throttle_alarm_threshold} "
                f"in {args.env_config.name}"
            ),
            dimensions={
                'TableName': args.dynamodb_table_name
            },
            tags={
                **args.tags,
                'Name': f"payment-dynamodb-write-throttle-{args.environment_suffix}",
            },
            opts=child_opts
        )

        # Register outputs
        self.register_outputs({
            'lambda_error_alarm_arn': self.lambda_error_alarm.arn,
            'dynamodb_read_throttle_alarm_arn': self.dynamodb_read_throttle_alarm.arn,
            'dynamodb_write_throttle_alarm_arn': self.dynamodb_write_throttle_alarm.arn,
        })
