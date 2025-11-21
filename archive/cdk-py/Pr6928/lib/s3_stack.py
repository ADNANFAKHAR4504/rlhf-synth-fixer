"""s3_stack.py
S3 buckets with cross-region replication.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from constructs import Construct


class S3StackProps:
    """Properties for S3 stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_key: kms.IKey,
        secondary_key: kms.IKey
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.primary_key = primary_key
        self.secondary_key = secondary_key


class S3Stack(Construct):
    """Creates S3 buckets with cross-region replication."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: S3StackProps
    ):
        super().__init__(scope, construct_id)

        # Secondary bucket (destination for replication)
        self.secondary_bucket = s3.Bucket(
            self,
            f'SecondaryBucket{props.environment_suffix}',
            bucket_name=f'dr-documents-secondary-{props.environment_suffix}-{cdk.Aws.ACCOUNT_ID}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.secondary_key,
            versioned=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=cdk.Duration.days(30)
                        )
                    ]
                )
            ]
        )

        # Create replication role
        replication_role = iam.Role(
            self,
            f'ReplicationRole{props.environment_suffix}',
            assumed_by=iam.ServicePrincipal('s3.amazonaws.com'),
            description='Role for S3 cross-region replication'
        )

        # Grant permissions for replication
        self.secondary_bucket.grant_read_write(replication_role)
        props.primary_key.grant_encrypt_decrypt(replication_role)
        props.secondary_key.grant_encrypt_decrypt(replication_role)

        # Primary bucket (source for replication)
        self.primary_bucket = s3.Bucket(
            self,
            f'PrimaryBucket{props.environment_suffix}',
            bucket_name=f'dr-documents-primary-{props.environment_suffix}-{cdk.Aws.ACCOUNT_ID}',
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.primary_key,
            versioned=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=cdk.Duration.days(30)
                        )
                    ]
                )
            ]
        )

        # Configure replication
        cfn_bucket = self.primary_bucket.node.default_child
        cfn_bucket.replication_configuration = s3.CfnBucket.ReplicationConfigurationProperty(
            role=replication_role.role_arn,
            rules=[
                s3.CfnBucket.ReplicationRuleProperty(
                    destination=s3.CfnBucket.ReplicationDestinationProperty(
                        bucket=self.secondary_bucket.bucket_arn,
                        encryption_configuration=s3.CfnBucket.EncryptionConfigurationProperty(
                            replica_kms_key_id=props.secondary_key.key_arn
                        ),
                        replication_time=s3.CfnBucket.ReplicationTimeProperty(
                            status='Enabled',
                            time=s3.CfnBucket.ReplicationTimeValueProperty(minutes=15)
                        ),
                        metrics=s3.CfnBucket.MetricsProperty(
                            status='Enabled',
                            event_threshold=s3.CfnBucket.ReplicationTimeValueProperty(minutes=15)
                        )
                    ),
                    status='Enabled',
                    priority=1,
                    filter=s3.CfnBucket.ReplicationRuleFilterProperty(prefix=''),
                    delete_marker_replication=s3.CfnBucket.DeleteMarkerReplicationProperty(
                        status='Enabled'
                    )
                )
            ]
        )

        # Tags
        cdk.Tags.of(self.primary_bucket).add('DR-Role', 'Primary-Storage')
        cdk.Tags.of(self.secondary_bucket).add('DR-Role', 'Secondary-Storage')

        # Outputs
        cdk.CfnOutput(
            self,
            'PrimaryBucketName',
            value=self.primary_bucket.bucket_name,
            description='Primary S3 bucket name'
        )
        cdk.CfnOutput(
            self,
            'SecondaryBucketName',
            value=self.secondary_bucket.bucket_name,
            description='Secondary S3 bucket name'
        )