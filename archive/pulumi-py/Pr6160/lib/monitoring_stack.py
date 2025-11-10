"""
monitoring_stack.py

CloudWatch alarms and SNS notifications with environment-specific thresholds.
"""

import pulumi
from pulumi import Config, Output, ResourceOptions
import pulumi_aws as aws


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring infrastructure component.

    Creates CloudWatch alarms for ALB, ASG, and RDS with environment-specific thresholds.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        alb_arn_suffix: Output[str],
        target_group_arn_suffix: Output[str],
        asg_name: Output[str],
        db_instance_id: Output[str],
        tags: dict,
        opts: ResourceOptions = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        config = Config()

        # Get notification email from config
        alarm_email = config.get('alarmEmail') or f'alerts-{environment_suffix}@example.com'

        # Create SNS topic for alarms
        self.sns_topic = aws.sns.Topic(
            f'alarms-topic-{environment_suffix}',
            name=f'alarms-topic-{environment_suffix}',
            tags={**tags, 'Name': f'alarms-topic-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create SNS subscription
        aws.sns.TopicSubscription(
            f'alarms-subscription-{environment_suffix}',
            topic=self.sns_topic.arn,
            protocol='email',
            endpoint=alarm_email,
            opts=ResourceOptions(parent=self)
        )

        # Environment-specific thresholds
        thresholds = {
            'dev': {
                'alb_response_time': 2.0,
                'alb_error_rate': 10.0,
                'asg_cpu': 80.0,
                'rds_cpu': 80.0,
                'rds_connections': 40,
                'rds_storage': 85.0,
            },
            'staging': {
                'alb_response_time': 1.5,
                'alb_error_rate': 5.0,
                'asg_cpu': 75.0,
                'rds_cpu': 75.0,
                'rds_connections': 60,
                'rds_storage': 80.0,
            },
            'prod': {
                'alb_response_time': 1.0,
                'alb_error_rate': 2.0,
                'asg_cpu': 70.0,
                'rds_cpu': 70.0,
                'rds_connections': 80,
                'rds_storage': 75.0,
            }
        }
        threshold = thresholds.get(environment_suffix, thresholds['dev'])

        # ALB Response Time Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-response-time-{environment_suffix}',
            name=f'alb-response-time-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='TargetResponseTime',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Average',
            threshold=threshold['alb_response_time'],
            alarm_description=f'ALB response time high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-response-time-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ALB Error Rate Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-error-rate-{environment_suffix}',
            name=f'alb-error-rate-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Sum',
            threshold=threshold['alb_error_rate'],
            alarm_description=f'ALB 5xx errors high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-error-rate-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ALB Target Health Alarm
        aws.cloudwatch.MetricAlarm(
            f'alb-unhealthy-targets-{environment_suffix}',
            name=f'alb-unhealthy-targets-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=300,
            statistic='Average',
            threshold=0,
            alarm_description=f'ALB has unhealthy targets in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TargetGroup': target_group_arn_suffix,
                'LoadBalancer': alb_arn_suffix,
            },
            tags={**tags, 'Name': f'alb-unhealthy-targets-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ASG CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f'asg-cpu-{environment_suffix}',
            name=f'asg-cpu-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            period=300,
            statistic='Average',
            threshold=threshold['asg_cpu'],
            alarm_description=f'ASG CPU high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'AutoScalingGroupName': asg_name,
            },
            tags={**tags, 'Name': f'asg-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS CPU Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-cpu-{environment_suffix}',
            name=f'rds-cpu-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='CPUUtilization',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=threshold['rds_cpu'],
            alarm_description=f'RDS CPU high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-cpu-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS Connections Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-connections-{environment_suffix}',
            name=f'rds-connections-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='DatabaseConnections',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=threshold['rds_connections'],
            alarm_description=f'RDS connections high in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-connections-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # RDS Storage Alarm
        aws.cloudwatch.MetricAlarm(
            f'rds-storage-{environment_suffix}',
            name=f'rds-storage-{environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=1,
            metric_name='FreeStorageSpace',
            namespace='AWS/RDS',
            period=300,
            statistic='Average',
            threshold=(100 - threshold['rds_storage']) * 1024 * 1024 * 1024,  # Convert to bytes
            alarm_description=f'RDS storage low in {environment_suffix}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'DBInstanceIdentifier': db_instance_id,
            },
            tags={**tags, 'Name': f'rds-storage-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.sns_topic_arn = self.sns_topic.arn
        self.sns_topic_name = self.sns_topic.name

        self.register_outputs({
            'sns_topic_arn': self.sns_topic_arn,
            'sns_topic_name': self.sns_topic_name,
        })
