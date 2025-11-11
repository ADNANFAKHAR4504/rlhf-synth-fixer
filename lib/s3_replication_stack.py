"""S3 Replication Stack for Disaster Recovery Solution."""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, RemovalPolicy, Stack
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
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
        # Note: ReplicationTime requires S3 RTC which needs special configuration
        cfn_replication_config = s3.CfnBucket.ReplicationConfigurationProperty(
            role=replication_role.role_arn,
            rules=[
                s3.CfnBucket.ReplicationRuleProperty(
                    id=f"ReplicationRule{environment_suffix}",
                    status="Enabled",
                    priority=1,
                    filter=s3.CfnBucket.ReplicationRuleFilterProperty(
                        prefix=""
                    ),
                    destination=s3.CfnBucket.ReplicationDestinationProperty(
                        bucket=replica_bucket.bucket_arn,
                        encryption_configuration=s3.CfnBucket.EncryptionConfigurationProperty(
                            replica_kms_key_id=replica_key.key_arn,
                        ),
                        metrics=s3.CfnBucket.MetricsProperty(
                            status="Enabled"
                        ),
                    ),
                    source_selection_criteria=s3.CfnBucket.SourceSelectionCriteriaProperty(
                        sse_kms_encrypted_objects=s3.CfnBucket.SseKmsEncryptedObjectsProperty(
                            status="Enabled"
                        )
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
            value=(
                f"https://console.aws.amazon.com/cloudwatch/home?"
                f"region={self.region}#dashboards:name={dashboard.dashboard_name}"
            ),
            description="CloudWatch dashboard URL",
        )
