"""tap_stack.py
E-Commerce Product Catalog Infrastructure Stack
Handles real-time inventory updates, caching, and data retention
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_kinesis as kinesis,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_s3 as s3,
    aws_kms as kms,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    Properties for TapStack

    Args:
        environment_suffix: Environment identifier for resource naming
    """
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Main CDK Stack for E-Commerce Product Catalog

    Implements:
    - Kinesis stream for inventory updates
    - RDS PostgreSQL for product catalog
    - ElastiCache Redis for caching
    - S3 for compliance archival
    - KMS encryption
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # KMS key for encryption
        kms_key = kms.Key(
            self,
            f"DataKey{environment_suffix}",
            description=f"Encryption key for product catalog - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # VPC for RDS and ElastiCache
        vpc = ec2.Vpc(
            self,
            f"CatalogVpc{environment_suffix}",
            max_azs=2,
            nat_gateways=1
        )

        # Kinesis Data Stream for inventory updates
        inventory_stream = kinesis.Stream(
            self,
            f"InventoryStream{environment_suffix}",
            stream_name=f"inventory-updates-{environment_suffix}",
            shard_count=2,
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=kms_key,
            retention_period=Duration.days(7)
        )

        # RDS PostgreSQL for product catalog
        db_instance = rds.DatabaseInstance(
            self,
            f"CatalogDb{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.SMALL
            ),
            vpc=vpc,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            backup_retention=Duration.days(7),
            removal_policy=RemovalPolicy.DESTROY
        )

        # ElastiCache Redis for caching
        cache_subnet_group = elasticache.CfnSubnetGroup(
            self,
            f"CacheSubnetGroup{environment_suffix}",
            description=f"Subnet group for cache - {environment_suffix}",
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets[0:2]]
        )

        cache_cluster = elasticache.CfnCacheCluster(
            self,
            f"ProductCache{environment_suffix}",
            cache_node_type="cache.t3.micro",
            engine="redis",
            num_cache_nodes=1,
            cache_subnet_group_name=cache_subnet_group.ref,
            vpc_security_group_ids=[vpc.vpc_default_security_group]
        )

        # S3 bucket for compliance archival
        archive_bucket = s3.Bucket(
            self,
            f"ArchiveBucket{environment_suffix}",
            bucket_name=f"catalog-archive-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # CloudWatch Log Group
        log_group = logs.LogGroup(
            self,
            f"CatalogLogs{environment_suffix}",
            log_group_name=f"/aws/catalog/{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Outputs
        CfnOutput(
            self,
            "StreamName",
            value=inventory_stream.stream_name,
            export_name=f"InventoryStreamName-{environment_suffix}"
        )

        CfnOutput(
            self,
            "DbEndpoint",
            value=db_instance.db_instance_endpoint_address,
            export_name=f"DatabaseEndpoint-{environment_suffix}"
        )

        CfnOutput(
            self,
            "ArchiveBucketName",
            value=archive_bucket.bucket_name,
            export_name=f"ArchiveBucket-{environment_suffix}"
        )
