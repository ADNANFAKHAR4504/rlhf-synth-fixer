"""
Monitoring module for the serverless payment processing system.

This module creates CloudWatch alarms with proper metric math for
percentage-based error rate monitoring.

Addresses Model Failure #6: CloudWatch alarms mis-implement error-rate requirement
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import PaymentProcessingConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch alarms for the payment processing system.
    
    Creates alarms with proper metric math expressions for percentage-based
    error rate monitoring (>1% error rate).
    """
    
    def __init__(
        self,
        config: PaymentProcessingConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Monitoring stack.
        
        Args:
            config: PaymentProcessingConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        
        self._create_lambda_error_rate_alarm()
        self._create_lambda_throttle_alarm()
        self._create_lambda_duration_alarm()
    
    def _create_lambda_error_rate_alarm(self):
        """
        Create Lambda error rate alarm using metric math.
        
        Implements proper >1% error rate detection using:
        - errors / invocations * 100
        """
        function_name = 'payment-processor'
        lambda_function = self.lambda_stack.get_function(function_name)
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"{function_name}-error-rate-alarm",
            name=self.config.get_resource_name(f'{function_name}-error-rate'),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=self.config.error_rate_threshold,
            alarm_description=f"Alarm when {function_name} error rate exceeds {self.config.error_rate_threshold}%",
            treat_missing_data="notBreaching",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="error_rate",
                    expression="(errors / invocations) * 100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="errors",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=60,
                        stat="Sum",
                        dimensions={
                            "FunctionName": lambda_function.name
                        }
                    )
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="invocations",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=60,
                        stat="Sum",
                        dimensions={
                            "FunctionName": lambda_function.name
                        }
                    )
                )
            ],
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.alarms[f"{function_name}-error-rate"] = alarm
    
    def _create_lambda_throttle_alarm(self):
        """Create Lambda throttle alarm."""
        function_name = 'payment-processor'
        lambda_function = self.lambda_stack.get_function(function_name)
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"{function_name}-throttle-alarm",
            name=self.config.get_resource_name(f'{function_name}-throttle'),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=1.0,
            alarm_description=f"Alarm when {function_name} throttles occur",
            dimensions={
                "FunctionName": lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.alarms[f"{function_name}-throttle"] = alarm
    
    def _create_lambda_duration_alarm(self):
        """Create Lambda duration alarm."""
        function_name = 'payment-processor'
        lambda_function = self.lambda_stack.get_function(function_name)
        
        threshold_ms = (self.config.lambda_timeout - 5) * 1000
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"{function_name}-duration-alarm",
            name=self.config.get_resource_name(f'{function_name}-duration'),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=60,
            statistic="Maximum",
            threshold=threshold_ms,
            alarm_description=f"Alarm when {function_name} duration approaches timeout",
            dimensions={
                "FunctionName": lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.alarms[f"{function_name}-duration"] = alarm
    
    def get_alarm(self, alarm_name: str) -> aws.cloudwatch.MetricAlarm:
        """Get an alarm by name."""
        return self.alarms.get(alarm_name)
    
    def get_alarm_arn(self, alarm_name: str) -> Output[str]:
        """Get an alarm ARN by name."""
        alarm = self.alarms.get(alarm_name)
        if alarm:
            return alarm.arn
        return Output.from_input("")

