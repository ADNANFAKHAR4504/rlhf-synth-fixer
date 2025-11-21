"""
TapStack - Main CDK stack for container orchestration platform
Orchestrates all constructs for ECS, App Mesh, ALB, and monitoring
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct

from .networking_construct import NetworkingConstruct
from .ecs_cluster_construct import EcsClusterConstruct
from .app_mesh_construct import AppMeshConstruct
from .ecr_construct import EcrConstruct
from .alb_construct import AlbConstruct
from .microservices_construct import MicroservicesConstruct
from .monitoring_construct import MonitoringConstruct
from .secrets_construct import SecretsConstruct


class TapStackProps(cdk.StackProps):
    """
    Properties for TapStack

    Args:
        environment_suffix: Suffix for resource naming (e.g., 'dev', 'prod')
        **kwargs: Additional CloudFormation stack properties
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for container orchestration platform.

    Creates:
    - VPC with public/private subnets across 3 AZs
    - ECS Fargate cluster with Fargate Spot
    - AWS App Mesh for service discovery
    - Application Load Balancer with path routing
    - ECR repositories with scanning
    - 3 microservices with auto-scaling
    - CloudWatch monitoring and dashboards
    - Secrets Manager for credentials
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or default to 'dev'
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create networking (VPC with public/private subnets)
        networking = NetworkingConstruct(
            self,
            f"Networking{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create secrets for database credentials
        secrets = SecretsConstruct(
            self,
            f"Secrets{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create ECS cluster with Fargate and Fargate Spot
        ecs_cluster = EcsClusterConstruct(
            self,
            f"EcsCluster{environment_suffix}",
            vpc=networking.vpc,
            environment_suffix=environment_suffix
        )

        # Create App Mesh for service discovery and mTLS
        app_mesh = AppMeshConstruct(
            self,
            f"AppMesh{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create ECR repositories for container images
        ecr = EcrConstruct(
            self,
            f"Ecr{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create Application Load Balancer
        alb = AlbConstruct(
            self,
            f"Alb{environment_suffix}",
            vpc=networking.vpc,
            environment_suffix=environment_suffix
        )

        # Create microservices (3 services with auto-scaling)
        microservices = MicroservicesConstruct(
            self,
            f"Microservices{environment_suffix}",
            vpc=networking.vpc,
            cluster=ecs_cluster.cluster,
            mesh=app_mesh.mesh,
            alb=alb.alb,
            listener=alb.listener,
            ecr_repos=ecr.repositories,
            db_secret=secrets.db_secret,
            log_key=ecs_cluster.log_key,
            environment_suffix=environment_suffix
        )

        # Create monitoring dashboards and alarms
        monitoring = MonitoringConstruct(
            self,
            f"Monitoring{environment_suffix}",
            cluster=ecs_cluster.cluster,
            services=microservices.services,
            alb=alb.alb,
            environment_suffix=environment_suffix
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "VpcId",
            value=networking.vpc.vpc_id,
            description="VPC ID"
        )

        cdk.CfnOutput(
            self,
            "ClusterName",
            value=ecs_cluster.cluster.cluster_name,
            description="ECS Cluster Name"
        )

        cdk.CfnOutput(
            self,
            "MeshName",
            value=app_mesh.mesh.mesh_name,
            description="App Mesh Name"
        )

        cdk.CfnOutput(
            self,
            "LoadBalancerDns",
            value=alb.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS"
        )

        for name, repo in ecr.repositories.items():
            cdk.CfnOutput(
                self,
                f"EcrRepo{name.capitalize()}",
                value=repo.repository_uri,
                description=f"ECR Repository URI for {name}"
            )
