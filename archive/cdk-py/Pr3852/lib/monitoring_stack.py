from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack,
    Duration,
)
from constructs import Construct


class MonitoringStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        asg: autoscaling.AutoScalingGroup,
        alb: elbv2.ApplicationLoadBalancer,
        target_group: elbv2.ApplicationTargetGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "MarketplaceDashboard", dashboard_name="MarketplaceMetrics"
        )

        # Add widgets
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count", left=[target_group.metrics.request_count()]
            ),
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[target_group.metrics.target_response_time()],
            ),
        )

        # Create CPU metric manually for ASG
        cpu_metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={"AutoScalingGroupName": asg.auto_scaling_group_name},
            statistic="Average",
            period=Duration.minutes(5),
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(title="EC2 CPU Utilization", left=[cpu_metric]),
            cloudwatch.GraphWidget(
                title="Healthy Host Count",
                left=[target_group.metrics.healthy_host_count()],
            ),
        )

        # CPU Utilization Alarm
        cloudwatch.Alarm(
            self,
            "HighCPUAlarm",
            metric=cpu_metric,
            threshold=80,
            evaluation_periods=2,
            alarm_description="Alert when CPU exceeds 80%",
        )

        # Request Count Alarm
        cloudwatch.Alarm(
            self,
            "HighRequestCountAlarm",
            metric=target_group.metrics.request_count(
                statistic="Sum", period=Duration.minutes(5)
            ),
            threshold=10000,
            evaluation_periods=1,
            alarm_description="Alert when request count is high",
        )

        # Unhealthy Host Alarm
        cloudwatch.Alarm(
            self,
            "UnhealthyHostAlarm",
            metric=target_group.metrics.unhealthy_host_count(),
            threshold=1,
            evaluation_periods=2,
            alarm_description="Alert when unhealthy hosts detected",
        )
