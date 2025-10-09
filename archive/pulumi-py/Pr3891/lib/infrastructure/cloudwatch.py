"""
CloudWatch module for the serverless infrastructure.

This module creates CloudWatch log groups, alarms, and monitoring
for Lambda functions, API Gateway, and DynamoDB.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import cloudwatch

from .config import InfrastructureConfig


class CloudWatchStack:
    """
    CloudWatch stack for managing logging and monitoring.
    
    Creates CloudWatch log groups, alarms, and monitoring
    for comprehensive observability of the serverless infrastructure.
    """
    
    def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any], api_gateway_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize CloudWatch stack.
        
        Args:
            config: Infrastructure configuration
            lambda_outputs: Lambda stack outputs for log group names
            api_gateway_outputs: API Gateway stack outputs for monitoring
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.lambda_outputs = lambda_outputs
        self.api_gateway_outputs = api_gateway_outputs
        
        # Create log groups
        self._create_log_groups()
        
        # Create CloudWatch alarms
        self._create_cloudwatch_alarms()
        
        # Create log metric filters
        self._create_log_metric_filters()
    
    def _create_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        # Main Lambda function log group
        self.main_lambda_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "main-lambda"),
            name=self.lambda_outputs['main_lambda_function_name'].apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 'main-lambda',
                'Purpose': 'Lambda function logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # S3 processor Lambda function log group
        self.s3_processor_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "s3-processor-lambda"),
            name=self.lambda_outputs['s3_processor_lambda_function_name'].apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 's3-processor-lambda',
                'Purpose': 'S3 processor Lambda logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # API Gateway log group
        self.api_gateway_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "api-gateway"),
            name=self.api_gateway_outputs['api_gateway_id'].apply(lambda id: f"/aws/apigateway/{id}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 'api-gateway',
                'Purpose': 'API Gateway logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring."""
        # Lambda function error alarm
        self.lambda_error_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "lambda-errors"),
            name=self.config.get_naming_convention("alarm", "lambda-errors"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors",
            alarm_actions=[],
            dimensions={
                "FunctionName": self.lambda_outputs['main_lambda_function_name']
            },
            tags=self.config.get_tags({
                'AlarmName': 'lambda-errors',
                'Purpose': 'Lambda error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Lambda function duration alarm
        self.lambda_duration_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "lambda-duration"),
            name=self.config.get_naming_convention("alarm", "lambda-duration"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds in milliseconds
            alarm_description="Lambda function duration",
            alarm_actions=[],
            dimensions={
                "FunctionName": self.lambda_outputs['main_lambda_function_name']
            },
            tags=self.config.get_tags({
                'AlarmName': 'lambda-duration',
                'Purpose': 'Lambda performance monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # API Gateway 4XX error alarm
        self.api_gateway_4xx_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-4xx"),
            name=self.config.get_naming_convention("alarm", "api-gateway-4xx"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX errors",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-4xx',
                'Purpose': 'API Gateway error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # API Gateway 5XX error alarm
        self.api_gateway_5xx_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-5xx"),
            name=self.config.get_naming_convention("alarm", "api-gateway-5xx"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="API Gateway 5XX errors",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-5xx',
                'Purpose': 'API Gateway error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # API Gateway latency alarm
        self.api_gateway_latency_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-latency"),
            name=self.config.get_naming_convention("alarm", "api-gateway-latency"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=2000,  # 2 seconds in milliseconds
            alarm_description="API Gateway latency",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-latency',
                'Purpose': 'API Gateway performance monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_log_metric_filters(self):
        """Create CloudWatch log metric filters for custom metrics."""
        # Lambda function error filter
        self.lambda_error_filter = cloudwatch.LogMetricFilter(
            self.config.get_naming_convention("metric-filter", "lambda-errors"),
            name=self.config.get_naming_convention("metric-filter", "lambda-errors"),
            log_group_name=self.main_lambda_log_group.name,
            pattern="ERROR",
            metric_transformation={
                "name": "LambdaErrorCount",
                "namespace": "Custom/Lambda",
                "value": "1"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # API Gateway error filter
        self.api_gateway_error_filter = cloudwatch.LogMetricFilter(
            self.config.get_naming_convention("metric-filter", "api-gateway-errors"),
            name=self.config.get_naming_convention("metric-filter", "api-gateway-errors"),
            log_group_name=self.api_gateway_log_group.name,
            pattern="ERROR",
            metric_transformation={
                "name": "ApiGatewayErrorCount",
                "namespace": "Custom/ApiGateway",
                "value": "1"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """
        Get CloudWatch stack outputs.
        
        Returns:
            Dictionary containing CloudWatch outputs
        """
        return {
            "main_lambda_log_group_name": self.main_lambda_log_group.name,
            "s3_processor_log_group_name": self.s3_processor_log_group.name,
            "api_gateway_log_group_name": self.api_gateway_log_group.name,
            "lambda_error_alarm_name": self.lambda_error_alarm.name,
            "lambda_duration_alarm_name": self.lambda_duration_alarm.name,
            "api_gateway_4xx_alarm_name": self.api_gateway_4xx_alarm.name,
            "api_gateway_5xx_alarm_name": self.api_gateway_5xx_alarm.name,
            "api_gateway_latency_alarm_name": self.api_gateway_latency_alarm.name,
            "lambda_error_filter_name": self.lambda_error_filter.name,
            "api_gateway_error_filter_name": self.api_gateway_error_filter.name
        }
