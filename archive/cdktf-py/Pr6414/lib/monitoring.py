from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import (
    CloudwatchLogMetricFilter,
    CloudwatchLogMetricFilterMetricTransformation
)
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.config_configuration_recorder import (
    ConfigConfigurationRecorder,
    ConfigConfigurationRecorderRecordingGroup
)
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_config_rule import (
    ConfigConfigRule,
    ConfigConfigRuleSource
)
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class MonitoringModule(Construct):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, kms_key_arn: str):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Get current AWS account ID dynamically
        current = DataAwsCallerIdentity(self, "current")

        # CloudWatch Log Group with KMS Encryption
        self.log_group = CloudwatchLogGroup(self, "app-logs",
            name=f"/aws/application/{environment_suffix}",
            kms_key_id=kms_key_arn,
            retention_in_days=90,
            tags={
                "Name": f"app-logs-{environment_suffix}"
            }
        )

        # Metric Filter for Unauthorized API Calls
        self.unauthorized_api_filter = CloudwatchLogMetricFilter(self, "unauthorized-api-filter",
            name=f"unauthorized-api-calls-{environment_suffix}",
            log_group_name=self.log_group.name,
            pattern='{ $.errorCode = "*UnauthorizedOperation" || $.errorCode = "AccessDenied*" }',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="UnauthorizedAPICalls",
                namespace=f"Security/{environment_suffix}",
                value="1"
            )
        )

        # Metric Filter for Root Account Usage
        self.root_usage_filter = CloudwatchLogMetricFilter(self, "root-usage-filter",
            name=f"root-account-usage-{environment_suffix}",
            log_group_name=self.log_group.name,
            pattern='{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS }',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="RootAccountUsage",
                namespace=f"Security/{environment_suffix}",
                value="1"
            )
        )

        # Metric Filter for Security Group Changes
        self.sg_changes_filter = CloudwatchLogMetricFilter(self, "sg-changes-filter",
            name=f"security-group-changes-{environment_suffix}",
            log_group_name=self.log_group.name,
            pattern='{ $.eventName = "AuthorizeSecurityGroupIngress" || $.eventName = "RevokeSecurityGroupIngress" }',
            metric_transformation=CloudwatchLogMetricFilterMetricTransformation(
                name="SecurityGroupChanges",
                namespace=f"Security/{environment_suffix}",
                value="1"
            )
        )

        # SNS Topic for Alarms
        self.alarm_topic = SnsTopic(self, "alarm-topic",
            name=f"security-alarms-{environment_suffix}",
            tags={
                "Name": f"alarm-topic-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for Unauthorized API Calls
        self.unauthorized_api_alarm = CloudwatchMetricAlarm(self, "unauthorized-api-alarm",
            alarm_name=f"unauthorized-api-calls-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UnauthorizedAPICalls",
            namespace=f"Security/{environment_suffix}",
            period=300,
            statistic="Sum",
            threshold=1.0,
            alarm_description="Alarm when unauthorized API calls are detected",
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"unauthorized-api-alarm-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for Root Account Usage
        self.root_usage_alarm = CloudwatchMetricAlarm(self, "root-usage-alarm",
            alarm_name=f"root-account-usage-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="RootAccountUsage",
            namespace=f"Security/{environment_suffix}",
            period=60,
            statistic="Sum",
            threshold=1.0,
            alarm_description="Alarm when root account is used",
            alarm_actions=[self.alarm_topic.arn],
            tags={
                "Name": f"root-usage-alarm-{environment_suffix}"
            }
        )

        # AWS Config S3 Bucket
        self.config_bucket = S3Bucket(self, "config-bucket",
            bucket=f"aws-config-{environment_suffix}-{current.account_id}",
            tags={
                "Name": f"config-bucket-{environment_suffix}"
            }
        )

        # IAM Role for AWS Config
        self.config_role = IamRole(self, "config-role",
            name=f"aws-config-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": f"config-role-{environment_suffix}"
            }
        )

        # AWS Config Configuration Recorder - This is slow and costly
        self.config_recorder = ConfigConfigurationRecorder(self, "config-recorder",
            name=f"config-recorder-{environment_suffix}",
            role_arn=self.config_role.arn,
            recording_group=ConfigConfigurationRecorderRecordingGroup(
                all_supported=True,
                include_global_resource_types=True
            )
        )

        # AWS Config Delivery Channel
        self.config_delivery = ConfigDeliveryChannel(self, "config-delivery",
            name=f"config-delivery-{environment_suffix}",
            s3_bucket_name=self.config_bucket.bucket,
            depends_on=[self.config_recorder]
        )

        # AWS Config Rule - Encryption Check
        self.encryption_rule = ConfigConfigRule(self, "encryption-rule",
            name=f"encryption-check-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES"
            ),
            depends_on=[self.config_recorder]
        )

        # EventBridge Rule for Security Events
        self.security_event_rule = CloudwatchEventRule(self, "security-event-rule",
            name=f"security-events-{environment_suffix}",
            description="Capture critical security events",
            event_pattern=json.dumps({
                "source": ["aws.guardduty", "aws.securityhub"],
                "detail-type": ["GuardDuty Finding", "Security Hub Findings - Imported"]
            }),
            tags={
                "Name": f"security-event-rule-{environment_suffix}"
            }
        )

        # EventBridge Target
        self.security_event_target = CloudwatchEventTarget(self, "security-event-target",
            rule=self.security_event_rule.name,
            arn=self.alarm_topic.arn
        )
