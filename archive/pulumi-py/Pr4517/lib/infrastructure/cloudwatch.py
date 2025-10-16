"""
CloudWatch monitoring and alerting for the event processing pipeline.

This module creates CloudWatch alarms with SNS notifications
and proper thresholds for operational observability.
"""

from typing import Dict, List, Optional

import pulumi
from pulumi_aws import cloudwatch, sns

from aws_provider import AWSProviderManager
from config import PipelineConfig
from dynamodb import DynamoDBStack
from lambda_functions import LambdaStack


class CloudWatchStack:
    """Creates CloudWatch alarms and SNS notifications."""
    
    def __init__(self, config: PipelineConfig, provider_manager: AWSProviderManager, 
                 lambda_stack: LambdaStack, dynamodb_stack: DynamoDBStack):
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        self.sns_topics: Dict[str, sns.Topic] = {}
        self.alarms: Dict[str, cloudwatch.MetricAlarm] = {}
        
        self._create_sns_topics()
        self._create_lambda_alarms()
        self._create_dynamodb_alarms()
        self._create_custom_metric_alarms()
    
    def _create_sns_topics(self):
        """Create SNS topics for alerting."""
        for region in self.config.regions:
            topic_name = self.config.get_resource_name('trading-alerts', region)
            
            self.sns_topics[region] = sns.Topic(
                f"trading-alerts-{region}",
                name=topic_name,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Add email subscription if configured
            if self.config.sns_email_endpoint:
                sns.TopicSubscription(
                    f"email-subscription-{region}",
                    topic=self.sns_topics[region].arn,
                    protocol="email",
                    endpoint=self.config.sns_email_endpoint,
                    opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
                )
    
    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        for region in self.config.regions:
            # Lambda error rate alarm
            self.alarms[f'lambda-errors-{region}'] = cloudwatch.MetricAlarm(
                f"lambda-errors-{region}",
                name=self.config.get_resource_name('lambda-errors-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,  # 5 minutes
                statistic="Sum",
                threshold=5,  # Alert if more than 5 errors in 5 minutes
                alarm_description="Lambda function error rate is high",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "FunctionName": self.lambda_stack.get_function_name(region)
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Lambda duration alarm
            self.alarms[f'lambda-duration-{region}'] = cloudwatch.MetricAlarm(
                f"lambda-duration-{region}",
                name=self.config.get_resource_name('lambda-duration-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Duration",
                namespace="AWS/Lambda",
                period=300,
                statistic="Average",
                threshold=10000,  # 10 seconds
                alarm_description="Lambda function duration is high",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "FunctionName": self.lambda_stack.get_function_name(region)
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Lambda throttles alarm
            self.alarms[f'lambda-throttles-{region}'] = cloudwatch.MetricAlarm(
                f"lambda-throttles-{region}",
                name=self.config.get_resource_name('lambda-throttles-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Throttles",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=1,
                alarm_description="Lambda function is being throttled",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "FunctionName": self.lambda_stack.get_function_name(region)
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_dynamodb_alarms(self):
        """Create CloudWatch alarms for DynamoDB tables."""
        for region in self.config.regions:
            # DynamoDB throttled requests alarm
            self.alarms[f'dynamodb-throttles-{region}'] = cloudwatch.MetricAlarm(
                f"dynamodb-throttles-{region}",
                name=self.config.get_resource_name('dynamodb-throttles-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="ThrottledRequests",
                namespace="AWS/DynamoDB",
                period=300,
                statistic="Sum",
                threshold=1,
                alarm_description="DynamoDB table is being throttled",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "TableName": self.dynamodb_stack.get_table_name(region)
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # DynamoDB consumed read capacity alarm
            self.alarms[f'dynamodb-read-capacity-{region}'] = cloudwatch.MetricAlarm(
                f"dynamodb-read-capacity-{region}",
                name=self.config.get_resource_name('dynamodb-read-capacity-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="ConsumedReadCapacityUnits",
                namespace="AWS/DynamoDB",
                period=300,
                statistic="Sum",
                threshold=1000,  # Adjust based on your capacity
                alarm_description="DynamoDB read capacity consumption is high",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "TableName": self.dynamodb_stack.get_table_name(region)
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_custom_metric_alarms(self):
        """Create alarms for custom metrics."""
        for region in self.config.regions:
            # Event processing failure rate alarm
            self.alarms[f'event-processing-failures-{region}'] = cloudwatch.MetricAlarm(
                f"event-processing-failures-{region}",
                name=self.config.get_resource_name('event-processing-failures-alarm', region),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="EventsProcessed",
                namespace="TradingPlatform/EventProcessing",
                period=300,
                statistic="Sum",
                threshold=10,  # Alert if more than 10 failures in 5 minutes
                alarm_description="Event processing failure rate is high",
                alarm_actions=[self.sns_topics[region].arn],
                ok_actions=[self.sns_topics[region].arn],
                dimensions={
                    "EventType": "error",
                    "Status": "failure",
                    "Region": region
                },
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def get_sns_topic_arn(self, region: str) -> pulumi.Output[str]:
        """Get SNS topic ARN for a region."""
        return self.sns_topics[region].arn
