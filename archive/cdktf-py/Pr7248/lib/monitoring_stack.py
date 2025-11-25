"""Monitoring and alerting for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf import Fn


class MonitoringStack(Construct):
    """Monitoring stack with CloudWatch alarms and SNS"""

    # pylint: disable=redefined-builtin,too-many-arguments,unused-argument
    def __init__(self, scope: Construct, id: str, alb_arn: str, blue_asg_name: str,
                 green_asg_name: str, environment_suffix: str):
        super().__init__(scope, id)

        # SNS Topic for alerts
        self.sns_topic = SnsTopic(self, 'sns_topic',
            name=f'bluegreen-alerts-v1-{environment_suffix}',
            tags={'Name': f'bluegreen-alerts-v1-{environment_suffix}'}
        )

        # ALB Target 5XX Alarm
        # Extract LoadBalancer dimension from ARN using Terraform functions
        alb_dimension = Fn.element(Fn.split(':loadbalancer/', alb_arn), 1)

        CloudwatchMetricAlarm(self, 'alb_5xx_alarm',
            alarm_name=f'bluegreen-alb-5xx-v1-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='HTTPCode_Target_5XX_Count',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Sum',
            threshold=10,
            alarm_description='Alert when ALB 5XX errors exceed threshold v1',
            alarm_actions=[self.sns_topic.arn],
            dimensions={'LoadBalancer': alb_dimension},
            tags={'Name': f'bluegreen-alb-5xx-alarm-v1-{environment_suffix}'}
        )

        # Blue ASG Unhealthy Hosts Alarm
        CloudwatchMetricAlarm(self, 'blue_unhealthy_alarm',
            alarm_name=f'bluegreen-blue-unhealthy-v1-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Average',
            threshold=0,
            alarm_description='Alert when Blue environment has unhealthy hosts v1',
            alarm_actions=[self.sns_topic.arn],
            tags={'Name': f'bluegreen-blue-unhealthy-alarm-v1-{environment_suffix}'}
        )

        # Green ASG Unhealthy Hosts Alarm
        CloudwatchMetricAlarm(self, 'green_unhealthy_alarm',
            alarm_name=f'bluegreen-green-unhealthy-v1-{environment_suffix}',
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='UnHealthyHostCount',
            namespace='AWS/ApplicationELB',
            period=60,
            statistic='Average',
            threshold=0,
            alarm_description='Alert when Green environment has unhealthy hosts v1',
            alarm_actions=[self.sns_topic.arn],
            tags={'Name': f'bluegreen-green-unhealthy-alarm-v1-{environment_suffix}'}
        )

    @property
    def sns_topic_arn(self):
        return self.sns_topic.arn
