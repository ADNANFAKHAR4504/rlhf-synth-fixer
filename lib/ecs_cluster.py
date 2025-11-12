"""ECS cluster with Fargate capacity providers."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders


class EcsClusterStack(Construct):
    """ECS cluster with Fargate and Fargate Spot capacity providers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        # Create ECS cluster
        self.cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"payment-cluster-{environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled",
            }],
            tags={
                "Name": f"payment-cluster-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Configure capacity providers
        from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import (
            EcsClusterCapacityProvidersDefaultCapacityProviderStrategy
        )

        EcsClusterCapacityProviders(
            self,
            "cluster_capacity_providers",
            cluster_name=self.cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[
                EcsClusterCapacityProvidersDefaultCapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=50,
                    base=0,
                ),
                EcsClusterCapacityProvidersDefaultCapacityProviderStrategy(
                    capacity_provider="FARGATE",
                    weight=50,
                    base=0,
                ),
            ],
        )

    @property
    def cluster_id(self):
        return self.cluster.id

    @property
    def cluster_name(self):
        return self.cluster.name
