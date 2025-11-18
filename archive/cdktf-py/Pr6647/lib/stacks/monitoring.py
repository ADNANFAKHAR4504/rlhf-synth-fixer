from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from constructs import Construct

class MonitoringModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 database, compute, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # SNS Topic for alerts
        self.alert_topic = SnsTopic(self, "alert-topic",
            provider=primary_provider,
            name=f"payment-alerts-{environment_suffix}",
            tags={
                "Name": f"payment-alerts-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # CloudWatch Log Group for ECS
        self.ecs_log_group = CloudwatchLogGroup(self, "ecs-log-group",
            provider=primary_provider,
            name="/ecs/payment-api",
            retention_in_days=30,
            tags={
                "Name": f"payment-ecs-logs-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ALB 5xx errors alarm
        self.alb_5xx_alarm = CloudwatchMetricAlarm(self, "alb-5xx-alarm",
            provider=primary_provider,
            alarm_name=f"payment-alb-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when ALB returns too many 5xx errors",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "LoadBalancer": compute.primary_alb.arn_suffix
            },
            tags={
                "Name": f"payment-alb-5xx-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ECS CPU utilization alarm
        self.ecs_cpu_alarm = CloudwatchMetricAlarm(self, "ecs-cpu-alarm",
            provider=primary_provider,
            alarm_name=f"payment-ecs-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS CPU utilization is high",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "ServiceName": compute.primary_service.name,
                "ClusterName": compute.primary_cluster.name
            },
            tags={
                "Name": f"payment-ecs-cpu-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # ISSUE: Missing critical alarm for database replication lag
        # Should have CloudwatchMetricAlarm for AuroraGlobalDBReplicationLag

        # ISSUE: Missing alarm for S3 replication status
        # Should have alarm monitoring S3 replication metrics

        # ISSUE: Missing alarm for ECS memory utilization
        # Should monitor memory usage alongside CPU
