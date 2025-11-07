"""
Monitoring module.

This module creates CloudWatch alarms, SNS topics, and dashboards
for monitoring the file upload system.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .step_functions import StepFunctionsStack


class MonitoringStack:
    """
    Manages monitoring resources.
    
    Creates:
    - SNS topics for notifications
    - CloudWatch alarms with metric math for error rates
    - CloudWatch dashboards
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the Monitoring stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.lambda_stack = None
        self.step_functions_stack = None
        self.sns_topic = None
        self.alarms = {}
        self.dashboard = None
        
        self._create_sns_topic()
    
    def _create_sns_topic(self):
        """Create SNS topic for notifications."""
        topic_name = 'notifications'
        resource_name = self.config.get_resource_name(topic_name)
        
        sns_key = self.kms_stack.get_key('sns')
        
        self.sns_topic = aws.sns.Topic(
            topic_name,
            name=resource_name,
            display_name='File Upload Notifications',
            kms_master_key_id=sns_key.id,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File upload notifications'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[sns_key])
        )
    
    def _create_lambda_alarms_for_stack(self, lambda_stack):
        """
        Create CloudWatch alarms for Lambda functions.
        
        Args:
            lambda_stack: LambdaStack instance
        """
        self.lambda_stack = lambda_stack
        self._create_lambda_alarms()
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        if not self.lambda_stack:
            return
            
        function_name = 'file-processor'
        function = self.lambda_stack.get_function(function_name)
        function_resource_name = self.lambda_stack.get_function_name(function_name)
        
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
                        dimensions={'FunctionName': function_resource_name}
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
                        dimensions={'FunctionName': function_resource_name}
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='(errors / invocations) * 100',
                    label='Error Rate',
                    return_data=True
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-error-rate')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )
        
        self.alarms[f'{function_name}-error-rate'] = error_rate_alarm
        
        throttle_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=self.config.get_resource_name(f'{function_name}-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=10,
            alarm_description=f'Throttles > 10 for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-throttles')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )
        
        self.alarms[f'{function_name}-throttles'] = throttle_alarm
        
        duration_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=self.config.get_resource_name(f'{function_name}-duration'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=300,
            statistic='Average',
            threshold=self.config.lambda_timeout * 1000 * 0.8,
            alarm_description=f'Duration > 80% of timeout for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-duration')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )
        
        self.alarms[f'{function_name}-duration'] = duration_alarm
    
    def _create_dashboard_for_stack(self, lambda_stack):
        """
        Create CloudWatch dashboard for Lambda functions.
        
        Args:
            lambda_stack: LambdaStack instance
        """
        self.lambda_stack = lambda_stack
        self._create_dashboard()
    
    def _create_dashboard(self):
        """Create CloudWatch dashboard."""
        if not self.lambda_stack:
            return
            
        dashboard_name = self.config.get_resource_name('dashboard')
        function_name = 'file-processor'
        function_resource_name = self.lambda_stack.get_function_name(function_name)
        
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
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum', 'label': 'Invocations'}],
                            ['.', 'Errors', {'stat': 'Sum', 'label': 'Errors'}],
                            ['.', 'Throttles', {'stat': 'Sum', 'label': 'Throttles'}],
                            ['.', 'Duration', {'stat': 'Average', 'label': 'Avg Duration (ms)'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Metrics - {args[0]}',
                        'period': 300,
                        'yAxis': {
                            'left': {
                                'label': 'Count / Duration'
                            }
                        }
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
                            ['AWS/Lambda', 'ConcurrentExecutions', {'stat': 'Maximum', 'label': 'Concurrent Executions'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Concurrency - {args[0]}',
                        'period': 300
                    }
                }
            ]
        })
        
        self.dashboard = aws.cloudwatch.Dashboard(
            'dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_sns_topic_arn(self) -> Output[str]:
        """
        Get the SNS topic ARN.
        
        Returns:
            SNS topic ARN as Output
        """
        return self.sns_topic.arn if self.sns_topic else None

