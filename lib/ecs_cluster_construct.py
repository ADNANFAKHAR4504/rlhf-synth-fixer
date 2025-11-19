"""
EcsClusterConstruct - ECS Fargate cluster with CloudWatch Container Insights
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_logs as logs
)


class EcsClusterConstruct(Construct):
    """
    Creates ECS Fargate cluster with:
    - Fargate and Fargate Spot capacity providers
    - CloudWatch Container Insights enabled
    - KMS key for log encryption
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create KMS key for log encryption
        self.log_key = kms.Key(
            self,
            f"LogKey-{environment_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create ECS cluster with CloudMap namespace for service discovery
        self.cluster = ecs.Cluster(
            self,
            f"Cluster-{environment_suffix}",
            cluster_name=f"microservices-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,  # Enable Container Insights
            enable_fargate_capacity_providers=True,
            default_cloud_map_namespace=ecs.CloudMapNamespaceOptions(
                name=f"{environment_suffix}.local",
                vpc=vpc
            )
        )

        cdk.Tags.of(self.cluster).add("Name", f"microservices-cluster-{environment_suffix}")
        cdk.Tags.of(self.cluster).add("Environment", environment_suffix)
