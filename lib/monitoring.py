from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json
from typing import Dict


class MonitoringModule(Construct):
    """
    Creates VPC Flow Logs and S3 storage with lifecycle policies.
    Implements monitoring and audit capabilities for network traffic.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        payment_vpc_id: str,
        analytics_vpc_id: str,
        environment_suffix: str,
        region: str = "us-east-1",
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = region
        self.common_tags = common_tags or {}

        # Get current AWS account ID for unique bucket naming
        self.caller_identity = DataAwsCallerIdentity(self, "current")

        # Create S3 bucket for Payment VPC flow logs
        self.payment_logs_bucket = self._create_flow_logs_bucket("payment")

        # Create S3 bucket for Analytics VPC flow logs
        self.analytics_logs_bucket = self._create_flow_logs_bucket("analytics")

        # Create IAM role for Flow Logs
        self.flow_logs_role = self._create_flow_logs_role()

        # Enable VPC Flow Logs for Payment VPC
        self.payment_flow_log = self._create_flow_log(
            payment_vpc_id,
            "payment",
            self.payment_logs_bucket.arn
        )

        # Enable VPC Flow Logs for Analytics VPC
        self.analytics_flow_log = self._create_flow_log(
            analytics_vpc_id,
            "analytics",
            self.analytics_logs_bucket.arn
        )

    def _create_flow_logs_bucket(self, vpc_name: str) -> S3Bucket:
        """Create S3 bucket with lifecycle policy for flow logs storage"""

        # Create S3 bucket with account ID for global uniqueness
        bucket_name = (
            f"flowlogs-{vpc_name}-{self.environment_suffix}-"
            f"{self.caller_identity.account_id}-{self.region}"
        )
        bucket = S3Bucket(
            self,
            f"s3-flowlogs-{vpc_name}-{self.environment_suffix}",
            bucket=bucket_name,
            force_destroy=True,  # Allow bucket to be destroyed with contents
            tags={
                "Name": f"s3-flowlogs-{vpc_name}-{self.environment_suffix}",
                "Purpose": "VPC Flow Logs",
                **self.common_tags
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            f"s3-block-public-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ]
        )

        # Configure lifecycle policy for 90-day retention
        S3BucketLifecycleConfiguration(
            self,
            f"s3-lifecycle-{vpc_name}-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="expire-old-logs",
                    status="Enabled",
                    expiration=[S3BucketLifecycleConfigurationRuleExpiration(
                        days=90
                    )]
                )
            ]
        )

        return bucket

    def _create_flow_logs_role(self) -> IamRole:
        """Create IAM role for VPC Flow Logs to write to S3"""

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

        role = IamRole(
            self,
            f"role-flowlogs-{self.environment_suffix}",
            name=f"role-flowlogs-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"role-flowlogs-{self.environment_suffix}",
                **self.common_tags
            }
        )

        # Attach policy for S3 access
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"{self.payment_logs_bucket.arn}/*",
                        f"{self.analytics_logs_bucket.arn}/*",
                        self.payment_logs_bucket.arn,
                        self.analytics_logs_bucket.arn
                    ]
                }
            ]
        }

        IamRolePolicy(
            self,
            f"policy-flowlogs-{self.environment_suffix}",
            name=f"policy-flowlogs-{self.environment_suffix}",
            role=role.id,
            policy=json.dumps(policy_document)
        )

        return role

    def _create_flow_log(
        self,
        vpc_id: str,
        vpc_name: str,
        bucket_arn: str
    ) -> FlowLog:
        """Enable VPC Flow Logs with S3 destination"""

        flow_log = FlowLog(
            self,
            f"flowlog-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc_id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=bucket_arn,
            tags={
                "Name": f"flowlog-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return flow_log
