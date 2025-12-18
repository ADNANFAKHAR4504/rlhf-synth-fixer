"""
monitoring_stack.py

Creates monitoring infrastructure: SNS topic, DynamoDB table, S3 buckets
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class MonitoringStack(pulumi.ComponentResource):
    """
    MonitoringStack creates the monitoring infrastructure for compliance scanning.

    Creates:
    - SNS topic for alerts
    - DynamoDB table for compliance history
    - S3 bucket for AWS Config delivery
    - S3 bucket for compliance reports
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        self.environment_suffix = environment_suffix

        # Define tags
        tags = {
            'Environment': 'Production',
            'Compliance': 'Required',
            'ManagedBy': 'Pulumi',
        }

        # Create SNS topic for compliance alerts
        self.sns_topic = aws.sns.Topic(
            f"compliance-alerts-{environment_suffix}",
            display_name=f"Compliance Alerts {environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic subscription (placeholder email)
        self.sns_subscription = aws.sns.TopicSubscription(
            f"compliance-alerts-email-{environment_suffix}",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint="security-team@example.com",
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for compliance history
        self.dynamodb_table = aws.dynamodb.Table(
            f"compliance-history-{environment_suffix}",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="resource_id",
                    type="S",
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="evaluation_timestamp",
                    type="S",
                ),
            ],
            hash_key="resource_id",
            range_key="evaluation_timestamp",
            billing_mode="PAY_PER_REQUEST",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True,
            ),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for AWS Config delivery
        self.config_bucket = aws.s3.Bucket(
            f"config-delivery-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on config bucket
        self.config_bucket_versioning = aws.s3.BucketVersioningV2(
            f"config-delivery-versioning-{environment_suffix}",
            bucket=self.config_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket encryption for config bucket
        self.config_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"config-delivery-encryption-{environment_suffix}",
            bucket=self.config_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            )],
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for compliance reports
        self.reports_bucket = aws.s3.Bucket(
            f"compliance-reports-{environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on reports bucket
        self.reports_bucket_versioning = aws.s3.BucketVersioningV2(
            f"compliance-reports-versioning-{environment_suffix}",
            bucket=self.reports_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled",
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket encryption for reports bucket
        self.reports_bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"compliance-reports-encryption-{environment_suffix}",
            bucket=self.reports_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            )],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
