# Multi-Region S3 Disaster Recovery Solution

This implementation creates a comprehensive S3 disaster recovery solution with same-region replication, monitoring, and lifecycle management using AWS CDK with Python.

## Architecture Overview

The solution deploys:
- Primary and replica S3 buckets in us-east-1
- KMS encryption keys for each bucket
- IAM replication role with least privilege
- S3 replication configuration with RTC
- CloudWatch alarms and dashboard
- Lifecycle policies for Glacier transition

## File: lib/s3_replication_stack.py

```python
"""S3 Replication Stack for Disaster Recovery Solution."""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct


class S3ReplicationStackProps(cdk.StackProps):
    """Props for S3ReplicationStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class S3ReplicationStack(Stack):
    """Stack for S3 Replication Disaster Recovery Solution."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[S3ReplicationStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create KMS keys for encryption
        primary_key = kms.Key(
            self,
            f"PrimaryKey{environment_suffix}",
            description=f"KMS key for primary S3 bucket - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        replica_key = kms.Key(
            self,
            f"ReplicaKey{environment_suffix}",
            description=f"KMS key for replica S3 bucket - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create primary S3 bucket
        primary_bucket = s3.Bucket(
            self,
            f"PrimaryBucket{environment_suffix}",
            bucket_name=f"primary-bucket-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=primary_key,
            transfer_acceleration=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Create replica S3 bucket
        replica_bucket = s3.Bucket(
            self,
            f"ReplicaBucket{environment_suffix}",
            bucket_name=f"replica-bucket-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=replica_key,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Add lifecycle rule to replica bucket
        replica_bucket.add_lifecycle_rule(
            id=f"GlacierTransition{environment_suffix}",
            transitions=[
                s3.Transition(
                    storage_class=s3.StorageClass.GLACIER,
                    transition_after=cdk.Duration.days(90),
                )
            ],
        )

        # Create IAM role for replication
        replication_role = iam.Role(
            self,
            f"ReplicationRole{environment_suffix}",
            role_name=f"s3-replication-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
        )

        # Grant permissions to replication role
        primary_bucket.grant_read(replication_role)
        replica_bucket.grant_write(replication_role)
        primary_key.grant_decrypt(replication_role)
        replica_key.grant_encrypt(replication_role)

        # Configure S3 replication using L1 construct
        cfn_replication_config = s3.CfnBucket.ReplicationConfigurationProperty(
            role=replication_role.role_arn,
            rules=[
                s3.CfnBucket.ReplicationRuleProperty(
                    id=f"ReplicationRule{environment_suffix}",
                    status="Enabled",
                    priority=1,
                    destination=s3.CfnBucket.ReplicationDestinationProperty(
                        bucket=replica_bucket.bucket_arn,
                        encryption_configuration=s3.CfnBucket.EncryptionConfigurationProperty(
                            replica_kms_key_id=replica_key.key_arn,
                        ),
                        replication_time=s3.CfnBucket.ReplicationTimeProperty(
                            status="Enabled",
                            time=s3.CfnBucket.ReplicationTimeValueProperty(
                                minutes=15
                            )
                        ),
                        metrics=s3.CfnBucket.MetricsProperty(
                            status="Enabled",
                            event_threshold=s3.CfnBucket.ReplicationTimeValueProperty(
                                minutes=15
                            )
                        ),
                    ),
                    delete_marker_replication=s3.CfnBucket.DeleteMarkerReplicationProperty(
                        status="Enabled"
                    ),
                )
            ],
        )

        # Apply replication configuration to primary bucket
        cfn_primary_bucket = primary_bucket.node.default_child
        cfn_primary_bucket.replication_configuration = cfn_replication_config

        # Add bucket policies for encryption in transit
        primary_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedTransport",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    primary_bucket.bucket_arn,
                    f"{primary_bucket.bucket_arn}/*",
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                },
            )
        )

        replica_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedTransport",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    replica_bucket.bucket_arn,
                    f"{replica_bucket.bucket_arn}/*",
                ],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                },
            )
        )

        # Create CloudWatch alarm for replication latency
        replication_alarm = cloudwatch.Alarm(
            self,
            f"ReplicationLatencyAlarm{environment_suffix}",
            alarm_name=f"s3-replication-latency-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/S3",
                metric_name="ReplicationLatency",
                dimensions_map={
                    "SourceBucket": primary_bucket.bucket_name,
                    "DestinationBucket": replica_bucket.bucket_name,
                },
                statistic="Maximum",
                period=cdk.Duration.minutes(5),
            ),
            threshold=900000,  # 15 minutes in milliseconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )

        # Create CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"ReplicationDashboard{environment_suffix}",
            dashboard_name=f"s3-replication-dashboard-{environment_suffix}",
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Replication Latency",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="ReplicationLatency",
                        dimensions_map={
                            "SourceBucket": primary_bucket.bucket_name,
                            "DestinationBucket": replica_bucket.bucket_name,
                        },
                        statistic="Average",
                    )
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Operations Pending Replication",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/S3",
                        metric_name="OperationsPendingReplication",
                        dimensions_map={
                            "SourceBucket": primary_bucket.bucket_name,
                            "DestinationBucket": replica_bucket.bucket_name,
                        },
                        statistic="Average",
                    )
                ],
            )
        )

        # Create CloudWatch Logs group
        log_group = logs.LogGroup(
            self,
            f"ReplicationLogsGroup{environment_suffix}",
            log_group_name=f"/aws/s3/replication/{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Outputs
        CfnOutput(
            self,
            "PrimaryBucketUrl",
            value=primary_bucket.bucket_website_url,
            description="Primary bucket URL",
        )

        CfnOutput(
            self,
            "PrimaryBucketArn",
            value=primary_bucket.bucket_arn,
            description="Primary bucket ARN",
        )

        CfnOutput(
            self,
            "ReplicaBucketUrl",
            value=replica_bucket.bucket_website_url,
            description="Replica bucket URL",
        )

        CfnOutput(
            self,
            "ReplicaBucketArn",
            value=replica_bucket.bucket_arn,
            description="Replica bucket ARN",
        )

        CfnOutput(
            self,
            "ReplicationRoleArn",
            value=replication_role.role_arn,
            description="Replication IAM role ARN",
        )

        CfnOutput(
            self,
            "DashboardUrl",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={dashboard.dashboard_name}",
            description="CloudWatch dashboard URL",
        )
```

## File: lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import the S3 replication stack
from .s3_replication_stack import S3ReplicationStack, S3ReplicationStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties,
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create the S3 Replication stack as a nested stack
    class NestedS3ReplicationStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the S3ReplicationStack logic here
        self.s3_replication_stack = S3ReplicationStack(
            self, "Resource", props=props
        )

    s3_props = S3ReplicationStackProps(
        environment_suffix=environment_suffix
    )

    s3_replication_stack = NestedS3ReplicationStack(
        self,
        f"S3ReplicationStack{environment_suffix}",
        props=s3_props
    )
```

## Implementation Notes

This implementation provides:

1. **S3 Buckets**: Primary and replica buckets with versioning enabled
2. **KMS Encryption**: Separate keys for each bucket with key rotation
3. **Replication**: Same-region replication with RTC enabled (15-minute SLA)
4. **Lifecycle**: Glacier transition after 90 days on replica bucket
5. **Monitoring**: CloudWatch alarms and dashboard for replication metrics
6. **Security**: Bucket policies enforcing encryption in transit
7. **IAM**: Least privilege replication role

The solution uses nested stacks to organize resources and includes all required outputs for monitoring and management.
