"""
Monitoring module for CloudWatch logs, alarms, and dashboards.

This module creates CloudWatch monitoring resources for transaction processing.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring resources.
    
    Creates SNS topics, alarms, and dashboards.
    """
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None
        self.dashboard = None
        
        self._create_sns_topic()
        self._create_lambda_alarms()
        self._create_dynamodb_alarms()
        self._create_dashboard()
    
    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms-topic')
        
        self.sns_topic = aws.sns.Topic(
            'alarm-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        for function_name in ['transaction-validator', 'analytics-processor', 'reporting-processor', 'notification-handler']:
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
    
    def _create_dynamodb_alarms(self):
        """Create CloudWatch alarms for DynamoDB tables."""
        table_name = self.config.get_resource_name('transactions-table')
        
        read_throttle_alarm = aws.cloudwatch.MetricAlarm(
            'dynamodb-read-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-read-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ReadThrottleEvents',
            namespace='AWS/DynamoDB',
            period=300,
            statistic='Sum',
            threshold=10,
            alarm_description='DynamoDB read throttle events detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-read-throttles')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.alarms['dynamodb-read-throttle'] = read_throttle_alarm
    
    def _create_dashboard(self):
        """Create CloudWatch dashboard."""
        dashboard_name = self.config.get_resource_name('dashboard')
        
        dashboard_body = Output.all(
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
                            ['AWS/Lambda', 'Duration', {'stat': 'Average'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[0],
                        'title': 'Lambda Metrics',
                        'period': 300
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
                            ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', {'stat': 'Sum'}],
                            ['AWS/DynamoDB', 'ConsumedWriteCapacityUnits', {'stat': 'Sum'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[0],
                        'title': 'DynamoDB Capacity',
                        'period': 300
                    }
                }
            ]
        })
        
        self.dashboard = aws.cloudwatch.Dashboard(
            'transaction-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: pulumi.Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn if self.sns_topic else Output.from_input('')

