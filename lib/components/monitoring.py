# lib/components/monitoring.py

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json
from pulumi_aws import get_caller_identity

"""
Security Monitoring Infrastructure Component

This component creates and manages:
- CloudWatch for comprehensive monitoring and logging
- AWS GuardDuty for threat detection
- SNS topics for security alerting
- CloudWatch alarms for security metrics
- Security-focused log groups and streams
- VPC Flow Logs for network monitoring
"""

class SecurityMonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self,
               name: str,
               region: str,
               kms_key_arn: pulumi.Input[str],
               tags: Optional[dict] = None,
               opts: Optional[ResourceOptions] = None):
    super().__init__('projectx:monitoring:SecurityMonitoring', name, None, opts)

    self.region = region
    self.kms_key_arn = kms_key_arn
    self.tags = tags or {}
    self.opts = opts  # ✅ Add this line

    # Validate inputs
    if not isinstance(self.tags, dict):
      raise ValueError("tags must be a dictionary")
    if not region:
      raise ValueError("region must be provided")
    if not kms_key_arn:
      raise ValueError("kms_key_arn must be provided")

    # Create CloudWatch resources
    self._create_cloudwatch_resources()

    # Create SNS resources
    self._create_sns_resources()

    # Create GuardDuty
    self._create_guardduty()

    # Create CloudTrail
    self._create_cloudtrail()

    # Create Config
    self._create_config()

    # Register outputs
    self.register_outputs({
      "sns_topic_arn": self.sns_topic.arn,
      "guardduty_detector_id": self.guardduty_detector.id,
      "security_log_group_name": self.security_log_group.name,
      "cloudtrail_arn": self.cloudtrail.arn,
      "config_recorder_name": self.config_recorder.name
    })

  def _create_cloudwatch_resources(self):
    """Create CloudWatch log groups and streams for security monitoring"""
    self.security_log_group = aws.cloudwatch.LogGroup(
      f"{self.region.replace('-', '')}-secure-projectx-security-logs",
      name=f"/aws/projectx/security/{self.region}",
      retention_in_days=365,
      kms_key_id=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-security-logs-{self.region}",
        "Purpose": "SecurityMonitoring"
      },
      opts=ResourceOptions(parent=self)
    )

    self.vpc_flow_log_group = aws.cloudwatch.LogGroup(
      f"{self.region.replace('-', '')}-secure-projectx-vpc-flow-logs",
      name=f"/aws/projectx/vpc-flow-logs/{self.region}",
      retention_in_days=30,
      kms_key_id=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-vpc-flow-logs-{self.region}",
        "Purpose": "NetworkMonitoring"
      },
      opts=ResourceOptions(parent=self)
    )

    self.application_log_group = aws.cloudwatch.LogGroup(
      f"{self.region.replace('-', '')}-secure-projectx-app-logs",
      name=f"/aws/projectx/applications/{self.region}",
      retention_in_days=90,
      kms_key_id=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-app-logs-{self.region}",
        "Purpose": "ApplicationMonitoring"
      },
      opts=ResourceOptions(parent=self)
    )

    flow_logs_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "vpc-flow-logs.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.flow_logs_role = aws.iam.Role(
      f"{self.region.replace('-', '')}-secure-projectx-flow-logs-role",
      name=f"secure-projectx-flow-logs-role-{self.region}",
      assume_role_policy=json.dumps(flow_logs_assume_role_policy),
      tags={
        **self.tags,
        "Name": f"secure-projectx-flow-logs-role-{self.region}",
        "Service": "VPCFlowLogs"
      },
      opts=ResourceOptions(parent=self)
    )

    flow_logs_policy_document = pulumi.Output.all(self.security_log_group.arn).apply(
      lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
          ],
          "Resource": f"{args[0]}:*"
        }
      ]
    }))

    self.flow_logs_policy = aws.iam.RolePolicy(
      f"{self.region.replace('-', '')}-secure-projectx-flow-logs-policy",
      name=f"secure-projectx-flow-logs-policy-{self.region}",
      policy=flow_logs_policy_document,
      role=self.flow_logs_role.name,
      opts=ResourceOptions(parent=self)
    )

  def _create_sns_resources(self):
    """Create SNS topics and subscriptions for security alerts"""
    self.sns_topic = aws.sns.Topic(
      f"{self.region.replace('-', '')}-secure-projectx-security-alerts",
      name=f"secure-projectx-security-alerts-{self.region}",
      display_name="ProjectX Security Alerts",
      kms_master_key_id=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-security-alerts-{self.region}",
        "Purpose": "SecurityAlerting"
      },
      opts=ResourceOptions(parent=self)
    )

    sns_policy = pulumi.Output.all(
      topic_arn=self.sns_topic.arn,
      account_id=get_caller_identity().account_id
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowCloudWatchAlarmsToPublish",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudwatch.amazonaws.com"
          },
          "Action": "sns:Publish",
          "Resource": args["topic_arn"],
          "Condition": {
            "StringEquals": {
              "aws:SourceAccount": args["account_id"]
            }
          }
        },
        {
          "Sid": "AllowGuardDutyToPublish",
          "Effect": "Allow",
          "Principal": {
            "Service": "guardduty.amazonaws.com"
          },
          "Action": "sns:Publish",
          "Resource": args["topic_arn"]
        },
        {
          "Sid": "AllowConfigToPublish",
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "sns:Publish",
          "Resource": args["topic_arn"]
        }
      ]
    }))

    self.sns_topic_policy = aws.sns.TopicPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-sns-policy",
      arn=self.sns_topic.arn,
      policy=sns_policy,
      opts=ResourceOptions(parent=self)
    )

    self.critical_sns_topic = aws.sns.Topic(
      f"{self.region.replace('-', '')}-secure-projectx-critical-alerts",
      name=f"secure-projectx-critical-alerts-{self.region}",
      display_name="ProjectX Critical Security Alerts",
      kms_master_key_id=self.kms_key_arn,
      tags={
        **self.tags,
        "Name": f"secure-projectx-critical-alerts-{self.region}",
        "Purpose": "CriticalAlerting"
      },
      opts=ResourceOptions(parent=self)
    )

    critical_sns_policy = pulumi.Output.all(
      topic_arn=self.critical_sns_topic.arn,
      account_id=get_caller_identity().account_id
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowCloudWatchAlarmsToPublish",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudwatch.amazonaws.com"
          },
          "Action": "sns:Publish",
          "Resource": args["topic_arn"],
          "Condition": {
            "StringEquals": {
              "aws:SourceAccount": args["account_id"]
            }
          }
        },
        {
          "Sid": "AllowGuardDutyToPublish",
          "Effect": "Allow",
          "Principal": {
            "Service": "guardduty.amazonaws.com"
          },
          "Action": "sns:Publish",
          "Resource": args["topic_arn"]
        }
      ]
    }))

    self.critical_sns_topic_policy = aws.sns.TopicPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-critical-sns-policy",
      arn=self.critical_sns_topic.arn,
      policy=critical_sns_policy,
      opts=ResourceOptions(parent=self)
    )

  def _create_guardduty(self):
    """Create AWS GuardDuty for threat detection"""
    self.guardduty_detector = aws.guardduty.Detector(
      f"{self.region.replace('-', '')}-secure-projectx-guardduty",
      enable=True,
      finding_publishing_frequency="FIFTEEN_MINUTES",
      datasources=aws.guardduty.DetectorDatasourcesArgs(
        s3_logs=aws.guardduty.DetectorDatasourcesS3LogsArgs(
          enable=True
        ),
        kubernetes=aws.guardduty.DetectorDatasourcesKubernetesArgs(
          audit_logs=aws.guardduty.DetectorDatasourcesKubernetesAuditLogsArgs(
            enable=True
          )
        ),
        malware_protection=aws.guardduty.DetectorDatasourcesMalwareProtectionArgs(
          scan_ec2_instance_with_findings=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsArgs(
            ebs_volumes=aws.guardduty.DetectorDatasourcesMalwareProtectionScanEc2InstanceWithFindingsEbsVolumesArgs(
              enable=True
            )
          )
        )
      ),
      tags={
        **self.tags,
        "Name": f"secure-projectx-guardduty-{self.region}",
        "Purpose": "ThreatDetection"
      },
      opts=ResourceOptions(parent=self)
    )

    self.guardduty_event_rule = aws.cloudwatch.EventRule(
      f"{self.region.replace('-', '')}-secure-projectx-guardduty-events",
      name=f"secure-projectx-guardduty-findings-{self.region}",
      description="Capture GuardDuty findings",
      event_pattern=json.dumps({
        "source": ["aws.guardduty"],
        "detail-type": ["GuardDuty Finding"],
        "detail": {
          "severity": [
            4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9,
            5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9,
            6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9,
            7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9,
            8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
          ]
        }
      }),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.guardduty_event_target = aws.cloudwatch.EventTarget(
      f"{self.region.replace('-', '')}-secure-projectx-guardduty-target",
      rule=self.guardduty_event_rule.name,
      target_id="GuardDutyToSNS",
      arn=self.sns_topic.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudtrail(self):
    """Create CloudTrail for audit logging"""
    self.cloudtrail_bucket = aws.s3.Bucket(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail-bucket",
      bucket=f"secure-projectx-cloudtrail-{self.region}-{pulumi.get_stack()}",
      tags={
        **self.tags,
        "Name": f"secure-projectx-cloudtrail-{self.region}",
        "Purpose": "AuditLogs"
      },
      opts=ResourceOptions(parent=self)
    )

    self.cloudtrail_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{self._name}-cloudtrail-bucket-encryption",
      bucket=self.cloudtrail_bucket.id,
        rules=[
          aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=self.kms_key_arn
            )
          )
        ],
        opts=ResourceOptions(parent=self)
    )

    cloudtrail_bucket_policy = pulumi.Output.all(
      bucket_name=self.cloudtrail_bucket.bucket,
      account_id=get_caller_identity().account_id
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSCloudTrailAclCheck",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "s3:GetBucketAcl",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}"
        },
        {
          "Sid": "AWSCloudTrailWrite",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}/AWSLogs/{args['account_id']}/*",
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }))

    self.cloudtrail_bucket_policy = aws.s3.BucketPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail-bucket-policy",
      bucket=self.cloudtrail_bucket.id,
      policy=cloudtrail_bucket_policy,
      opts=ResourceOptions(parent=self)
    )

    self.cloudtrail = aws.cloudtrail.Trail(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail",
      name=f"secure-projectx-audit-trail-{self.region}",
      s3_bucket_name=self.cloudtrail_bucket.bucket,
      s3_key_prefix="cloudtrail-logs/",
      include_global_service_events=True,
      is_multi_region_trail=False,
      enable_logging=True,
      enable_log_file_validation=True,
      kms_key_id=self.kms_key_arn,
      cloud_watch_logs_group_arn=pulumi.Output.concat(
        self.security_log_group.arn, ":*"
      ),
      cloud_watch_logs_role_arn=self._create_cloudtrail_logs_role().arn,
      event_selectors=[
        aws.cloudtrail.TrailEventSelectorArgs(
          read_write_type="All",
          include_management_events=True
        )
      ],
      tags={
        **self.tags,
        "Name": f"secure-projectx-cloudtrail-{self.region}",
        "Purpose": "AuditTrail"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudtrail_logs_role(self):
    """Create IAM role for CloudTrail to CloudWatch Logs"""
    cloudtrail_logs_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudtrail.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    cloudtrail_logs_role = aws.iam.Role(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail-logs-role",
      name=f"secure-projectx-cloudtrail-logs-role-{self.region}",
      assume_role_policy=json.dumps(cloudtrail_logs_assume_role_policy),
      tags={
        **self.tags,
        "Name": f"secure-projectx-cloudtrail-logs-role-{self.region}",
        "Service": "CloudTrail"
      },
      opts=ResourceOptions(parent=self)
    )

    cloudtrail_logs_policy_document = pulumi.Output.all(self.security_log_group.arn).apply(
  lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "logs:PutLogEvents",
            "logs:CreateLogGroup",
            "logs:CreateLogStream"
          ],
          "Resource": f"{args[0]}:*"
        }
      ]
    }))


    cloudtrail_logs_policy = aws.iam.Policy(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail-logs-policy",
      name=f"secure-projectx-cloudtrail-logs-policy-{self.region}",
      policy=pulumi.Output.json_dumps(cloudtrail_logs_policy_document),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{self.region.replace('-', '')}-secure-projectx-cloudtrail-logs-policy-attachment",
      role=cloudtrail_logs_role.name,
      policy_arn=cloudtrail_logs_policy.arn,
      opts=ResourceOptions(parent=self)
    )

    return cloudtrail_logs_role

  def _create_config(self):
    """Create AWS Config for compliance monitoring"""
    self.config_bucket = aws.s3.Bucket(
      f"{self.region.replace('-', '')}-secure-projectx-config-bucket",
      bucket=f"secure-projectx-config-{self.region}-{pulumi.get_stack()}",
      tags={
        **self.tags,
        "Name": f"secure-projectx-config-{self.region}",
        "Purpose": "ComplianceMonitoring"
      },
      opts=ResourceOptions(parent=self)
    )

    self.config_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{self.region.replace('-', '')}-secure-projectx-config-encryption",
      bucket=self.config_bucket.id,
        rules=[
          aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
              sse_algorithm="aws:kms",
              kms_master_key_id=self.kms_key_arn
            )
          )
        
      ],
      opts=ResourceOptions(parent=self)
    )

    config_bucket_policy = pulumi.Output.all(
      bucket_name=self.config_bucket.bucket,
      account_id=get_caller_identity().account_id
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AWSConfigBucketPermissionsCheck",
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "s3:GetBucketAcl",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}"
        },
        {
          "Sid": "AWSConfigBucketDelivery",
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "s3:PutObject",
          "Resource": f"arn:aws:s3:::{args['bucket_name']}/AWSLogs/{args['account_id']}/Config/*",
          "Condition": {
            "StringEquals": {
              "s3:x-amz-acl": "bucket-owner-full-control"
            }
          }
        }
      ]
    }))

    self.config_bucket_policy = aws.s3.BucketPolicy(
      f"{self.region.replace('-', '')}-secure-projectx-config-bucket-policy",
      bucket=self.config_bucket.id,
      policy=config_bucket_policy,
      opts=ResourceOptions(parent=self)
    )

    config_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "config.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }

    self.config_role = aws.iam.Role(
      f"{self.region.replace('-', '')}-secure-projectx-config-role",
      name=f"secure-projectx-config-role-{self.region}",
      assume_role_policy=json.dumps(config_assume_role_policy),
      tags={
        **self.tags,
        "Name": f"secure-projectx-config-role-{self.region}",
        "Service": "Config"
      },
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{self.region.replace('-', '')}-secure-projectx-config-policy-attachment",
      role=self.config_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSConfigRole",
      opts=ResourceOptions(parent=self)
    )

    self.config_recorder = aws.cfg.Recorder(
      f"{self.region.replace('-', '')}-secure-projectx-config-recorder",
      name=f"secure-projectx-config-recorder-{self.region}",
      role_arn=self.config_role.arn,
      recording_group=aws.cfg.RecorderRecordingGroupArgs(
        all_supported=True,
        include_global_resource_types=False
      ),
      opts=ResourceOptions(parent=self)
    )

    self.config_delivery_channel = aws.cfg.DeliveryChannel(
      f"{self.region.replace('-', '')}-secure-projectx-config-delivery",
      name=f"secure-projectx-config-delivery-{self.region}",
      s3_bucket_name=self.config_bucket.bucket,
      s3_key_prefix="config-logs/",
      sns_topic_arn=self.sns_topic.arn,
      opts=ResourceOptions(parent=self)
    )

    self.config_recorder_status = aws.cfg.RecorderStatus(
      f"{self.region.replace('-', '')}-secure-projectx-config-recorder-status",
      name=self.config_recorder.name,
      is_enabled=True,
      opts=ResourceOptions(parent=self)
    )

  def setup_vpc_flow_logs(self, vpc_id: pulumi.Input[str], opts: Optional[ResourceOptions] = None):
    """Setup VPC Flow Logs for network monitoring"""
    opts = opts or ResourceOptions(parent=self)
    self.vpc_flow_logs = aws.ec2.FlowLog(
      f"{self.region.replace('-', '')}-secure-projectx-vpc-flow-logs",
      vpc_id=vpc_id,
      traffic_type="ALL",
      log_destination=self.vpc_flow_log_group.arn,
      iam_role_arn=self.flow_logs_role.arn,
      log_destination_type="cloud-watch-logs",
      tags={
        **self.tags,
        "Name": f"secure-projectx-vpc-flow-logs-{self.region}",
        "Purpose": "NetworkMonitoring"
      },
      opts = opts
    )

  def setup_security_alarms(self,
                           vpc_id: pulumi.Input[str],
                           s3_bucket_names: List[pulumi.Input[str]],
                           rds_instance_identifiers: List[pulumi.Input[str]],
                           opts: Optional[ResourceOptions] = None):
    """Setup CloudWatch alarms for security monitoring"""
    opts = opts or ResourceOptions(parent=self)
    self.vpc_flow_logs_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.region.replace('-', '')}-secure-projectx-vpc-flow-logs-alarm",
      name=f"secure-projectx-vpc-flow-logs-delivery-failures-{self.region}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="DeliveryErrors",
      namespace="AWS/VPC",
      period=300,
      statistic="Sum",
      threshold=0,
      alarm_description="VPC Flow Logs delivery failures",
      alarm_actions=[self.sns_topic.arn.apply(lambda arn: arn)],
      dimensions={
        "VPC": vpc_id
      },
      tags=self.tags,
      opts=opts
    )

    self.guardduty_findings_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.region.replace('-', '')}-secure-projectx-guardduty-findings-alarm",
      name=f"secure-projectx-guardduty-high-severity-findings-{self.region}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=1,
      metric_name="FindingCount",
      namespace="AWS/GuardDuty",
      period=300,
      statistic="Sum",
      threshold=0,
      alarm_description="High severity GuardDuty findings detected",
      alarm_actions=[self.critical_sns_topic.arn],
      dimensions={
        "DetectorId": self.guardduty_detector.id
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.failed_login_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.region.replace('-', '')}-secure-projectx-failed-login-alarm",
      name=f"secure-projectx-console-login-failures-{self.region}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="ConsoleLoginFailures",
      namespace="CloudWatchCustomMetrics",
      period=300,
      statistic="Sum",
      threshold=5,
      alarm_description="Multiple console login failures detected",
      alarm_actions=[self.sns_topic.arn],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    for bucket_name in s3_bucket_names:
      self.s3_access_alarm = aws.cloudwatch.MetricAlarm(
        f"{self.region.replace('-', '')}-secure-projectx-s3-access-alarm-{bucket_name}",
        name=f"secure-projectx-s3-unauthorized-access-{bucket_name}-{self.region}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="UnauthorizedAccessAttempts",
        namespace="AWS/S3",
        period=300,
        statistic="Sum",
        threshold=0,
        alarm_description=f"Unauthorized access attempts to S3 bucket {bucket_name}",
        alarm_actions=[self.critical_sns_topic.arn],
        dimensions={
          "BucketName": bucket_name
        },
        tags=self.tags,
        opts=ResourceOptions(parent=self)
      )

    for rds_identifier in rds_instance_identifiers:
      self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"{self.region.replace('-', '')}-secure-projectx-rds-cpu-alarm-{rds_identifier}",
        name=f"secure-projectx-rds-high-cpu-{rds_identifier}-{self.region}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description=f"High CPU utilization on RDS instance {rds_identifier}",
        alarm_actions=[self.sns_topic.arn],
        dimensions={
          "DBInstanceIdentifier": rds_identifier
        },
        tags=self.tags,
        opts=ResourceOptions(parent=self)
      )