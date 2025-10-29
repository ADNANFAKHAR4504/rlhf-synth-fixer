"""
Monitoring infrastructure module.

This module creates CloudWatch logs, metrics, alarms, and SNS notifications
for comprehensive observability and alerting.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Creates and manages CloudWatch monitoring, alarms, and SNS notifications.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        asg_name: Output[str],
        scale_up_policy_arn: Output[str],
        scale_down_policy_arn: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            asg_name: Auto Scaling Group name
            scale_up_policy_arn: Scale-up policy ARN
            scale_down_policy_arn: Scale-down policy ARN
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.asg_name = asg_name
        self.scale_up_policy_arn = scale_up_policy_arn
        self.scale_down_policy_arn = scale_down_policy_arn
        self.parent = parent
        
        # Create SNS topic for alarms
        self.alarm_topic = self._create_alarm_topic()
        
        # Create CloudWatch log group
        self.log_group = self._create_log_group()
        
        # Create CloudWatch alarms
        self.cpu_high_alarm = self._create_cpu_high_alarm()
        self.cpu_low_alarm = self._create_cpu_low_alarm()
    
    def _create_alarm_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.
        
        Returns:
            SNS Topic
        """
        topic_name = self.config.get_resource_name('alarm-topic')
        
        topic = aws.sns.Topic(
            topic_name,
            name=topic_name,
            tags={
                **self.config.get_tags_for_resource('SNS-Topic'),
                'Name': topic_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        # Create email subscription if email is configured
        if self.config.alarm_email:
            subscription_name = self.config.get_resource_name('alarm-subscription')
            
            aws.sns.TopicSubscription(
                subscription_name,
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.alarm_email,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=topic
                )
            )
        
        return topic
    
    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for application logs.
        
        Returns:
            CloudWatch Log Group
        """
        log_group_name = self.config.get_resource_name('app-logs')
        
        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=f"/aws/ec2/{log_group_name}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_tags_for_resource('CloudWatch-LogGroup'),
                'Name': log_group_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        return log_group
    
    def _create_cpu_high_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.
        
        Returns:
            CloudWatch Metric Alarm
        """
        alarm_name = self.config.get_resource_name('cpu-high-alarm')
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=self.config.cpu_high_threshold,
            alarm_description=f'Triggers when CPU exceeds {self.config.cpu_high_threshold}%',
            alarm_actions=[
                self.scale_up_policy_arn,
                self.alarm_topic.arn
            ],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags={
                **self.config.get_tags_for_resource('CloudWatch-Alarm'),
                'Name': alarm_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        return alarm
    
    def _create_cpu_low_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for low CPU utilization.
        
        Returns:
            CloudWatch Metric Alarm
        """
        alarm_name = self.config.get_resource_name('cpu-low-alarm')
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='LessThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=self.config.cpu_low_threshold,
            alarm_description=f'Triggers when CPU falls below {self.config.cpu_low_threshold}%',
            alarm_actions=[
                self.scale_down_policy_arn,
                self.alarm_topic.arn
            ],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags={
                **self.config.get_tags_for_resource('CloudWatch-Alarm'),
                'Name': alarm_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        return alarm
    
    # Getter methods
    
    def get_alarm_topic_arn(self) -> Output[str]:
        """Get SNS alarm topic ARN."""
        return self.alarm_topic.arn
    
    def get_log_group_name(self) -> Output[str]:
        """Get CloudWatch Log Group name."""
        return self.log_group.name
    
    def get_log_group_arn(self) -> Output[str]:
        """Get CloudWatch Log Group ARN."""
        return self.log_group.arn
    
    def get_cpu_high_alarm_arn(self) -> Output[str]:
        """Get CPU high alarm ARN."""
        return self.cpu_high_alarm.arn
    
    def get_cpu_low_alarm_arn(self) -> Output[str]:
        """Get CPU low alarm ARN."""
        return self.cpu_low_alarm.arn
