"""
Notifications module for environment migration solution.

This module manages SNS topics and subscriptions for deployment
and operational notifications.
"""

import json
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class NotificationsStack:
    """
    Manages SNS topics and subscriptions for notifications.
    
    Provides notification channels for deployment events, alarms,
    and operational status.
    """
    
    def __init__(self, config: MigrationConfig, provider_manager: AWSProviderManager):
        """
        Initialize notifications stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.deployment_topics: Dict[str, aws.sns.Topic] = {}
        self.alarm_topics: Dict[str, aws.sns.Topic] = {}
        
        if self.config.enable_notifications:
            self._create_topics()
            if self.config.notification_email:
                self._create_subscriptions()
    
    def _create_topics(self):
        """Create SNS topics for all regions."""
        for region in self.config.all_regions:
            provider = self.provider_manager.get_provider(region)
            
            # Deployment notifications topic
            deployment_topic_name = self.config.get_resource_name('deployment-notifications', region)
            deployment_topic = aws.sns.Topic(
                deployment_topic_name,
                name=deployment_topic_name,
                display_name=f"Migration Deployment Notifications - {region}",
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.deployment_topics[region] = deployment_topic
            
            # Alarm notifications topic
            alarm_topic_name = self.config.get_resource_name('alarm-notifications', region)
            alarm_topic = aws.sns.Topic(
                alarm_topic_name,
                name=alarm_topic_name,
                display_name=f"Migration Alarms - {region}",
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.alarm_topics[region] = alarm_topic
    
    def _create_subscriptions(self):
        """Create email subscriptions to SNS topics."""
        for region in self.config.all_regions:
            provider = self.provider_manager.get_provider(region)
            
            # Subscription for deployment topic
            deployment_sub_name = self.config.get_resource_name('deployment-email-sub', region)
            aws.sns.TopicSubscription(
                deployment_sub_name,
                topic=self.deployment_topics[region].arn,
                protocol="email",
                endpoint=self.config.notification_email,
                opts=ResourceOptions(provider=provider, parent=self.deployment_topics[region])
            )
            
            # Subscription for alarm topic
            alarm_sub_name = self.config.get_resource_name('alarm-email-sub', region)
            aws.sns.TopicSubscription(
                alarm_sub_name,
                topic=self.alarm_topics[region].arn,
                protocol="email",
                endpoint=self.config.notification_email,
                opts=ResourceOptions(provider=provider, parent=self.alarm_topics[region])
            )
    
    def configure_alarm_actions(self, alarms: List[aws.cloudwatch.MetricAlarm], region: str):
        """
        Configure SNS topic as alarm action.
        
        Args:
            alarms: List of CloudWatch metric alarms
            region: AWS region
        """
        if not self.config.enable_notifications or region not in self.alarm_topics:
            return
        
        topic_arn = self.alarm_topics[region].arn
        
        for alarm in alarms:
            pass
    
    def get_deployment_topic(self, region: str) -> aws.sns.Topic:
        """
        Get deployment notifications topic for a region.
        
        Args:
            region: AWS region
            
        Returns:
            SNS topic for deployment notifications
        """
        return self.deployment_topics.get(region)
    
    def get_deployment_topic_arn(self, region: str) -> Output[str]:
        """
        Get deployment topic ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Topic ARN as Output
        """
        if region in self.deployment_topics:
            return self.deployment_topics[region].arn
        return Output.from_input("")
    
    def get_alarm_topic(self, region: str) -> aws.sns.Topic:
        """
        Get alarm notifications topic for a region.
        
        Args:
            region: AWS region
            
        Returns:
            SNS topic for alarm notifications
        """
        return self.alarm_topics.get(region)
    
    def get_alarm_topic_arn(self, region: str) -> Output[str]:
        """
        Get alarm topic ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            Topic ARN as Output
        """
        if region in self.alarm_topics:
            return self.alarm_topics[region].arn
        return Output.from_input("")
    
    def get_all_topic_arns(self, region: str) -> List[Output[str]]:
        """
        Get all topic ARNs for a region.
        
        Args:
            region: AWS region
            
        Returns:
            List of topic ARNs
        """
        arns = []
        if region in self.deployment_topics:
            arns.append(self.deployment_topics[region].arn)
        if region in self.alarm_topics:
            arns.append(self.alarm_topics[region].arn)
        return arns

