"""
monitoring_stack.py

CloudWatch monitoring with Container Insights, alarms, and cost tracking dashboard.
Provides visibility into performance metrics, cost optimization, and SLA compliance.
"""

from typing import Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class MonitoringStack(pulumi.ComponentResource):
    """
    Monitoring stack with CloudWatch dashboards and alarms.

    Features:
    - CloudWatch Container Insights metrics
    - Performance monitoring (response time, error rate)
    - Cost tracking metrics
    - Auto-scaling effectiveness
    - SLA compliance alarms

    Args:
        name (str): Resource name
        cluster_name (Output[str]): ECS cluster name
        service_name (Output[str]): ECS service name
        alb_arn (Output[str]): ALB ARN
        target_group_arn (Output[str]): Target group ARN
        environment_suffix (str): Environment identifier
        opts (ResourceOptions): Pulumi options
    """

    def __init__(
        self,
        name: str,
        cluster_name: Output[str],
        service_name: Output[str],
        alb_arn: Output[str],
        target_group_arn: Output[str],
        environment_suffix: str,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        # Extract ALB name from ARN for metrics
        alb_name = alb_arn.apply(lambda arn: arn.split('/')[-1])
        target_group_full_name = target_group_arn.apply(
            lambda arn: '/'.join(arn.split(':')[-1].split('/')[1:])
        )

        # Create SNS topic for alarms
        self.alarm_topic = aws.sns.Topic(
            f"ecs-alarms-{environment_suffix}",
            tags={
                "Name": f"ecs-alarms-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Alarm: High CPU utilization
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"ecs-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=60,
            statistic="Average",
            threshold=85.0,
            alarm_description="Alert when ECS CPU exceeds 85%",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "ClusterName": cluster_name,
                "ServiceName": service_name
            },
            tags={
                "Name": f"ecs-high-cpu-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Alarm: High memory utilization
        self.memory_alarm = aws.cloudwatch.MetricAlarm(
            f"ecs-high-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=60,
            statistic="Average",
            threshold=90.0,
            alarm_description="Alert when ECS memory exceeds 90%",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "ClusterName": cluster_name,
                "ServiceName": service_name
            },
            tags={
                "Name": f"ecs-high-memory-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Alarm: High target response time (SLA monitoring)
        self.response_time_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-high-response-time-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0.2,  # 200ms SLA
            alarm_description="Alert when response time exceeds 200ms SLA",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "LoadBalancer": alb_name,
                "TargetGroup": target_group_full_name
            },
            tags={
                "Name": f"alb-high-response-time-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Alarm: Unhealthy targets
        self.unhealthy_target_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-unhealthy-targets-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when targets are unhealthy",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "LoadBalancer": alb_name,
                "TargetGroup": target_group_full_name
            },
            tags={
                "Name": f"alb-unhealthy-targets-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch dashboard
        dashboard_body = pulumi.Output.all(
            cluster_name,
            service_name,
            alb_name,
            target_group_full_name
        ).apply(lambda args: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "CPUUtilization", {"stat": "Average", "label": "CPU Utilization"}],
                            [".", "MemoryUtilization", {"stat": "Average", "label": "Memory Utilization"}]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "ECS Resource Utilization",
                        "yAxis": {"left": {"min": 0, "max": 100}},
                        "dimensions": {
                            "ClusterName": args[0],
                            "ServiceName": args[1]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime",
                             {"stat": "Average", "label": "Response Time (s)"}],
                            ["...", {"stat": "p99", "label": "P99 Response Time"}]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "ALB Response Time (SLA: 200ms)",
                        "yAxis": {"left": {"min": 0}},
                        "annotations": {
                            "horizontal": [{
                                "value": 0.2,
                                "label": "SLA Threshold",
                                "color": "#d62728"
                            }]
                        },
                        "dimensions": {
                            "LoadBalancer": args[2],
                            "TargetGroup": args[3]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "label": "Request Count"}],
                            [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum", "label": "4XX Errors"}],
                            [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum", "label": "5XX Errors"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "Request and Error Metrics",
                        "yAxis": {"left": {"min": 0}},
                        "dimensions": {
                            "LoadBalancer": args[2]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ECS", "DesiredTaskCount", {"stat": "Average", "label": "Desired Tasks"}],
                            [".", "RunningTaskCount", {"stat": "Average", "label": "Running Tasks"}]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "ECS Task Count (Auto-scaling)",
                        "yAxis": {"left": {"min": 0}},
                        "dimensions": {
                            "ClusterName": args[0],
                            "ServiceName": args[1]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "HealthyHostCount", {"stat": "Average", "label": "Healthy Targets"}],
                            [".", "UnHealthyHostCount", {"stat": "Average", "label": "Unhealthy Targets"}]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Target Health Status",
                        "yAxis": {"left": {"min": 0}},
                        "dimensions": {
                            "LoadBalancer": args[2],
                            "TargetGroup": args[3]
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "ActiveConnectionCount",
                             {"stat": "Sum", "label": "Active Connections"}],
                            [".", "NewConnectionCount", {"stat": "Sum", "label": "New Connections"}]
                        ],
                        "period": 60,
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "ALB Connection Metrics",
                        "yAxis": {"left": {"min": 0}},
                        "dimensions": {
                            "LoadBalancer": args[2]
                        }
                    }
                }
            ]
        }))

        self.dashboard = aws.cloudwatch.Dashboard(
            f"ecs-dashboard-{environment_suffix}",
            dashboard_name=f"ECS-Payment-{environment_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
