from typing import Dict, Any
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.s3_bucket_object_lock_configuration import (
    S3BucketObjectLockConfigurationA,
    S3BucketObjectLockConfigurationRuleA,
    S3BucketObjectLockConfigurationRuleDefaultRetentionA,
)
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.athena_database import AthenaDatabase
from cdktf_cdktf_provider_aws.athena_named_query import AthenaNamedQuery
import json


class ZeroTrustMonitoring(Construct):
    """
    Creates comprehensive monitoring infrastructure for Zero Trust architecture.

    This construct implements:
    - CloudTrail with log file validation and S3 object lock
    - VPC Flow Logs with Athena tables for analysis
    - CloudWatch alarms for suspicious activities
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        account_id: str,
        aws_region: str,
        vpc_id: str,
        kms_key_id: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.account_id = account_id
        self.aws_region = aws_region
        self.vpc_id = vpc_id
        self.kms_key_id = kms_key_id

        # Create S3 buckets for logs
        self.cloudtrail_bucket = self._create_cloudtrail_bucket()
        self.flow_logs_bucket = self._create_flow_logs_bucket()

        # Create CloudTrail
        self.trail = self._create_cloudtrail()

        # Create VPC Flow Logs
        self.flow_logs = self._create_vpc_flow_logs()

        # Create Athena database for flow logs analysis
        self.athena_db = self._create_athena_database()

        # Create CloudWatch alarms for security monitoring
        self._create_security_alarms()

    def _create_cloudtrail_bucket(self) -> S3Bucket:
        """Create S3 bucket for CloudTrail logs with object lock"""

        bucket = S3Bucket(
            self,
            "cloudtrail_bucket",
            bucket=f"zero-trust-cloudtrail-{self.environment_suffix}",
            object_lock_enabled=True,
            tags={
                "Name": f"zero-trust-cloudtrail-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "CloudTrail",
            },
        )

        # Enable versioning (required for object lock)
        S3BucketVersioningA(
            self,
            "cloudtrail_bucket_versioning",
            bucket=bucket.id,
            versioning_configuration={"status": "Enabled"},
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "cloudtrail_bucket_encryption",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key_id,
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ],
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "cloudtrail_bucket_public_access_block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Configure object lock
        S3BucketObjectLockConfigurationA(
            self,
            "cloudtrail_bucket_object_lock",
            bucket=bucket.id,
            rule=S3BucketObjectLockConfigurationRuleA(
                default_retention=S3BucketObjectLockConfigurationRuleDefaultRetentionA(
                    mode="GOVERNANCE",
                    days=30,
                )
            ),
        )

        # Bucket policy for CloudTrail
        # Note: CloudTrail requires specific permissions without conflicting deny statements
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSCloudTrailAclCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": bucket.arn
                },
                {
                    "Sid": "AWSCloudTrailWrite",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{bucket.arn}/AWSLogs/{self.account_id}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Sid": "DenyInsecureTransport",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        bucket.arn,
                        f"{bucket.arn}/*"
                    ],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }

        S3BucketPolicy(
            self,
            "cloudtrail_bucket_policy",
            bucket=bucket.id,
            policy=json.dumps(bucket_policy),
        )

        return bucket

    def _create_flow_logs_bucket(self) -> S3Bucket:
        """Create S3 bucket for VPC Flow Logs"""

        bucket = S3Bucket(
            self,
            "flow_logs_bucket",
            bucket=f"zero-trust-flow-logs-{self.environment_suffix}",
            tags={
                "Name": f"zero-trust-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "FlowLogs",
            },
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "flow_logs_bucket_versioning",
            bucket=bucket.id,
            versioning_configuration={"status": "Enabled"},
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "flow_logs_bucket_encryption",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256",
                        )
                    ),
                )
            ],
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "flow_logs_bucket_public_access_block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        return bucket

    def _create_cloudtrail(self) -> Cloudtrail:
        """Create CloudTrail with log file validation"""

        trail = Cloudtrail(
            self,
            "cloudtrail",
            name=f"zero-trust-trail-{self.environment_suffix}",
            s3_bucket_name=self.cloudtrail_bucket.id,
            enable_log_file_validation=True,
            enable_logging=True,
            include_global_service_events=True,
            is_multi_region_trail=True,
            kms_key_id=self.kms_key_id,
            tags={
                "Name": f"zero-trust-trail-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        return trail

    def _create_vpc_flow_logs(self) -> FlowLog:
        """Create VPC Flow Logs with CloudWatch Logs"""

        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            "flow_logs_log_group",
            name=f"/aws/vpc/flowlogs/{self.environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"zero-trust-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Create IAM role for Flow Logs
        assume_role_policy = {
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

        flow_logs_role = IamRole(
            self,
            "flow_logs_role",
            name=f"zero-trust-flow-logs-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"zero-trust-flow-logs-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Attach policy to role
        role_policy = {
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
                    "Resource": "*"
                }
            ]
        }

        IamRolePolicy(
            self,
            "flow_logs_role_policy",
            name=f"zero-trust-flow-logs-policy-{self.environment_suffix}",
            role=flow_logs_role.id,
            policy=json.dumps(role_policy),
        )

        # Create Flow Log
        flow_log = FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=self.vpc_id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=log_group.arn,
            iam_role_arn=flow_logs_role.arn,
            tags={
                "Name": f"zero-trust-flow-log-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        return flow_log

    def _create_athena_database(self) -> AthenaDatabase:
        """Create Athena database for Flow Logs analysis"""

        # Create Athena results bucket
        results_bucket = S3Bucket(
            self,
            "athena_results_bucket",
            bucket=f"zero-trust-athena-results-{self.environment_suffix}",
            tags={
                "Name": f"zero-trust-athena-results-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Block public access on results bucket
        S3BucketPublicAccessBlock(
            self,
            "athena_results_public_access_block",
            bucket=results_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Create Athena database
        athena_db = AthenaDatabase(
            self,
            "athena_database",
            name=f"zero_trust_flow_logs_{self.environment_suffix.replace('-', '_')}",
            bucket=results_bucket.bucket,
        )

        # Create named query for security analysis
        AthenaNamedQuery(
            self,
            "rejected_connections_query",
            name=f"rejected_connections_{self.environment_suffix}",
            database=athena_db.name,
            query="""
                SELECT
                    sourceaddress,
                    destinationaddress,
                    sourceport,
                    destinationport,
                    protocol,
                    action,
                    COUNT(*) as connection_count
                FROM vpc_flow_logs
                WHERE action = 'REJECT'
                GROUP BY
                    sourceaddress,
                    destinationaddress,
                    sourceport,
                    destinationport,
                    protocol,
                    action
                ORDER BY connection_count DESC
                LIMIT 100;
            """,
            description="Query to find top rejected connections for security analysis",
        )

        return athena_db

    def _create_security_alarms(self) -> None:
        """Create CloudWatch alarms for suspicious API activities"""

        # Alarm for unauthorized API calls
        CloudwatchMetricAlarm(
            self,
            "unauthorized_api_calls_alarm",
            alarm_name=f"zero-trust-unauthorized-api-calls-{self.environment_suffix}",
            alarm_description="Alert on unauthorized API calls",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UnauthorizedAPICalls",
            namespace="CloudTrailMetrics",
            period=300,
            statistic="Sum",
            threshold=5,
            treat_missing_data="notBreaching",
            tags={
                "Name": f"zero-trust-unauthorized-api-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Alarm for IAM policy changes
        CloudwatchMetricAlarm(
            self,
            "iam_policy_changes_alarm",
            alarm_name=f"zero-trust-iam-policy-changes-{self.environment_suffix}",
            alarm_description="Alert on IAM policy changes",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="IAMPolicyChanges",
            namespace="CloudTrailMetrics",
            period=300,
            statistic="Sum",
            threshold=1,
            treat_missing_data="notBreaching",
            tags={
                "Name": f"zero-trust-iam-changes-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Alarm for root account usage
        CloudwatchMetricAlarm(
            self,
            "root_account_usage_alarm",
            alarm_name=f"zero-trust-root-usage-{self.environment_suffix}",
            alarm_description="Alert on root account usage",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="RootAccountUsage",
            namespace="CloudTrailMetrics",
            period=60,
            statistic="Sum",
            threshold=0,
            treat_missing_data="notBreaching",
            tags={
                "Name": f"zero-trust-root-usage-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )
