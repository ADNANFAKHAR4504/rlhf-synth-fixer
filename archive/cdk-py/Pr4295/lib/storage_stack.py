"""storage_stack.py

This module defines the StorageStack, which creates RDS PostgreSQL database
and EFS file system for the video processing pipeline.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2, aws_efs as efs, aws_rds as rds, aws_secretsmanager as secretsmanager
from constructs import Construct


class StorageStackProps(cdk.NestedStackProps):
    """Properties for StorageStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        rds_security_group: Optional[ec2.ISecurityGroup] = None,
        efs_security_group: Optional[ec2.ISecurityGroup] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.rds_security_group = rds_security_group
        self.efs_security_group = efs_security_group


class StorageStack(cdk.NestedStack):
    """
    StorageStack creates storage infrastructure for video metadata and processing.

    This stack provides:
    - RDS PostgreSQL database with multi-AZ deployment for metadata storage
    - EFS file system for temporary video processing storage
    - Secrets Manager for database credentials
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[StorageStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        if not props or not props.vpc:
            raise ValueError("VPC must be provided in props")

        environment_suffix = props.environment_suffix if props else "dev"

        # Create database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self,
            "DBSecret",
            secret_name=f"video-processing-db-secret-{environment_suffix}",
            description="RDS PostgreSQL database credentials for video processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "videoadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32,
            ),
        )

        # Create RDS PostgreSQL database with multi-AZ
        self.database = rds.DatabaseInstance(
            self,
            "VideoMetadataDB",
            database_name="videometadata",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16_6
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM
            ),
            credentials=rds.Credentials.from_secret(self.db_secret),
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[props.rds_security_group],
            multi_az=True,
            allocated_storage=100,
            max_allocated_storage=500,
            storage_encrypted=True,
            backup_retention=cdk.Duration.days(7),
            deletion_protection=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            storage_type=rds.StorageType.GP3,
            publicly_accessible=False,
            auto_minor_version_upgrade=True,
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
        )

        # Create EFS file system for temporary video processing storage
        self.file_system = efs.FileSystem(
            self,
            "VideoProcessingEFS",
            vpc=props.vpc,
            file_system_name=f"video-processing-efs-{environment_suffix}",
            security_group=props.efs_security_group,
            encrypted=True,
            lifecycle_policy=efs.LifecyclePolicy.AFTER_30_DAYS,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.ELASTIC,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            enable_automatic_backups=True,
        )

        # Create access point for ECS tasks
        self.access_point = self.file_system.add_access_point(
            "ECSAccessPoint",
            path="/video-processing",
            create_acl=efs.Acl(owner_uid="1000", owner_gid="1000", permissions="755"),
            posix_user=efs.PosixUser(uid="1000", gid="1000"),
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database.db_instance_endpoint_address,
            description="RDS PostgreSQL database endpoint",
            export_name=f"DatabaseEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"DatabaseSecretArn-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "EFSFileSystemId",
            value=self.file_system.file_system_id,
            description="EFS file system ID",
            export_name=f"EFSFileSystemId-{environment_suffix}",
        )
