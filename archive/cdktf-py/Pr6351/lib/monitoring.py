"""Monitoring module for CloudWatch Logs, alarms, and SNS."""

import json
from constructs import Construct
from cdktf import Token
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sns_topic_policy import SnsTopicPolicy
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class MonitoringModule(Construct):
    """Monitoring infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        kms_key_id: str,
        vpc_id: str,
    ):
        """Initialize monitoring module."""
        super().__init__(scope, construct_id)

        caller = DataAwsCallerIdentity(self, "caller")

        # Create CloudWatch Log Group for CloudTrail
        # Note: CloudWatch Logs are encrypted by default with AWS-managed keys
        # Customer-managed KMS keys require additional permissions configuration
        cloudtrail_log_group = CloudwatchLogGroup(
            self,
            "cloudtrail_log_group",
            name=f"/aws/cloudtrail/{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"cloudtrail-logs-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create SNS topic for security alerts
        self.security_alerts_topic = SnsTopic(
            self,
            "security_alerts",
            name=f"security-alerts-{environment_suffix}",
            kms_master_key_id=kms_key_id,
            tags={
                "Name": f"security-alerts-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        self.security_alerts_topic_arn = self.security_alerts_topic.arn

        # SNS topic policy
        SnsTopicPolicy(
            self,
            "security_alerts_policy",
            arn=self.security_alerts_topic.arn,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudwatch.amazonaws.com"
                        },
                        "Action": "SNS:Publish",
                        "Resource": self.security_alerts_topic.arn
                    }
                ]
            }),
        )

        # Metric filter for unauthorized API calls
        unauthorized_api_filter = CloudwatchLogMetricFilter(
            self,
            "unauthorized_api_filter",
            name=f"unauthorized-api-calls-{environment_suffix}",
            log_group_name=cloudtrail_log_group.name,
            pattern='{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
            metric_transformation={
                "name": f"UnauthorizedAPICalls-{environment_suffix}",
                "namespace": "SecurityMetrics",
                "value": "1",
            },
        )

        # Alarm for unauthorized API calls
        CloudwatchMetricAlarm(
            self,
            "unauthorized_api_alarm",
            alarm_name=f"unauthorized-api-calls-{environment_suffix}",
            alarm_description="Alarm for unauthorized API calls",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name=f"UnauthorizedAPICalls-{environment_suffix}",
            namespace="SecurityMetrics",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_actions=[self.security_alerts_topic.arn],
            tags={
                "Name": f"unauthorized-api-alarm-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Metric filter for root account usage
        root_usage_filter = CloudwatchLogMetricFilter(
            self,
            "root_usage_filter",
            name=f"root-account-usage-{environment_suffix}",
            log_group_name=cloudtrail_log_group.name,
            pattern='{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
            metric_transformation={
                "name": f"RootAccountUsage-{environment_suffix}",
                "namespace": "SecurityMetrics",
                "value": "1",
            },
        )

        # Alarm for root account usage
        CloudwatchMetricAlarm(
            self,
            "root_usage_alarm",
            alarm_name=f"root-account-usage-{environment_suffix}",
            alarm_description="Alarm for root account usage",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name=f"RootAccountUsage-{environment_suffix}",
            namespace="SecurityMetrics",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_actions=[self.security_alerts_topic.arn],
            tags={
                "Name": f"root-usage-alarm-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Metric filter for security group changes
        sg_pattern = (
            '{ ($.eventName = AuthorizeSecurityGroupIngress) || '
            '($.eventName = AuthorizeSecurityGroupEgress) || '
            '($.eventName = RevokeSecurityGroupIngress) || '
            '($.eventName = RevokeSecurityGroupEgress) || '
            '($.eventName = CreateSecurityGroup) || '
            '($.eventName = DeleteSecurityGroup) }'
        )
        sg_changes_filter = CloudwatchLogMetricFilter(
            self,
            "sg_changes_filter",
            name=f"security-group-changes-{environment_suffix}",
            log_group_name=cloudtrail_log_group.name,
            pattern=sg_pattern,
            metric_transformation={
                "name": f"SecurityGroupChanges-{environment_suffix}",
                "namespace": "SecurityMetrics",
                "value": "1",
            },
        )

        # Alarm for security group changes
        CloudwatchMetricAlarm(
            self,
            "sg_changes_alarm",
            alarm_name=f"security-group-changes-{environment_suffix}",
            alarm_description="Alarm for security group modifications",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name=f"SecurityGroupChanges-{environment_suffix}",
            namespace="SecurityMetrics",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_actions=[self.security_alerts_topic.arn],
            tags={
                "Name": f"sg-changes-alarm-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )
