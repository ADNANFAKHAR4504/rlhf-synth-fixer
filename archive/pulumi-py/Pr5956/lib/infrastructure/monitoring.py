"""
Monitoring module for CloudWatch alarms and SNS notifications.

This module creates CloudWatch alarms for Lambda functions and pipeline
with SNS topic for notifications.
"""

import json
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig
from .kms import KMSStack


class MonitoringStack:
    """
    Manages monitoring resources including CloudWatch alarms and SNS topics.
    
    Creates SNS topics for notifications and CloudWatch alarms for
    Lambda functions and pipeline failures.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.sns_topics: Dict[str, aws.sns.Topic] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        
        self._create_sns_topic()
    
    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('notifications')
        
        sns_key = self.kms_stack.get_key('sns')
        
        topic = aws.sns.Topic(
            'notifications-topic',
            name=topic_name,
            kms_master_key_id=sns_key.id,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name,
                'Purpose': 'Alarm notifications'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[sns_key])
        )
        
        account_id = aws.get_caller_identity().account_id
        
        topic_policy = Output.all(topic.arn, account_id).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'AllowCloudWatchAlarms',
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': 'cloudwatch.amazonaws.com'
                        },
                        'Action': [
                            'SNS:Publish'
                        ],
                        'Resource': args[0],
                        'Condition': {
                            'StringEquals': {
                                'aws:SourceAccount': args[1]
                            }
                        }
                    }
                ]
            })
        )
        
        aws.sns.TopicPolicy(
            'notifications-topic-policy',
            arn=topic.arn,
            policy=topic_policy,
            opts=self.provider_manager.get_resource_options(depends_on=[topic])
        )
        
        self.sns_topics['notifications'] = topic
    
    def create_lambda_alarm(
        self,
        function_name: str,
        lambda_function_name: Output[str]
    ):
        """
        Create CloudWatch alarm for Lambda function errors.
        
        Args:
            function_name: Logical name of the function
            lambda_function_name: Actual Lambda function name
        """
        alarm_name = self.config.get_resource_name(f'{function_name}-errors')
        
        topic = self.sns_topics['notifications']
        
        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            threshold=self.config.alarm_threshold,
            alarm_description=f'Alarm when {function_name} Lambda function has errors',
            treat_missing_data='notBreaching',
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='errors / invocations * 100',
                    label='Error Rate',
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='errors',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Errors',
                        namespace='AWS/Lambda',
                        period=300,
                        stat='Sum',
                        dimensions=lambda_function_name.apply(
                            lambda name: {'FunctionName': name}
                        )
                    )
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='invocations',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Invocations',
                        namespace='AWS/Lambda',
                        period=300,
                        stat='Sum',
                        dimensions=lambda_function_name.apply(
                            lambda name: {'FunctionName': name}
                        )
                    )
                )
            ],
            alarm_actions=[topic.arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[topic])
        )
        
        self.alarms[f'{function_name}-errors'] = alarm
    
    def create_pipeline_alarm(self, pipeline_name: Output[str]):
        """
        Create CloudWatch alarm for pipeline failures.
        
        Args:
            pipeline_name: Name of the pipeline
        """
        alarm_name = self.config.get_resource_name('pipeline-failures')
        
        topic = self.sns_topics['notifications']
        
        alarm = aws.cloudwatch.MetricAlarm(
            'pipeline-failure-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='PipelineExecutionFailure',
            namespace='AWS/CodePipeline',
            period=300,
            statistic='Sum',
            threshold=0,
            alarm_description='Alarm when pipeline execution fails',
            treat_missing_data='notBreaching',
            dimensions=pipeline_name.apply(
                lambda name: {'PipelineName': name}
            ),
            alarm_actions=[topic.arn],
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[topic])
        )
        
        self.alarms['pipeline-failures'] = alarm
    
    def get_sns_topic(self, topic_name: str) -> aws.sns.Topic:
        """
        Get an SNS topic by name.
        
        Args:
            topic_name: Name of the topic
            
        Returns:
            SNS Topic resource
        """
        if topic_name not in self.sns_topics:
            raise ValueError(f"SNS topic '{topic_name}' not found")
        return self.sns_topics[topic_name]
    
    def get_sns_topic_arn(self, topic_name: str) -> Output[str]:
        """
        Get the ARN of an SNS topic.
        
        Args:
            topic_name: Name of the topic
            
        Returns:
            Topic ARN as Output[str]
        """
        return self.get_sns_topic(topic_name).arn

