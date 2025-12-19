"""
CloudWatch module for the serverless infrastructure.

This module creates CloudWatch log groups, alarms, and dashboards with proper
error monitoring, addressing the model failures about missing log group
configuration and alarm export/usage issues.
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class CloudWatchStack:
    """
    CloudWatch stack for monitoring and alerting.
    
    Creates CloudWatch resources with:
    - Explicit log groups with retention
    - Error rate alarms
    - Custom dashboards
    - Proper alarm configuration
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        lambda_stack,
        api_gateway_stack,
        sns_stack,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the CloudWatch stack.
        
        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function monitoring
            api_gateway_stack: API Gateway stack for endpoint monitoring
            sns_stack: SNS stack for notifications
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.api_gateway_stack = api_gateway_stack
        self.sns_stack = sns_stack
        self.opts = opts or ResourceOptions()
        
        # Create log groups for API Gateway
        self.api_gateway_log_group = self._create_api_gateway_log_group()
        
        # Create alarms
        self.alarms = self._create_alarms()
        
        # Create dashboard
        self.dashboard = self._create_dashboard()
    
    def _create_api_gateway_log_group(self):
        """Create CloudWatch log group for API Gateway with explicit retention."""
        log_group_name = f"/aws/apigateway/{self.config.get_resource_name('api-gateway', 'rest-api')}-{self.config.environment}"
        
        log_group = aws.cloudwatch.LogGroup(
            self.config.get_resource_name('cloudwatch-log-group', 'api-gateway'),
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return log_group
    
    def _create_alarms(self):
        """Create CloudWatch alarms for error monitoring."""
        alarms = {}
        
        # Lambda error rate alarm
        lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            self.config.get_resource_name('cloudwatch-alarm', 'lambda-errors'),
            name=f"{self.config.get_resource_name('cloudwatch-alarm', 'lambda-errors')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=self.config.alarm_period,
            statistic="Sum",
            threshold=self.config.alarm_threshold,
            alarm_description="Lambda function error rate alarm",
            alarm_actions=[self.sns_stack.get_critical_topic_arn()],
            dimensions={
                "FunctionName": self.lambda_stack.api_handler.name
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['lambda_errors'] = lambda_error_alarm
        
        # API Gateway 4xx errors alarm
        api_4xx_alarm = aws.cloudwatch.MetricAlarm(
            self.config.get_resource_name('cloudwatch-alarm', 'api-4xx-errors'),
            name=f"{self.config.get_resource_name('cloudwatch-alarm', 'api-4xx-errors')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=self.config.alarm_period,
            statistic="Sum",
            threshold=self.config.alarm_threshold,
            alarm_description="API Gateway 4XX error rate alarm",
            alarm_actions=[self.sns_stack.get_critical_topic_arn()],
            dimensions={
                "ApiName": self.api_gateway_stack.rest_api.name,
                "Stage": self.api_gateway_stack.stage.stage_name
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_4xx_errors'] = api_4xx_alarm
        
        # API Gateway 5xx errors alarm
        api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            self.config.get_resource_name('cloudwatch-alarm', 'api-5xx-errors'),
            name=f"{self.config.get_resource_name('cloudwatch-alarm', 'api-5xx-errors')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=self.config.alarm_period,
            statistic="Sum",
            threshold=self.config.alarm_threshold,
            alarm_description="API Gateway 5XX error rate alarm",
            alarm_actions=[self.sns_stack.get_critical_topic_arn()],
            dimensions={
                "ApiName": self.api_gateway_stack.rest_api.name,
                "Stage": self.api_gateway_stack.stage.stage_name
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_5xx_errors'] = api_5xx_alarm
        
        return alarms
    
    def _create_dashboard(self):
        """Create CloudWatch dashboard for monitoring."""
        dashboard_body = pulumi.Output.all(
            self.lambda_stack.api_handler.name,
            self.api_gateway_stack.rest_api.name,
            self.api_gateway_stack.stage.stage_name
        ).apply(lambda args: {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", "FunctionName", args[0]],
                            [".", "Errors", ".", "."],
                            [".", "Duration", ".", "."]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": self.config.aws_region,
                        "title": "Lambda Function Metrics",
                        "period": 300
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
                            ["AWS/ApiGateway", "Count", "ApiName", args[1], "Stage", args[2]],
                            [".", "4XXError", ".", ".", ".", "."],
                            [".", "5XXError", ".", ".", ".", "."]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": self.config.aws_region,
                        "title": "API Gateway Metrics",
                        "period": 300
                    }
                }
            ]
        })
        
        dashboard = aws.cloudwatch.Dashboard(
            self.config.get_resource_name('cloudwatch-dashboard', 'main'),
            dashboard_name=self.config.get_resource_name('cloudwatch-dashboard', 'main'),
            dashboard_body=dashboard_body.apply(lambda body: json.dumps(body)),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return dashboard
    
    def get_lambda_error_alarm_arn(self) -> pulumi.Output[str]:
        """Get Lambda error alarm ARN."""
        return self.alarms['lambda_errors'].arn
    
    def get_api_4xx_alarm_arn(self) -> pulumi.Output[str]:
        """Get API Gateway 4XX error alarm ARN."""
        return self.alarms['api_4xx_errors'].arn
    
    def get_api_5xx_alarm_arn(self) -> pulumi.Output[str]:
        """Get API Gateway 5XX error alarm ARN."""
        return self.alarms['api_5xx_errors'].arn
    
    def get_dashboard_url(self) -> pulumi.Output[str]:
        """Get CloudWatch dashboard URL."""
        return pulumi.Output.from_input(
            f"https://{self.config.aws_region}.console.aws.amazon.com/cloudwatch/home?region={self.config.aws_region}#dashboards:name={self.config.get_resource_name('cloudwatch-dashboard', 'main')}"
        )
