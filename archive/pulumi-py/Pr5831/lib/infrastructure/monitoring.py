"""
Monitoring module for CloudWatch alarms and metrics.

This module creates CloudWatch alarms for monitoring Lambda functions
and API Gateway with proper metric math for error rates.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the serverless processor.
    
    Creates CloudWatch alarms with metric math for error rate monitoring
    and SNS topics for alarm notifications.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance for Lambda monitoring
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None
        
        self._create_sns_topic()
        self._create_lambda_alarms()
    
    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms-topic')
        
        self.sns_topic = aws.sns.Topic(
            'alarms-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        self._create_lambda_error_rate_alarm('processor')
        self._create_lambda_duration_alarm('processor')
    
    def _create_lambda_error_rate_alarm(self, function_name: str):
        """
        Create error rate alarm using metric math.
        
        Args:
            function_name: Name of the Lambda function
        """
        alarm_name = self.config.get_resource_name(f'{function_name}-error-rate')
        function_resource_name = self.config.get_resource_name(function_name)
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-rate-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            threshold=1.0,
            alarm_description=f'Error rate > 1% for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            treat_missing_data='notBreaching',
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='errors',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Errors',
                        namespace='AWS/Lambda',
                        period=300,
                        stat='Sum',
                        dimensions={
                            'FunctionName': function_resource_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='invocations',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Invocations',
                        namespace='AWS/Lambda',
                        period=300,
                        stat='Sum',
                        dimensions={
                            'FunctionName': function_resource_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='(errors / invocations) * 100',
                    label='Error Rate (%)',
                    return_data=True
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.alarms[f'{function_name}-error-rate'] = alarm
    
    def _create_lambda_duration_alarm(self, function_name: str):
        """
        Create duration alarm for Lambda function.
        
        Args:
            function_name: Name of the Lambda function
        """
        alarm_name = self.config.get_resource_name(f'{function_name}-duration')
        function_resource_name = self.config.get_resource_name(function_name)
        
        threshold = self.config.lambda_timeout * 1000 * 0.8
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=300,
            statistic='Average',
            threshold=threshold,
            alarm_description=f'Duration > 80% of timeout ({threshold}ms) for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.alarms[f'{function_name}-duration'] = alarm
    
    def get_sns_topic_arn(self) -> Output[str]:
        """
        Get SNS topic ARN.
        
        Returns:
            SNS topic ARN as Output
        """
        return self.sns_topic.arn
    
    def get_alarm_name(self, alarm_key: str) -> Output[str]:
        """
        Get CloudWatch alarm name.
        
        Args:
            alarm_key: Key identifying the alarm
            
        Returns:
            Alarm name as Output
        """
        return self.alarms[alarm_key].name

