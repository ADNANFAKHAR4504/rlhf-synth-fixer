"""
Monitoring module for CloudWatch and SNS.

This module creates CloudWatch alarms, dashboards, and SNS topics
for monitoring CI/CD pipeline health and sending notifications.
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class MonitoringStack:
    """
    Manages CloudWatch and SNS resources for monitoring.
    
    Creates SNS topics, CloudWatch alarms, and dashboards for
    monitoring pipeline health and sending notifications.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.sns_topics: Dict[str, aws.sns.Topic] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.dashboard: Optional[aws.cloudwatch.Dashboard] = None
        
        self._create_sns_topics()
    
    def _create_sns_topics(self):
        """Create SNS topics for notifications."""
        topic_name = self.config.get_resource_name('pipeline-notifications')
        
        topic = aws.sns.Topic(
            'pipeline-notifications-topic',
            name=topic_name,
            display_name='CI/CD Pipeline Notifications',
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        if self.config.notification_email:
            aws.sns.TopicSubscription(
                'pipeline-notifications-email-subscription',
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.notification_email,
                opts=self.provider_manager.get_resource_options()
            )
        
        self.sns_topics['pipeline-notifications'] = topic
    
    def create_pipeline_alarms(self, pipeline_name: Output[str]):
        """
        Create CloudWatch alarms for pipeline failures.
        
        Args:
            pipeline_name: Pipeline name Output
        """
        alarm_name = self.config.get_resource_name('pipeline-failure-alarm')
        
        pipeline_name.apply(lambda name: 
            aws.cloudwatch.MetricAlarm(
                'pipeline-failure-alarm',
                name=alarm_name,
                alarm_description=f'Alarm for {self.config.project_name} pipeline failures',
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=1,
                metric_name='PipelineExecutionFailure',
                namespace='AWS/CodePipeline',
                period=300,
                statistic='Sum',
                threshold=1,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'PipelineName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        )
    
    def create_codebuild_alarms(self, project_name: str, codebuild_project_name: Output[str]):
        """
        Create CloudWatch alarms for CodeBuild failures.
        
        Args:
            project_name: Logical project name
            codebuild_project_name: CodeBuild project name Output
        """
        alarm_name = self.config.get_resource_name(f'{project_name}-build-failure-alarm')
        
        codebuild_project_name.apply(lambda name:
            aws.cloudwatch.MetricAlarm(
                f'{project_name}-build-failure-alarm',
                name=alarm_name,
                alarm_description=f'Alarm for {project_name} build failures',
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=1,
                metric_name='FailedBuilds',
                namespace='AWS/CodeBuild',
                period=300,
                statistic='Sum',
                threshold=1,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'ProjectName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        )
    
    def create_lambda_alarms(self, function_name: str, lambda_function_name: Output[str]):
        """
        Create CloudWatch alarms for Lambda errors.
        
        Args:
            function_name: Logical function name
            lambda_function_name: Lambda function name Output
        """
        error_alarm_name = self.config.get_resource_name(f'{function_name}-error-alarm')
        throttle_alarm_name = self.config.get_resource_name(f'{function_name}-throttle-alarm')
        
        lambda_function_name.apply(lambda name: [
            aws.cloudwatch.MetricAlarm(
                f'{function_name}-error-alarm',
                name=error_alarm_name,
                alarm_description=f'Alarm for {function_name} errors',
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=2,
                threshold=5,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
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
                            dimensions={'FunctionName': name}
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
                            dimensions={'FunctionName': name}
                        ),
                        return_data=False
                    )
                ],
                tags={
                    **self.config.get_common_tags(),
                    'Name': error_alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            ),
            aws.cloudwatch.MetricAlarm(
                f'{function_name}-throttle-alarm',
                name=throttle_alarm_name,
                alarm_description=f'Alarm for {function_name} throttles',
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=1,
                metric_name='Throttles',
                namespace='AWS/Lambda',
                period=300,
                statistic='Sum',
                threshold=10,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'FunctionName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': throttle_alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        ])
    
    def create_dashboard(self, pipeline_name: Output[str], codebuild_projects: Dict[str, Output[str]], lambda_functions: Dict[str, Output[str]]):
        """
        Create CloudWatch dashboard for monitoring.
        
        Args:
            pipeline_name: Pipeline name Output
            codebuild_projects: Dict of CodeBuild project names
            lambda_functions: Dict of Lambda function names
        """
        dashboard_name = self.config.get_resource_name('cicd-dashboard')
        
        aws.cloudwatch.Dashboard(
            'cicd-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=pulumi.Output.json_dumps({
                    'widgets': [
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Pipeline Executions',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/CodePipeline', 'PipelineExecutionSuccess', {'stat': 'Sum', 'label': 'Success'}],
                                    ['.', 'PipelineExecutionFailure', {'stat': 'Sum', 'label': 'Failure'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        },
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Build Status',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/CodeBuild', 'SuccessfulBuilds', {'stat': 'Sum', 'label': 'Success'}],
                                    ['.', 'FailedBuilds', {'stat': 'Sum', 'label': 'Failed'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        },
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Lambda Invocations',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/Lambda', 'Invocations', {'stat': 'Sum'}],
                                    ['.', 'Errors', {'stat': 'Sum'}],
                                    ['.', 'Throttles', {'stat': 'Sum'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        }
                    ]
                }),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_sns_topic(self, topic_name: str) -> aws.sns.Topic:
        """Get SNS topic by name."""
        return self.sns_topics.get(topic_name)
    
    def get_sns_topic_arn(self, topic_name: str) -> Output[str]:
        """Get SNS topic ARN."""
        topic = self.sns_topics.get(topic_name)
        return topic.arn if topic else Output.from_input('')

