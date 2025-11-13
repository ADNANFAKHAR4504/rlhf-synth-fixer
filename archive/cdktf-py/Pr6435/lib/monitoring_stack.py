"""Monitoring Stack - CloudWatch Alarms and Logs."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """Monitoring infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        alb_arn_suffix: str,
        alb_target_group_arn_suffix: str,
        asg_name: str,
        **kwargs
    ):
        """Initialize monitoring stack."""
        super().__init__(scope, construct_id)

        # ALB 5XX Error Rate Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_5xx_alarm",
            alarm_name=f"payment-alb-5xx-{environment_suffix}",
            alarm_description="Alert when ALB 5XX error rate exceeds 5%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=5.0,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "LoadBalancer": alb_arn_suffix,
                "TargetGroup": alb_target_group_arn_suffix,
            },
            tags={
                "Name": f"payment-alb-5xx-alarm-{environment_suffix}",
            },
        )

        # ALB Unhealthy Host Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_unhealthy_hosts_alarm",
            alarm_name=f"payment-alb-unhealthy-hosts-{environment_suffix}",
            alarm_description="Alert when unhealthy hosts detected",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=0,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "LoadBalancer": alb_arn_suffix,
                "TargetGroup": alb_target_group_arn_suffix,
            },
            tags={
                "Name": f"payment-alb-unhealthy-hosts-alarm-{environment_suffix}",
            },
        )

        # ASG CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "asg_cpu_alarm",
            alarm_name=f"payment-asg-cpu-{environment_suffix}",
            alarm_description="Alert when ASG CPU utilization exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80.0,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "AutoScalingGroupName": asg_name,
            },
            tags={
                "Name": f"payment-asg-cpu-alarm-{environment_suffix}",
            },
        )

        # ASG Memory Utilization Alarm (if CloudWatch agent is configured)
        CloudwatchMetricAlarm(
            self,
            "asg_memory_alarm",
            alarm_name=f"payment-asg-memory-{environment_suffix}",
            alarm_description="Alert when ASG memory utilization exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80.0,
            metric_name="mem_used_percent",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "AutoScalingGroupName": asg_name,
            },
            tags={
                "Name": f"payment-asg-memory-alarm-{environment_suffix}",
            },
        )
