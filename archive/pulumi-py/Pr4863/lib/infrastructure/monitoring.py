"""
Monitoring infrastructure module.

This module creates CloudWatch log groups, metrics, and alarms
for comprehensive infrastructure monitoring.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class MonitoringStack:
    """
    Creates and manages CloudWatch log groups, metrics, and alarms.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        alb_arn: Output[str] = None,
        asg_name: Output[str] = None,
        sns_topic_arn: Output[str] = None,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the monitoring stack.
        
        Args:
            config: Infrastructure configuration
            alb_arn: ALB ARN for monitoring (optional)
            asg_name: Auto Scaling Group name
            sns_topic_arn: SNS topic ARN for alarm notifications
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.alb_arn = alb_arn
        self.asg_name = asg_name
        self.sns_topic_arn = sns_topic_arn
        self.parent = parent
        
        # Create log groups
        self.app_log_group = self._create_app_log_group()
        
        # Create CloudWatch alarms
        self.cpu_alarm = self._create_cpu_alarm()
        if self.alb_arn is not None:
            self.unhealthy_host_alarm = self._create_unhealthy_host_alarm()
            self.alb_5xx_alarm = self._create_alb_5xx_alarm()
        else:
            self.unhealthy_host_alarm = None
            self.alb_5xx_alarm = None
    
    def _create_app_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for application logs.
        
        Returns:
            Log Group resource
        """
        log_group_name = self.config.get_resource_name('log-group-app')
        
        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return log_group
    
    def _create_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.
        
        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-high')
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=80.0,
            alarm_description='Triggers when CPU utilization exceeds 80%',
            alarm_actions=[self.sns_topic_arn],
            dimensions={
                'AutoScalingGroupName': self.asg_name
            },
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return alarm
    
    def _create_unhealthy_host_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for unhealthy hosts.
        
        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-unhealthy-hosts')
        
        alb_full_name = self.alb_arn.apply(
            lambda arn: '/'.join(arn.split(':')[-1].split('/')[1:])
        )
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=self.config.alarm_period,
            statistic='Average',
            threshold=0.0,
            alarm_description='Triggers when there are unhealthy hosts',
            alarm_actions=[self.sns_topic_arn],
            dimensions=alb_full_name.apply(lambda name: {
                'LoadBalancer': name
            }),
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return alarm
    
    def _create_alb_5xx_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for ALB 5xx errors.
        
        Returns:
            Metric Alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-alb-5xx')
        
        # Extract ALB name from ARN for dimensions
        alb_full_name = self.alb_arn.apply(
            lambda arn: '/'.join(arn.split(':')[-1].split('/')[1:])
        )
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=self.config.alarm_period,
            statistic='Sum',
            threshold=10.0,
            alarm_description='Triggers when ALB 5xx errors exceed 10 in 5 minutes',
            alarm_actions=[self.sns_topic_arn],
            dimensions=alb_full_name.apply(lambda name: {
                'LoadBalancer': name
            }),
            treat_missing_data='notBreaching',
            tags=self.config.get_tags_for_resource('MetricAlarm', Name=alarm_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return alarm
    
    def get_app_log_group_name(self) -> Output[str]:
        """Get application log group name."""
        return self.app_log_group.name
    
    def get_app_log_group_arn(self) -> Output[str]:
        """Get application log group ARN."""
        return self.app_log_group.arn

