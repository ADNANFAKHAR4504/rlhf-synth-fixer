"""ElastiCache stack for caching layer."""

from constructs import Construct
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup


class CacheStack(Construct):
    """ElastiCache cluster for product data caching."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc_id: str,
        private_subnet_ids: list,
        cache_security_group_id: str,
        environment_suffix: str
    ):
        """Initialize ElastiCache cluster."""
        super().__init__(scope, construct_id)

        # Create subnet group for ElastiCache
        subnet_group = ElasticacheSubnetGroup(
            self,
            "cache_subnet_group",
            name=f"pc-cache-subnet-{environment_suffix}",
            description="Subnet group for product catalog cache",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"product-catalog-cache-subnet-{environment_suffix}"
            }
        )

        # Create ElastiCache replication group (Valkey/Redis)
        self.cache_cluster = ElasticacheReplicationGroup(
            self,
            "cache_cluster",
            replication_group_id=f"pc-{environment_suffix}",
            description="Product catalog cache cluster",
            engine="valkey",
            engine_version="8.0",
            node_type="cache.t3.micro",
            num_cache_clusters=1,
            port=6379,
            subnet_group_name=subnet_group.name,
            security_group_ids=[cache_security_group_id],
            tags={
                "Name": f"product-catalog-cache-{environment_suffix}"
            }
        )

    @property
    def cache_endpoint(self):
        """Return cache primary endpoint."""
        return self.cache_cluster.primary_endpoint_address
