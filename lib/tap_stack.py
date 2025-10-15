"""tap_stack.py
Main CDK stack orchestrator for healthcare SaaS disaster recovery infrastructure.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from lib.networking_construct import NetworkingConstruct
from lib.security_construct import SecurityConstruct
from lib.storage_construct import StorageConstruct
from lib.database_construct import DatabaseConstruct
from lib.compute_construct import ComputeConstruct
from lib.monitoring_construct import MonitoringConstruct
from lib.backup_construct import BackupConstruct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for healthcare SaaS disaster recovery solution.

    Orchestrates the creation of networking, security, storage, database,
    compute, monitoring, and backup resources across primary and DR regions.
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

        # Primary and DR regions
        primary_region = self.region or 'us-east-1'
        dr_region = 'us-west-2' if primary_region == 'us-east-1' else 'us-east-1'

        # Create security construct (KMS keys)
        security = SecurityConstruct(
            self,
            f"Security-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            dr_region=dr_region
        )

        # Create networking construct (VPC, subnets, security groups)
        networking = NetworkingConstruct(
            self,
            f"Networking-{environment_suffix}",
            environment_suffix=environment_suffix,
            kms_key=security.kms_key
        )

        # Create storage construct (S3 with CRR)
        storage = StorageConstruct(
            self,
            f"Storage-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            dr_region=dr_region,
            kms_key=security.kms_key
        )

        # Create monitoring construct (SNS, CloudWatch)
        monitoring = MonitoringConstruct(
            self,
            f"Monitoring-{environment_suffix}",
            environment_suffix=environment_suffix,
            kms_key=security.kms_key
        )

        # Create database construct (Aurora Global Database)
        database = DatabaseConstruct(
            self,
            f"Database-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=networking.vpc,
            db_security_group=networking.db_security_group,
            kms_key=security.kms_key,
            primary_region=primary_region,
            dr_region=dr_region
        )

        # Create compute construct (ECS Fargate, ALB)
        compute = ComputeConstruct(
            self,
            f"Compute-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=networking.vpc,
            alb_security_group=networking.alb_security_group,
            ecs_security_group=networking.ecs_security_group,
            data_bucket=storage.data_bucket,
            db_cluster=database.db_cluster,
            alarm_topic=monitoring.alarm_topic
        )

        # Create backup construct
        backup = BackupConstruct(
            self,
            f"Backup-{environment_suffix}",
            environment_suffix=environment_suffix,
            db_cluster=database.db_cluster,
            kms_key=security.kms_key,
            dr_region=dr_region
        )

        # Store references for outputs
        self.vpc = networking.vpc
        self.data_bucket = storage.data_bucket
        self.db_cluster = database.db_cluster
        self.alb = compute.alb
        self.ecs_service = compute.ecs_service

        # CloudFormation outputs
        cdk.CfnOutput(
            self,
            "VPCId",
            value=networking.vpc.vpc_id,
            description="VPC ID"
        )

        cdk.CfnOutput(
            self,
            "DataBucketName",
            value=storage.data_bucket.bucket_name,
            description="Healthcare data S3 bucket name"
        )

        cdk.CfnOutput(
            self,
            "DatabaseClusterEndpoint",
            value=database.db_cluster.cluster_endpoint.hostname,
            description="Aurora database cluster endpoint"
        )

        cdk.CfnOutput(
            self,
            "LoadBalancerDNS",
            value=compute.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )

        cdk.CfnOutput(
            self,
            "ECSClusterName",
            value=compute.ecs_cluster.cluster_name,
            description="ECS cluster name"
        )
