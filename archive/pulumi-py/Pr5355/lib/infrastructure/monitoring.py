"""
Monitoring module for the serverless financial data pipeline.

This module creates CloudWatch log groups and alarms for Lambda functions
and DynamoDB tables.

Addresses Model Failures:
- CloudWatch alarm semantics for >1% error rate (use metric math for percentage)
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the financial data pipeline.
    
    Creates log groups and alarms for Lambda functions and DynamoDB.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        
        self.log_groups = {}
        self.alarms = {}
        
        self._create_log_groups()
        self._create_lambda_error_alarms()
        self._create_dynamodb_throttle_alarm()
    
    def _create_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        function_names = ['upload', 'status', 'results', 'processor']
        
        for function_name in function_names:
            log_group_name = f"/aws/lambda/{self.config.get_resource_name(function_name)}"
            
            log_group = aws.cloudwatch.LogGroup(
                f"{function_name}-log-group",
                name=log_group_name,
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            
            self.log_groups[function_name] = log_group
    
    def _create_lambda_error_alarms(self):
        """
        Create CloudWatch alarms for Lambda error rates exceeding 1%.
        
        Addresses Model Failure 7: Use metric math to compute error rate percentage.
        """
        function_names = ['upload', 'status', 'results', 'processor']
        
        for function_name in function_names:
            function_resource_name = self.config.get_resource_name(function_name)
            alarm_name = self.config.get_resource_name(f'{function_name}-error-rate-alarm')
            
            alarm = aws.cloudwatch.MetricAlarm(
                f"{function_name}-error-alarm",
                name=alarm_name,
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                threshold=1.0,
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
                            period=300,
                            stat="Sum",
                            dimensions={
                                "FunctionName": function_resource_name
                            }
                        )
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="invocations",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Invocations",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={
                                "FunctionName": function_resource_name
                            }
                        )
                    )
                ],
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            
            self.alarms[f"{function_name}-error"] = alarm
    
    def _create_dynamodb_throttle_alarm(self):
        """Create CloudWatch alarm for DynamoDB throttling events."""
        table_name = self.config.get_resource_name('market-data')
        alarm_name = self.config.get_resource_name('dynamodb-throttle-alarm')
        
        alarm = aws.cloudwatch.MetricAlarm(
            "dynamodb-throttle-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            treat_missing_data="notBreaching",
            dimensions={
                "TableName": table_name
            },
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.alarms['dynamodb-throttle'] = alarm
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name for a function."""
        return self.log_groups[function_name].name
    
    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN for a function."""
        return self.log_groups[function_name].arn




