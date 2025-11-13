"""Monitoring infrastructure module with CloudWatch alarms."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringInfrastructure(Construct):
    """Monitoring infrastructure with CloudWatch alarms."""

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        autoscaling_group_name: str,
        alb_arn_suffix: str,
        target_group_arn_suffix: str,
        db_instance_identifier: str,
    ):
        """
        Initialize monitoring infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            autoscaling_group_name: Auto Scaling Group name
            alb_arn_suffix: ALB ARN suffix
            target_group_arn_suffix: Target Group ARN suffix
            db_instance_identifier: RDS instance identifier
        """
        super().__init__(scope, construct_id)

        # SNS Topic for alarms
        alarm_topic = SnsTopic(
            self,
            "alarm_topic",
            name=f"payment-alarms-{environment_suffix}",
            display_name="Payment Processing Alarms",
            tags={
                "Name": f"payment-alarms-{environment_suffix}",
            },
        )

        # EC2 CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "asg_cpu_alarm",
            alarm_name=f"payment-asg-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when ASG CPU exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "AutoScalingGroupName": autoscaling_group_name,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-asg-high-cpu-{environment_suffix}",
            },
        )

        # ALB Target Response Time Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_response_time_alarm",
            alarm_name=f"payment-alb-high-response-time-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when ALB response time exceeds 1 second",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "LoadBalancer": alb_arn_suffix,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-alb-response-time-{environment_suffix}",
            },
        )

        # ALB Unhealthy Target Count Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_unhealthy_targets_alarm",
            alarm_name=f"payment-alb-unhealthy-targets-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0.0,
            alarm_description="Alert when there are unhealthy targets",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "TargetGroup": target_group_arn_suffix,
                "LoadBalancer": alb_arn_suffix,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-alb-unhealthy-{environment_suffix}",
            },
        )

        # RDS CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "rds_cpu_alarm",
            alarm_name=f"payment-rds-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS CPU exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "DBInstanceIdentifier": db_instance_identifier,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-rds-high-cpu-{environment_suffix}",
            },
        )

        # RDS Database Connections Alarm
        CloudwatchMetricAlarm(
            self,
            "rds_connections_alarm",
            alarm_name=f"payment-rds-high-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS connections exceed 80",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "DBInstanceIdentifier": db_instance_identifier,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-rds-connections-{environment_suffix}",
            },
        )

        # RDS Free Storage Space Alarm
        CloudwatchMetricAlarm(
            self,
            "rds_storage_alarm",
            alarm_name=f"payment-rds-low-storage-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="FreeStorageSpace",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=10737418240.0,  # 10 GB in bytes
            alarm_description="Alert when RDS free storage is below 10 GB",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "DBInstanceIdentifier": db_instance_identifier,
            },
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-rds-low-storage-{environment_suffix}",
            },
        )

        # Memory utilization would require CloudWatch agent
        # This is configured in the EC2 user data
