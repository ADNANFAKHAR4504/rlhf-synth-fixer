"""
Monitoring module for the serverless backend.

This module creates CloudWatch log groups, metric filters, and alarms
with complete, validated configurations.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch logging and monitoring.
    
    Creates:
    - CloudWatch log groups for Lambda functions
    - Metric filters for error tracking
    - CloudWatch alarms with proper notification targets
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.metric_filters: Dict[str, aws.cloudwatch.LogMetricFilter] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        
        # Create monitoring resources for each Lambda function
        for function_name in self.lambda_stack.get_all_function_names():
            self._create_monitoring_for_function(function_name)
    
    def _create_monitoring_for_function(self, function_name: str):
        """Create CloudWatch monitoring resources for a Lambda function."""
        # Get the Lambda function name (Output)
        lambda_function_name = self.lambda_stack.get_function_name(function_name)
        
        # Create log group
        log_group_name = lambda_function_name.apply(lambda name: f"/aws/lambda/{name}")
        
        log_group = aws.cloudwatch.LogGroup(
            f"log-group-{function_name}",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.log_groups[function_name] = log_group
        
        # Create metric filter for errors
        self._create_error_metric_filter(function_name, log_group)
        
        # Create alarm for errors
        self._create_error_alarm(function_name)
        
        # Create alarm for Lambda errors (native metric)
        self._create_lambda_error_alarm(function_name)
    
    def _create_error_metric_filter(self, function_name: str, log_group: aws.cloudwatch.LogGroup):
        """Create metric filter for error log patterns."""
        metric_filter = aws.cloudwatch.LogMetricFilter(
            f"metric-filter-errors-{function_name}",
            log_group_name=log_group.name,
            pattern="ERROR",
            metric_transformation=aws.cloudwatch.LogMetricFilterMetricTransformationArgs(
                name=f"{self.config.project_name}-{function_name}-errors",
                namespace=f"{self.config.project_name}/Lambda",
                value="1",
                default_value=0
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.metric_filters[f"{function_name}-errors"] = metric_filter
    
    def _create_error_alarm(self, function_name: str):
        """Create CloudWatch alarm for error metric."""
        alarm_name = self.config.get_resource_name(f'alarm-{function_name}-errors')
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"alarm-errors-{function_name}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name=f"{self.config.project_name}-{function_name}-errors",
            namespace=f"{self.config.project_name}/Lambda",
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=5,
            treat_missing_data="notBreaching",
            alarm_description=f"Alarm when {function_name} function logs more than 5 errors in 5 minutes",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.alarms[f"{function_name}-errors"] = alarm
    
    def _create_lambda_error_alarm(self, function_name: str):
        """Create CloudWatch alarm for Lambda native error metric."""
        alarm_name = self.config.get_resource_name(f'alarm-{function_name}-lambda-errors')
        lambda_function_name = self.lambda_stack.get_function_name(function_name)
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"alarm-lambda-errors-{function_name}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="Errors",
            namespace="AWS/Lambda",
            dimensions={
                "FunctionName": lambda_function_name
            },
            period=300,  # 5 minutes
            statistic="Sum",
            threshold=3,
            treat_missing_data="notBreaching",
            alarm_description=f"Alarm when {function_name} Lambda function has more than 3 errors in 5 minutes",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.alarms[f"{function_name}-lambda-errors"] = alarm
    
    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """
        Get log group for a function.
        
        Args:
            function_name: Function name identifier
            
        Returns:
            CloudWatch LogGroup resource
        """
        return self.log_groups[function_name]
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get log group name.
        
        Args:
            function_name: Function name identifier
            
        Returns:
            Log group name as Output
        """
        return self.log_groups[function_name].name
    
    def get_alarm(self, alarm_key: str) -> aws.cloudwatch.MetricAlarm:
        """
        Get an alarm by key.
        
        Args:
            alarm_key: Alarm key (e.g., 'users-errors')
            
        Returns:
            CloudWatch MetricAlarm resource
        """
        return self.alarms[alarm_key]

