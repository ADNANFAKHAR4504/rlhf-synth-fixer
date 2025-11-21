"""
MonitoringConstruct - CloudWatch dashboards and alarms
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2
)


class MonitoringConstruct(Construct):
    """
    Creates CloudWatch monitoring with:
    - Custom dashboard for cluster and services
    - Service-level metrics (CPU, memory, task count)
    - ALB metrics (request count, latency, errors)
    - Container Insights metrics
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        cluster: ecs.ICluster,
        services: dict,
        alb: elbv2.IApplicationLoadBalancer,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"Dashboard-{environment_suffix}",
            dashboard_name=f"microservices-dashboard-{environment_suffix}"
        )

        # Add cluster-level metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Cluster CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "ClusterName": cluster.cluster_name
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(1)
                    )
                ],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Cluster Memory Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="MemoryUtilization",
                        dimensions_map={
                            "ClusterName": cluster.cluster_name
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(1)
                    )
                ],
                width=12
            )
        )

        # Add service-level metrics
        service_widgets = []
        for service_name, service in services.items():
            service_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"{service_name.capitalize()} Service - CPU & Memory",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/ECS",
                            metric_name="CPUUtilization",
                            dimensions_map={
                                "ClusterName": cluster.cluster_name,
                                "ServiceName": service.service_name
                            },
                            statistic="Average",
                            period=cdk.Duration.minutes(1),
                            label="CPU"
                        )
                    ],
                    right=[
                        cloudwatch.Metric(
                            namespace="AWS/ECS",
                            metric_name="MemoryUtilization",
                            dimensions_map={
                                "ClusterName": cluster.cluster_name,
                                "ServiceName": service.service_name
                            },
                            statistic="Average",
                            period=cdk.Duration.minutes(1),
                            label="Memory"
                        )
                    ],
                    width=8
                )
            )

        dashboard.add_widgets(*service_widgets)

        # Add ALB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="RequestCount",
                        dimensions_map={
                            "LoadBalancer": alb.load_balancer_full_name
                        },
                        statistic="Sum",
                        period=cdk.Duration.minutes(1)
                    )
                ],
                width=8
            ),
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="TargetResponseTime",
                        dimensions_map={
                            "LoadBalancer": alb.load_balancer_full_name
                        },
                        statistic="Average",
                        period=cdk.Duration.minutes(1)
                    )
                ],
                width=8
            ),
            cloudwatch.GraphWidget(
                title="ALB HTTP Errors",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="HTTPCode_Target_4XX_Count",
                        dimensions_map={
                            "LoadBalancer": alb.load_balancer_full_name
                        },
                        statistic="Sum",
                        period=cdk.Duration.minutes(1),
                        label="4XX Errors"
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/ApplicationELB",
                        metric_name="HTTPCode_Target_5XX_Count",
                        dimensions_map={
                            "LoadBalancer": alb.load_balancer_full_name
                        },
                        statistic="Sum",
                        period=cdk.Duration.minutes(1),
                        label="5XX Errors"
                    )
                ],
                width=8
            )
        )

        cdk.Tags.of(dashboard).add("Environment", environment_suffix)
