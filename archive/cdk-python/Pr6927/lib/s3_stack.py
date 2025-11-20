"""s3_stack.py
S3 buckets stack with lifecycle policies for log archival.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
)
from constructs import Construct


class S3StackProps:
    """Properties for S3 Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment


class S3Stack(cdk.Stack):
    """
    S3 Stack implementing lifecycle policies for cost optimization.
    Requirement 5: Add lifecycle policies to S3 buckets to transition logs to Glacier after 30 days
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: S3StackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Application logs bucket with Glacier transition (Requirement 5)
        self.logs_bucket = s3.Bucket(
            self,
            f"{environment}-payment-bucket-logs",
            bucket_name=f"{environment}-payment-logs-{cdk.Aws.ACCOUNT_ID}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(
                                30)  # Requirement 5
                        )
                    ]
                )
            ]
        )

        # Transaction audit logs bucket with Glacier transition (Requirement 5)
        self.audit_bucket = s3.Bucket(
            self,
            f"{environment}-payment-bucket-audit",
            bucket_name=f"{environment}-payment-audit-{cdk.Aws.ACCOUNT_ID}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(
                                30)  # Requirement 5
                        )
                    ]
                )
            ]
        )

        # Access logs bucket with Glacier transition (Requirement 5)
        self.access_logs_bucket = s3.Bucket(
            self,
            f"{environment}-payment-bucket-access",
            bucket_name=f"{environment}-payment-access-logs-{cdk.Aws.ACCOUNT_ID}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(
                                30)  # Requirement 5
                        )
                    ]
                )
            ]
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.logs_bucket).add(key, value)
            cdk.Tags.of(self.audit_bucket).add(key, value)
            cdk.Tags.of(self.access_logs_bucket).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "LogsBucketName",
            value=self.logs_bucket.bucket_name,
            export_name=f"{environment}-payment-bucket-logs-name"
        )

        cdk.CfnOutput(
            self,
            "AuditBucketName",
            value=self.audit_bucket.bucket_name,
            export_name=f"{environment}-payment-bucket-audit-name"
        )

        cdk.CfnOutput(
            self,
            "AccessLogsBucketName",
            value=self.access_logs_bucket.bucket_name,
            export_name=f"{environment}-payment-bucket-access-name"
        )
