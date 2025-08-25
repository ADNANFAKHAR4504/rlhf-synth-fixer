"""monitoring_stack.py
CloudWatch monitoring, alarms, and dashboard configuration.
"""

import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions
)
from constructs import Construct


class MonitoringStack(cdk.NestedStack):
    """Creates CloudWatch monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        load_balancer: elbv2.ApplicationLoadBalancer,
        auto_scaling_group: autoscaling.AutoScalingGroup,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alerts
        self.alert_topic = sns.Topic(
            self, f"prod-alerts-{environment_suffix}",
            topic_name=f"prod-alerts-{environment_suffix}",
            display_name=f"Production Alerts - {environment_suffix}"
        )

        # Add email subscription (replace with actual email)
        self.alert_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # 5xx Error Alarm
        self.error_5xx_alarm = cloudwatch.Alarm(
            self, f"prod-5xx-errors-{environment_suffix}",
            alarm_name=f"prod-5xx-errors-{environment_suffix}",
            alarm_description="Alert when 5xx errors exceed threshold",
            metric=load_balancer.metric_http_code_elb(
                code=elbv2.HttpCodeElb.ELB_5XX_COUNT,
                statistic=cloudwatch.Stats.SUM,
                period=cdk.Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.error_5xx_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # High CPU Utilization Alarm
        cpu_metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={
                "AutoScalingGroupName": auto_scaling_group.auto_scaling_group_name
            },
            statistic=cloudwatch.Stats.AVERAGE,
            period=cdk.Duration.minutes(5)
        )

        self.cpu_alarm = cloudwatch.Alarm(
            self, f"prod-high-cpu-{environment_suffix}",
            alarm_name=f"prod-high-cpu-{environment_suffix}",
            alarm_description="Alert when CPU utilization is high",
            metric=cpu_metric,
            threshold=80,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.MISSING
        )

        self.cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # Response Time Alarm
        self.response_time_alarm = cloudwatch.Alarm(
            self, f"prod-response-time-{environment_suffix}",
            alarm_name=f"prod-response-time-{environment_suffix}",
            alarm_description="Alert when response time is high",
            metric=load_balancer.metric_target_response_time(
                statistic=cloudwatch.Stats.AVERAGE,
                period=cdk.Duration.minutes(5)
            ),
            threshold=2,  # 2 seconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.response_time_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self, f"prod-dashboard-{environment_suffix}",
            dashboard_name=f"prod-dashboard-{environment_suffix}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="ALB Request Count",
                        left=[load_balancer.metric_request_count()],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="ALB Response Time",
                        left=[load_balancer.metric_target_response_time()],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="HTTP Status Codes",
                        left=[
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_3XX_COUNT
                            ),
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_4XX_COUNT
                            ),
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_5XX_COUNT
                            )
                        ],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Auto Scaling Group CPU Utilization",
                        left=[cpu_metric],
                        width=12,
                        height=6
                    )
                ]
            ]
        )
