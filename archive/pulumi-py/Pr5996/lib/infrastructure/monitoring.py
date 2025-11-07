"""
Monitoring infrastructure module.

This module creates CloudWatch alarms and SNS topics for notifications.

"""

import pulumi_aws as aws
from pulumi import Output


class MonitoringStack:
    """
    Monitoring stack that creates CloudWatch alarms and SNS notifications.
    
    Creates:
    - SNS topic for alarm notifications
    - CloudWatch alarms for EC2 instances
    - CloudWatch alarms for NAT Gateways
    """
    
    def __init__(self, config, provider_manager, ec2_instances, nat_gateway_ids, parent=None):
        """
        Initialize the monitoring stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            ec2_instances: List of EC2 instance resources
            nat_gateway_ids: List of NAT Gateway IDs
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.ec2_instances = ec2_instances
        self.nat_gateway_ids = nat_gateway_ids
        self.parent = parent
        
        # Create SNS topic for alarm notifications
        self.sns_topic = self._create_sns_topic()
        
        # Create CloudWatch alarms for EC2 instances
        self.ec2_alarms = self._create_ec2_alarms()
        
        # Create CloudWatch alarms for NAT Gateways
        self.nat_gateway_alarms = self._create_nat_gateway_alarms()
    
    def _create_sns_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for alarm notifications.
        
        Fixes missing SNS topic failure.
        
        Returns:
            SNS topic resource
        """
        topic = aws.sns.Topic(
            'alarm-notifications-topic',
            display_name=f'{self.config.project_name} Infrastructure Alarms',
            tags=self.config.get_tags_for_resource(
                'SNSTopic',
                Name=self.config.get_resource_name('alarm-notifications')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Subscribe email if provided
        if self.config.alarm_email:
            aws.sns.TopicSubscription(
                'alarm-email-subscription',
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.alarm_email,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[topic],
                    parent=self.parent
                )
            )
        
        return topic
    
    def _create_ec2_alarms(self) -> list:
        """
        Create CloudWatch alarms for EC2 instances.
        
        Fixes:
        - Adds alarm_actions
        - Proper threshold configuration
        
        Returns:
            List of alarm resources
        """
        alarms = []
        
        for i, instance in enumerate(self.ec2_instances):
            # CPU utilization alarm
            cpu_alarm = aws.cloudwatch.MetricAlarm(
                f'ec2-cpu-alarm-{i}',
                name=self.config.get_resource_name('ec2-cpu-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='CPUUtilization',
                namespace='AWS/EC2',
                period=self.config.alarm_period,
                statistic='Average',
                threshold=self.config.cpu_high_threshold,
                alarm_description=f'Alarm when CPU exceeds {self.config.cpu_high_threshold}% for EC2 instance {i}',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'InstanceId': instance.id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('ec2-cpu-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[instance, self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(cpu_alarm)
            
            # Status check alarm
            status_alarm = aws.cloudwatch.MetricAlarm(
                f'ec2-status-alarm-{i}',
                name=self.config.get_resource_name('ec2-status-alarm', str(i)),
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='StatusCheckFailed',
                namespace='AWS/EC2',
                period=self.config.alarm_period,
                statistic='Maximum',
                threshold=1,
                alarm_description=f'Alarm when status check fails for EC2 instance {i}',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'InstanceId': instance.id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('ec2-status-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[instance, self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(status_alarm)
        
        return alarms
    
    def _create_nat_gateway_alarms(self) -> list:
        """
        Create CloudWatch alarms for NAT Gateways.
        
        Fixes:
        - Adds alarm_actions
        - Proper threshold configuration
        
        Returns:
            List of alarm resources
        """
        alarms = []
        
        for i, nat_gateway_id in enumerate(self.nat_gateway_ids):
            # Packet drop alarm
            packet_drop_alarm = aws.cloudwatch.MetricAlarm(
                f'nat-gateway-packet-drops-alarm-{i}',
                name=self.config.get_resource_name('nat-packet-drops-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='PacketsDropCount',
                namespace='AWS/NATGateway',
                period=self.config.alarm_period,
                statistic='Sum',
                threshold=self.config.nat_packet_drop_threshold,
                alarm_description=f'Alarm when NAT Gateway {i} drops more than {self.config.nat_packet_drop_threshold} packets',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'NatGatewayId': nat_gateway_id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('nat-packet-drops-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(packet_drop_alarm)
            
            # Error port allocation alarm
            error_alarm = aws.cloudwatch.MetricAlarm(
                f'nat-gateway-error-alarm-{i}',
                name=self.config.get_resource_name('nat-error-alarm', str(i)),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name='ErrorPortAllocation',
                namespace='AWS/NATGateway',
                period=self.config.alarm_period,
                statistic='Sum',
                threshold=0,
                alarm_description=f'Alarm when NAT Gateway {i} has port allocation errors',
                alarm_actions=[self.sns_topic.arn],
                dimensions={
                    'NatGatewayId': nat_gateway_id
                },
                tags=self.config.get_tags_for_resource(
                    'CloudWatchAlarm',
                    Name=self.config.get_resource_name('nat-error-alarm', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.sns_topic],
                    parent=self.parent
                )
            )
            alarms.append(error_alarm)
        
        return alarms
    
    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn

