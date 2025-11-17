"""
Monitoring module for CloudWatch logs, alarms, and dashboards.

This module creates CloudWatch log groups with proper retention,
error rate alarms using metric math, and dashboards for visualization.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring resources.
    
    Creates log groups, error rate alarms, and dashboards.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None
        
        self._create_sns_topic()
        self._create_lambda_log_groups()
        self._create_lambda_alarms()
        self._create_dashboard()
    
    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms')
        
        self.sns_topic = aws.sns.Topic(
            'alarm-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_lambda_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        function_name = 'pipeline-handler'
        log_group_name = f'/aws/lambda/{self.config.get_resource_name(function_name)}'
        
        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.log_groups[function_name] = log_group
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions with error rate metrics."""
        function_name = 'pipeline-handler'
        
        function_resource_name = self.config.get_resource_name(function_name)
        
        error_rate_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-rate-alarm',
            name=self.config.get_resource_name(f'{function_name}-error-rate'),
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
                'Name': self.config.get_resource_name(f'{function_name}-error-rate')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.alarms[f'{function_name}-error-rate'] = error_rate_alarm
        
        throttle_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=self.config.get_resource_name(f'{function_name}-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=5,
            alarm_description=f'Throttles detected for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-throttles')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.alarms[f'{function_name}-throttle'] = throttle_alarm
    
    def _create_dashboard(self):
        """Create CloudWatch dashboard for Lambda metrics."""
        dashboard_name = self.config.get_resource_name('dashboard')
        function_name = 'pipeline-handler'
        function_resource_name = self.config.get_resource_name(function_name)
        
        dashboard_body = Output.all(
            function_resource_name,
            self.config.primary_region
        ).apply(lambda args: {
            'widgets': [
                {
                    'type': 'metric',
                    'x': 0,
                    'y': 0,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Errors', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Throttles', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Duration', {'stat': 'Average'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Metrics - {args[0]}',
                        'period': 300,
                        'yAxis': {'left': {'label': 'Count'}}
                    }
                },
                {
                    'type': 'metric',
                    'x': 12,
                    'y': 0,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            [{'expression': '(m1 / m2) * 100', 'label': 'Error Rate (%)', 'id': 'e1'}],
                            ['AWS/Lambda', 'Errors', {'id': 'm1', 'visible': False}],
                            ['AWS/Lambda', 'Invocations', {'id': 'm2', 'visible': False}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': 'Error Rate %',
                        'period': 300,
                        'yAxis': {'left': {'label': 'Percent'}}
                    }
                }
            ]
        })
        
        dashboard = aws.cloudwatch.Dashboard(
            'lambda-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: pulumi.Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """Get log group by function name."""
        return self.log_groups.get(function_name)
    
    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name."""
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else Output.from_input('')
    
    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN."""
        log_group = self.log_groups.get(function_name)
        return log_group.arn if log_group else Output.from_input('')
    
    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn if self.sns_topic else Output.from_input('')

