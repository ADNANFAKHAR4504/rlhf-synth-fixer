"""monitoring_stack.py
CloudWatch dashboards, alarms, and monitoring configuration.
"""

import aws_cdk as cdk
from constructs import Construct
from typing import Dict
from aws_cdk import (
    aws_ecs as ecs, aws_elasticloadbalancingv2 as elbv2,
    aws_cloudwatch as cloudwatch, aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
    NestedStack
)


class MonitoringStackProps:
    """Properties for MonitoringStack."""
    def __init__(self, environment_suffix: str, cluster: ecs.Cluster,
                 payment_api_service: ecs.FargateService,
                 transaction_processor_service: ecs.FargateService,
                 notification_service: ecs.FargateService,
                 alb: elbv2.ApplicationLoadBalancer,
                 target_groups: Dict[str, elbv2.ApplicationTargetGroup]):
        self.environment_suffix = environment_suffix
        self.cluster = cluster
        self.payment_api_service = payment_api_service
        self.transaction_processor_service = transaction_processor_service
        self.notification_service = notification_service
        self.alb = alb
        self.target_groups = target_groups


class MonitoringStack(NestedStack):
    """Creates CloudWatch dashboards, alarms, and monitoring."""

    def __init__(self, scope: Construct, construct_id: str, props: MonitoringStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # SNS topic for alarms
        alarm_topic = sns.Topic(
            self, f"AlarmTopic{env_suffix}",
            topic_name=f"payment-processing-alarms-{env_suffix}",
            display_name="Payment Processing Alarms"
        )

        # Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"PaymentProcessingDashboard{env_suffix}",
            dashboard_name=f"payment-processing-{env_suffix}"
        )

        # ALB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[props.alb.metric_request_count(statistic="Sum", period=cdk.Duration.minutes(1))]
            ),
            cloudwatch.GraphWidget(
                title="ALB Response Time",
                left=[props.alb.metric_target_response_time(statistic="Average", period=cdk.Duration.minutes(1))]
            )
        )

        # Service metrics and alarms
        services = {
            'payment-api': props.payment_api_service,
            'transaction-processor': props.transaction_processor_service,
            'notification-service': props.notification_service
        }

        for service_name, service in services.items():
            cpu_metric = cloudwatch.Metric(
                namespace="AWS/ECS", metric_name="CPUUtilization",
                dimensions_map={"ServiceName": service.service_name, "ClusterName": props.cluster.cluster_name},
                statistic="Average", period=cdk.Duration.minutes(1)
            )

            memory_metric = cloudwatch.Metric(
                namespace="AWS/ECS", metric_name="MemoryUtilization",
                dimensions_map={"ServiceName": service.service_name, "ClusterName": props.cluster.cluster_name},
                statistic="Average", period=cdk.Duration.minutes(1)
            )

            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title=f"{service_name} CPU & Memory",
                    left=[cpu_metric], right=[memory_metric]
                )
            )

            # CPU alarm
            cpu_alarm = cloudwatch.Alarm(
                self, f"{service_name}HighCPU{env_suffix}",
                alarm_name=f"{service_name}-high-cpu-{env_suffix}",
                metric=cpu_metric, threshold=85, evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )
            cpu_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

            # Memory alarm
            memory_alarm = cloudwatch.Alarm(
                self, f"{service_name}HighMemory{env_suffix}",
                alarm_name=f"{service_name}-high-memory-{env_suffix}",
                metric=memory_metric, threshold=90, evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            )
            memory_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Deployment alarms
        self.payment_api_alarm = cloudwatch.Alarm(
            self, f"PaymentAPIDeploymentAlarm{env_suffix}",
            alarm_name=f"payment-api-deployment-alarm-{env_suffix}",
            metric=props.target_groups['payment-api'].metric_target_response_time(),
            threshold=1000, evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        self.transaction_processor_alarm = cloudwatch.Alarm(
            self, f"TxnProcessorDeploymentAlarm{env_suffix}",
            alarm_name=f"transaction-processor-deployment-alarm-{env_suffix}",
            metric=props.target_groups['transaction-processor'].metric_target_response_time(),
            threshold=1000, evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        self.notification_service_alarm = cloudwatch.Alarm(
            self, f"NotificationDeploymentAlarm{env_suffix}",
            alarm_name=f"notification-service-deployment-alarm-{env_suffix}",
            metric=props.target_groups['notification-service'].metric_target_response_time(),
            threshold=1000, evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Target group health
        for service_name, target_group in props.target_groups.items():
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title=f"{service_name} Target Health",
                    left=[
                        target_group.metric_healthy_host_count(statistic="Average", period=cdk.Duration.minutes(1)),
                        target_group.metric_unhealthy_host_count(statistic="Average", period=cdk.Duration.minutes(1))
                    ]
                )
            )

        cdk.CfnOutput(self, f"AlarmTopicARN{env_suffix}", value=alarm_topic.topic_arn)
