"""Monitoring Stack with CloudWatch alarms and dashboards."""

from aws_cdk import (
    NestedStack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_sns as sns,
    Duration,
)
from constructs import Construct


class MonitoringStack(NestedStack):
    """Creates CloudWatch monitoring, alarms, and dashboards."""
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        asg: autoscaling.AutoScalingGroup,
        database: rds.DatabaseInstance,
        alb: elbv2.ApplicationLoadBalancer,
        target_group: elbv2.ApplicationTargetGroup,
        environment_suffix: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.asg = asg
        self.database = database
        self.alb = alb
        self.target_group = target_group
        self.environment_suffix = environment_suffix
        
        # Create SNS topic for alerts
        self._create_notification_topic()
        
        # Create CloudWatch alarms
        self._create_alarms()
        
        # Create CloudWatch dashboard
        self._create_dashboard()
    
    def _create_notification_topic(self):
        """Create SNS topic for alarm notifications."""
        
        self.alarm_topic = sns.Topic(
            self, "prod-alarm-topic",
            topic_name=f"prod-webapp-alarms-{self.environment_suffix}",
            display_name="Production Web App Alarms",
        )
    
    def _create_alarms(self):
        """Create CloudWatch alarms for key metrics."""
        
        # High CPU utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "prod-high-cpu-alarm",
            alarm_name=f"prod-webapp-high-cpu-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization in Auto Scaling Group",
        )
        
        cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )
        
        # Database CPU utilization alarm
        db_cpu_alarm = cloudwatch.Alarm(
            self, "prod-db-cpu-alarm",
            alarm_name=f"prod-database-high-cpu-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": self.database.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization on RDS database",
        )
        
        db_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )
        
        # Database connection count alarm
        db_connections_alarm = cloudwatch.Alarm(
            self, "prod-db-connections-alarm",
            alarm_name=f"prod-database-high-connections-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="DatabaseConnections",
                dimensions_map={
                    "DBInstanceIdentifier": self.database.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High connection count on RDS database",
        )
        
        db_connections_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )
        
        # ALB target health alarm
        target_health_alarm = cloudwatch.Alarm(
            self, "prod-target-health-alarm",
            alarm_name=f"prod-alb-unhealthy-targets-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "TargetGroup": self.target_group.target_group_full_name,
                    "LoadBalancer": self.alb.load_balancer_full_name,
                },
                statistic="Average",
                period=Duration.minutes(1),
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Unhealthy targets in ALB target group",
        )
        
        target_health_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )
        
        # ALB response time alarm
        response_time_alarm = cloudwatch.Alarm(
            self, "prod-response-time-alarm",
            alarm_name=f"prod-alb-high-response-time-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="TargetResponseTime",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name,
                },
                statistic="Average",
                period=Duration.minutes(1),
            ),
            threshold=1,  # 1 second
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High response time from ALB",
        )
        
        response_time_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )
    
    def _create_dashboard(self):
        """Create CloudWatch dashboard for monitoring."""
        
        dashboard = cloudwatch.Dashboard(
            self, "prod-webapp-dashboard",
            dashboard_name=f"prod-webapp-monitoring-{self.environment_suffix}",
        )
        
        # Add widgets
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="RequestCount",
                    dimensions_map={
                        "LoadBalancer": self.alb.load_balancer_full_name,
                    },
                    statistic="Sum",
                    period=Duration.minutes(1),
                )],
                width=12,
                height=6,
            ),
            cloudwatch.GraphWidget(
                title="ALB Response Time",
                left=[cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="TargetResponseTime",
                    dimensions_map={
                        "LoadBalancer": self.alb.load_balancer_full_name,
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                )],
                width=12,
                height=6,
            ),
            cloudwatch.GraphWidget(
                title="ASG CPU Utilization",
                left=[cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "AutoScalingGroupName": self.asg.auto_scaling_group_name
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                )],
                width=12,
                height=6,
            ),
            cloudwatch.GraphWidget(
                title="Database Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": self.database.instance_identifier
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBInstanceIdentifier": self.database.instance_identifier
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    ),
                ],
                width=12,
                height=6,
            ),
        )