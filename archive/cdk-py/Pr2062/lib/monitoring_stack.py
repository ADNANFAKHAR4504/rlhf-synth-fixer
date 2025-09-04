from aws_cdk import (
    Stack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 ecs_stack, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alerts
        alert_topic = sns.Topic(
            self, f"WebAppAlerts{environment_suffix}",
            display_name=f"WebApp Alerts - {environment_suffix}"
        )

        # Add email subscription (you can replace with your email)
        alert_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"WebAppDashboard{environment_suffix}",
            dashboard_name=f"webapp-{environment_suffix.lower()}-dashboard"
        )

        # ECS Service Metrics
        service_cpu_metric = cloudwatch.Metric(
            namespace="AWS/ECS",
            metric_name="CPUUtilization",
            dimensions_map={
                "ServiceName": ecs_stack.service.service_name,
                "ClusterName": ecs_stack.cluster.cluster_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        service_memory_metric = cloudwatch.Metric(
            namespace="AWS/ECS",
            metric_name="MemoryUtilization",
            dimensions_map={
                "ServiceName": ecs_stack.service.service_name,
                "ClusterName": ecs_stack.cluster.cluster_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        # ALB Metrics
        alb_request_count_metric = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="RequestCount",
            dimensions_map={
                "LoadBalancer": ecs_stack.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        alb_response_time_metric = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="TargetResponseTime",
            dimensions_map={
                "LoadBalancer": ecs_stack.alb.load_balancer_full_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Service CPU and Memory Utilization",
                left=[service_cpu_metric],
                right=[service_memory_metric],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count and Response Time",
                left=[alb_request_count_metric],
                right=[alb_response_time_metric],
                width=12,
                height=6
            )
        )

        # CloudWatch Alarms
        high_cpu_alarm = cloudwatch.Alarm(
            self, f"HighCpuAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-cpu",
            metric=service_cpu_metric,
            threshold=85,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization detected"
        )

        high_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )

        high_memory_alarm = cloudwatch.Alarm(
            self, f"HighMemoryAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-memory",
            metric=service_memory_metric,
            threshold=90,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High memory utilization detected"
        )

        high_memory_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )

        # Application error rate alarm
        error_rate_alarm = cloudwatch.Alarm(
            self, f"HighErrorRateAlarm{environment_suffix}",
            alarm_name=f"webapp-{environment_suffix.lower()}-high-error-rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="HTTPCode_Target_5XX_Count",
                dimensions_map={
                    "LoadBalancer": ecs_stack.alb.load_balancer_full_name
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High 5xx error rate detected"
        )

        error_rate_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
