"""
CloudWatch monitoring, alarms, and dashboards.

This module creates comprehensive CloudWatch monitoring with custom metrics,
alarms, and dashboards for the serverless application.
"""

import json
from typing import Any, Dict, List, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import cloudwatch

from .config import InfrastructureConfig


class CloudWatchStack:
    """
    CloudWatch stack for comprehensive monitoring.
    
    Creates CloudWatch log groups, custom metrics, alarms, and dashboards
    for monitoring Lambda invocations, error rates, and operational metrics.
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig,
        lambda_stack: 'LambdaStack',
        api_gateway_stack: 'APIGatewayStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize CloudWatch stack with monitoring components.
        
        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function monitoring
            api_gateway_stack: API Gateway stack for API monitoring
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.api_gateway_stack = api_gateway_stack
        self.opts = opts or ResourceOptions()
        
        # Create CloudWatch components
        self.log_groups = self._create_log_groups()
        self.metrics = self._create_custom_metrics()
        self.alarms = self._create_alarms()
        self.dashboard = self._create_dashboard()
        
    def _create_log_groups(self) -> Dict[str, cloudwatch.LogGroup]:
        """
        Create CloudWatch log groups for Lambda functions.
        
        Returns:
            Dictionary of log groups
        """
        log_groups = {}
        
        # Main Lambda function log group
        main_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'main')}",
            name=self.lambda_stack.get_main_function_name().apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['main'] = main_log_group
        
        # Log processor function log group
        processor_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'processor')}",
            name=self.lambda_stack.get_log_processor_function_name().apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['processor'] = processor_log_group
        
        # API Gateway log group
        api_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'api')}",
            name=f"/aws/apigateway/{self.config.get_resource_name('api')}",
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['api'] = api_log_group
        
        return log_groups
    
    def _create_custom_metrics(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Create custom CloudWatch metrics for monitoring.
        
        Returns:
            Dictionary of custom metrics
        """
        metrics = {}
        
        # Custom metric for application health
        health_metric = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('metric', 'health')}",
            name=f"{self.config.get_resource_name('metric', 'health')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApplicationHealth",
            namespace="ServerlessApp",
            period=300,
            statistic="Average",
            threshold=0.8,
            alarm_description="Application health monitoring",
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        metrics['health'] = health_metric
        
        return metrics
    
    def _create_alarms(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Create CloudWatch alarms for monitoring.
        
        Returns:
            Dictionary of alarms
        """
        alarms = {}
        
        # Lambda error rate alarm
        lambda_error_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'lambda-errors')}",
            name=f"{self.config.get_resource_name('alarm', 'lambda-errors')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function error rate alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_stack.get_main_function_name()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['lambda_errors'] = lambda_error_alarm
        
        # Lambda duration alarm
        lambda_duration_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'lambda-duration')}",
            name=f"{self.config.get_resource_name('alarm', 'lambda-duration')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds
            alarm_description="Lambda function duration alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_stack.get_main_function_name()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['lambda_duration'] = lambda_duration_alarm
        
        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'api-4xx')}",
            name=f"{self.config.get_resource_name('alarm', 'api-4xx')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX errors alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiName": self.api_gateway_stack.get_rest_api_id()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_4xx'] = api_4xx_alarm
        
        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'api-5xx')}",
            name=f"{self.config.get_resource_name('alarm', 'api-5xx')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="API Gateway 5XX errors alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiName": self.api_gateway_stack.get_rest_api_id()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_5xx'] = api_5xx_alarm
        
        return alarms
    
    def _create_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for monitoring.
        
        Returns:
            CloudWatch dashboard
        """
        dashboard_name = self.config.get_resource_name('dashboard')
        
        # Create dashboard with widgets
        dashboard = cloudwatch.Dashboard(
            dashboard_name,
            dashboard_name=dashboard_name,
            dashboard_body=pulumi.Output.all(
                lambda_function_name=self.lambda_stack.get_main_function_name(),
                api_gateway_id=self.api_gateway_stack.get_rest_api_id()
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args["lambda_function_name"]],
                                [".", "Errors", ".", "."],
                                [".", "Duration", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.config.aws_region,
                            "title": "Lambda Function Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", "ApiName", args["api_gateway_id"]],
                                [".", "4XXError", ".", "."],
                                [".", "5XXError", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.config.aws_region,
                            "title": "API Gateway Metrics"
                        }
                    },
                    {
                        "type": "log",
                        "x": 0,
                        "y": 6,
                        "width": 24,
                        "height": 6,
                        "properties": {
                            "query": f"SOURCE '/aws/lambda/{args['lambda_function_name']}' | fields @timestamp, @message | sort @timestamp desc | limit 100",
                            "region": self.config.aws_region,
                            "title": "Lambda Function Logs"
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return dashboard
    
    def get_log_groups(self) -> Dict[str, cloudwatch.LogGroup]:
        """
        Get the log groups.
        
        Returns:
            Dictionary of log groups
        """
        return self.log_groups
    
    def get_alarms(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Get the alarms.
        
        Returns:
            Dictionary of alarms
        """
        return self.alarms
    
    def get_dashboard_url(self) -> pulumi.Output[str]:
        """
        Get the CloudWatch dashboard URL.
        
        Returns:
            CloudWatch dashboard URL
        """
        return pulumi.Output.concat(
            "https://",
            self.config.aws_region,
            ".console.aws.amazon.com/cloudwatch/home?region=",
            self.config.aws_region,
            "#dashboards:name=",
            self.config.get_resource_name('dashboard')
        )
    
    def get_main_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the main log group.
        
        Returns:
            Name of the main log group
        """
        return self.log_groups['main'].name
    
    def get_processor_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the processor log group.
        
        Returns:
            Name of the processor log group
        """
        return self.log_groups['processor'].name
    
    def get_api_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the API log group.
        
        Returns:
            Name of the API log group
        """
        return self.log_groups['api'].name
