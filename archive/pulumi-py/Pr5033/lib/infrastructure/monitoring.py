"""
Monitoring module for CloudWatch logs and alarms.

This module creates CloudWatch Log Groups with retention policies
and alarms that correctly calculate 5% error rates.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class MonitoringStack:
    """
    Manages CloudWatch monitoring, logging, and alarms.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_function_name: Output[str],
        topic_arn: Output[str],
        parent: pulumi.Resource
    ):
        """
        Initialize monitoring stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            lambda_function_name: Lambda function name
            topic_arn: SNS topic ARN for alarm notifications
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.lambda_function_name = lambda_function_name
        self.topic_arn = topic_arn
        self.parent = parent
        
        # Create CloudWatch Log Group
        self.log_group = self._create_log_group()
        
        # Create CloudWatch Alarms for Lambda error rate monitoring
        self._create_error_rate_alarm()
        
        # Create CloudWatch Alarms for SNS monitoring
        if self.config.enable_notifications:
            self._create_sns_monitoring_alarms()
    
    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group with retention policy.
        
        Returns:
            CloudWatch Log Group resource
        """
        log_group_name = self.lambda_function_name.apply(
            lambda name: f"/aws/lambda/{name}"
        )
        
        log_group = aws.cloudwatch.LogGroup(
            self.config.get_resource_name('log-group'),
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        return log_group
    
    def _create_error_rate_alarm(self):
        """
        Create CloudWatch Alarm for 5% error rate.
        
        This alarm correctly calculates error rate as a percentage
        of total invocations, not absolute error count.
        """
        alarm_name = self.config.get_resource_name('error-rate-alarm')
        
        # Create metric math alarm for error rate calculation
        # Error Rate = (Errors / Invocations) * 100
        aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            threshold=self.config.error_rate_threshold,
            alarm_description=f"Alarm when Lambda error rate exceeds {self.config.error_rate_threshold}%",
            treat_missing_data="notBreaching",
            actions_enabled=True,
            alarm_actions=[self.topic_arn] if self.config.enable_notifications else [],
            metric_queries=[
                # Metric 1: Errors
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="errors",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,  # 5 minutes
                        stat="Sum",
                        dimensions={
                            "FunctionName": self.lambda_function_name
                        }
                    ),
                    return_data=False
                ),
                # Metric 2: Invocations
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="invocations",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,  # 5 minutes
                        stat="Sum",
                        dimensions={
                            "FunctionName": self.lambda_function_name
                        }
                    ),
                    return_data=False
                ),
                # Metric 3: Error Rate calculation
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="error_rate",
                    expression="IF(invocations > 0, (errors / invocations) * 100, 0)",
                    label="Error Rate (%)",
                    return_data=True
                )
            ],
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        # Create additional alarm for throttles
        throttle_alarm_name = self.config.get_resource_name('throttle-alarm')
        
        aws.cloudwatch.MetricAlarm(
            throttle_alarm_name,
            name=throttle_alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alarm when Lambda function is throttled",
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_function_name
            },
            actions_enabled=True,
            alarm_actions=[self.topic_arn] if self.config.enable_notifications else [],
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def get_log_group_arn(self) -> Output[str]:
        """
        Get CloudWatch Log Group ARN.
        
        Returns:
            Log Group ARN as Output
        """
        return self.log_group.arn
    
    def get_log_group_name(self) -> Output[str]:
        """
        Get CloudWatch Log Group name.
        
        Returns:
            Log Group name as Output
        """
        return self.log_group.name
    
    def _create_sns_monitoring_alarms(self):
        """
        Create CloudWatch Alarms for SNS topic monitoring.
        
        Monitors SNS message delivery failures.
        """
        # Alarm for SNS NumberOfNotificationsFailed
        failed_alarm_name = self.config.get_resource_name('sns-failed-alarm')
        
        aws.cloudwatch.MetricAlarm(
            failed_alarm_name,
            name=failed_alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="NumberOfNotificationsFailed",
            namespace="AWS/SNS",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Alarm when SNS notifications fail",
            treat_missing_data="notBreaching",
            dimensions={
                "TopicName": self.topic_arn.apply(lambda arn: arn.split(':')[-1])
            },
            actions_enabled=True,
            alarm_actions=[self.topic_arn],
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )

