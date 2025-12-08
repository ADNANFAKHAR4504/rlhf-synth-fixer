from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_alb_arn: str,
        secondary_alb_arn: str,
        primary_asg_name: str,
        secondary_asg_name: str,
        primary_db_cluster_id: str,
        secondary_db_cluster_id: str
    ):
        super().__init__(scope, construct_id)

        # SNS Topic - Primary
        self.primary_sns_topic = SnsTopic(
            self,
            "primary-sns-topic",
            name=f"trading-alerts-{environment_suffix}",
            tags={"Name": f"trading-alerts-{environment_suffix}"},
            provider=primary_provider
        )

        # SNS Subscription (email - would need to be confirmed)
        SnsTopicSubscription(
            self,
            "primary-sns-subscription",
            topic_arn=self.primary_sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=primary_provider
        )

        # CloudWatch Alarms - Primary ALB
        CloudwatchMetricAlarm(
            self,
            "primary-alb-unhealthy-targets",
            alarm_name=f"primary-alb-unhealthy-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when primary ALB has unhealthy targets",
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={"LoadBalancer": primary_alb_arn},
            provider=primary_provider
        )

        CloudwatchMetricAlarm(
            self,
            "primary-alb-target-response-time",
            alarm_name=f"primary-alb-response-time-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="TargetResponseTime",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when primary ALB response time exceeds 1 second",
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={"LoadBalancer": primary_alb_arn},
            provider=primary_provider
        )

        # CloudWatch Alarms - Primary ASG
        CloudwatchMetricAlarm(
            self,
            "primary-asg-cpu",
            alarm_name=f"primary-asg-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary ASG CPU exceeds 80%",
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={"AutoScalingGroupName": primary_asg_name},
            provider=primary_provider
        )

        # CloudWatch Alarms - Primary Database
        CloudwatchMetricAlarm(
            self,
            "primary-db-cpu",
            alarm_name=f"primary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary database CPU exceeds 80%",
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={"DBClusterIdentifier": primary_db_cluster_id},
            provider=primary_provider
        )

        CloudwatchMetricAlarm(
            self,
            "primary-db-replication-lag",
            alarm_name=f"primary-db-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=1000,
            alarm_description="Alert when database replication lag exceeds 1 second",
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={"DBClusterIdentifier": primary_db_cluster_id},
            provider=primary_provider
        )

        # SNS Topic - Secondary
        secondary_sns_topic = SnsTopic(
            self,
            "secondary-sns-topic",
            name=f"trading-alerts-secondary-{environment_suffix}",
            tags={"Name": f"trading-alerts-secondary-{environment_suffix}"},
            provider=secondary_provider
        )

        SnsTopicSubscription(
            self,
            "secondary-sns-subscription",
            topic_arn=secondary_sns_topic.arn,
            protocol="email",
            endpoint="ops-team@example.com",
            provider=secondary_provider
        )

        # CloudWatch Alarms - Secondary ALB
        CloudwatchMetricAlarm(
            self,
            "secondary-alb-unhealthy-targets",
            alarm_name=f"secondary-alb-unhealthy-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when secondary ALB has unhealthy targets",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={"LoadBalancer": secondary_alb_arn},
            provider=secondary_provider
        )

        # CloudWatch Alarms - Secondary ASG
        CloudwatchMetricAlarm(
            self,
            "secondary-asg-cpu",
            alarm_name=f"secondary-asg-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when secondary ASG CPU exceeds 80%",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={"AutoScalingGroupName": secondary_asg_name},
            provider=secondary_provider
        )

        # CloudWatch Alarms - Secondary Database
        CloudwatchMetricAlarm(
            self,
            "secondary-db-cpu",
            alarm_name=f"secondary-db-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when secondary database CPU exceeds 80%",
            alarm_actions=[secondary_sns_topic.arn],
            dimensions={"DBClusterIdentifier": secondary_db_cluster_id},
            provider=secondary_provider
        )

    @property
    def primary_sns_topic_arn(self):
        return self.primary_sns_topic.arn
