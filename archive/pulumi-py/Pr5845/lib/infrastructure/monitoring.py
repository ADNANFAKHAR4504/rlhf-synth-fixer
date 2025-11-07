"""
Monitoring module.

This module creates and manages CloudWatch alarms with metric math
for Lambda error rates and DynamoDB throttling events.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """Manages CloudWatch alarms and monitoring."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the Monitoring stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        
        self._create_sns_topic()
        self._create_lambda_alarms()
        self._create_dynamodb_alarms()
    
    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms')
        
        self.sns_topic = aws.sns.Topic(
            'sns-topic-alarms',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions with metric math."""
        for function_name in ['api-handler', 's3-processor']:
            resource_name = self.config.get_resource_name(f'lambda-{function_name}')
            
            aws.cloudwatch.MetricAlarm(
                f'lambda-error-rate-alarm-{function_name}',
                name=self.config.get_resource_name(f'lambda-error-rate-{function_name}'),
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
                            dimensions={'FunctionName': resource_name}
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
                            dimensions={'FunctionName': resource_name}
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
                    'Name': self.config.get_resource_name(f'lambda-error-rate-{function_name}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
            )
    
    def _create_dynamodb_alarms(self):
        """Create CloudWatch alarms for DynamoDB throttling."""
        table_name = self.config.get_resource_name('table-data')
        
        aws.cloudwatch.MetricAlarm(
            'dynamodb-read-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-read-throttle'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ReadThrottleEvents',
            namespace='AWS/DynamoDB',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description='DynamoDB read throttling detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-read-throttle')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
        )
        
        aws.cloudwatch.MetricAlarm(
            'dynamodb-write-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-write-throttle'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='WriteThrottleEvents',
            namespace='AWS/DynamoDB',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description='DynamoDB write throttling detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-write-throttle')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
        )
    
    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn

