"""
Monitoring Construct
Creates CloudWatch alarms and SNS topics for alerting
"""

from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from constructs import Construct


class MonitoringConstruct(Construct):
    """
    Monitoring construct with CloudWatch alarms and SNS notifications.
    """

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str,
        aurora_cluster_id: str,
        lambda_function_name: str,
        alarm_email: str,
    ):
        super().__init__(scope, id)

        # SNS Topic for alarms
        self.sns_topic = SnsTopic(
            self,
            "sns-topic",
            name=f"aurora-alarms-{environment_suffix}-{region}",
            display_name=f"Aurora Alarms - {environment_suffix}",
            tags={
                "Name": f"aurora-alarms-{environment_suffix}-{region}",
            }
        )

        # Email subscription
        SnsTopicSubscription(
            self,
            "email-subscription",
            topic_arn=self.sns_topic.arn,
            protocol="email",
            endpoint=alarm_email,
        )

        # Alarm: Aurora Replication Lag
        CloudwatchMetricAlarm(
            self,
            "replication-lag-alarm",
            alarm_name=f"aurora-replication-lag-{environment_suffix}-{region}",
            alarm_description="Alert when Aurora replication lag exceeds 3 seconds",
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            statistic="Average",
            period=60,
            evaluation_periods=2,
            threshold=3000,  # 3 seconds in milliseconds
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "DBClusterIdentifier": aurora_cluster_id,
            },
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            treat_missing_data="notBreaching",
            tags={
                "Name": f"aurora-replication-lag-{environment_suffix}-{region}",
            }
        )

        # Alarm: Aurora CPU Utilization
        CloudwatchMetricAlarm(
            self,
            "cpu-alarm",
            alarm_name=f"aurora-cpu-{environment_suffix}-{region}",
            alarm_description="Alert when Aurora CPU utilization exceeds 80%",
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=80,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "DBClusterIdentifier": aurora_cluster_id,
            },
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            tags={
                "Name": f"aurora-cpu-{environment_suffix}-{region}",
            }
        )

        # Alarm: Aurora Database Connections
        CloudwatchMetricAlarm(
            self,
            "connections-alarm",
            alarm_name=f"aurora-connections-{environment_suffix}-{region}",
            alarm_description="Alert when Aurora connections exceed 1000",
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=1000,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "DBClusterIdentifier": aurora_cluster_id,
            },
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            tags={
                "Name": f"aurora-connections-{environment_suffix}-{region}",
            }
        )

        # Alarm: Lambda Function Errors
        CloudwatchMetricAlarm(
            self,
            "lambda-errors-alarm",
            alarm_name=f"lambda-errors-{environment_suffix}-{region}",
            alarm_description="Alert when Lambda health check errors exceed threshold",
            metric_name="Errors",
            namespace="AWS/Lambda",
            statistic="Sum",
            period=300,
            evaluation_periods=1,
            threshold=5,
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "FunctionName": lambda_function_name,
            },
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            tags={
                "Name": f"lambda-errors-{environment_suffix}-{region}",
            }
        )

        # Alarm: Lambda Function Duration
        CloudwatchMetricAlarm(
            self,
            "lambda-duration-alarm",
            alarm_name=f"lambda-duration-{environment_suffix}-{region}",
            alarm_description="Alert when Lambda duration approaches timeout",
            metric_name="Duration",
            namespace="AWS/Lambda",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=25000,  # 25 seconds (timeout is 30s)
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "FunctionName": lambda_function_name,
            },
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            tags={
                "Name": f"lambda-duration-{environment_suffix}-{region}",
            }
        )

    @property
    def sns_topic_arn(self) -> str:
        return self.sns_topic.arn