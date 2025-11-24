"""ElastiCache Redis Cluster"""
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

def create_cache(
    environment_suffix: str,
    private_subnet_ids: List[pulumi.Output[str]],
    security_group_id: pulumi.Output[str],
    tags: Dict[str, str]
) -> Dict[str, Any]:
    """Create ElastiCache Redis cluster"""

    # Create subnet group
    cache_subnet_group = aws.elasticache.SubnetGroup(
        f"payment-cache-subnet-group-{environment_suffix}",
        subnet_ids=private_subnet_ids,
        description=f"Subnet group for payment cache {environment_suffix}",
        tags={**tags, "Name": f"payment-cache-subnet-group-{environment_suffix}"}
    )

    # Create Redis cluster
    cluster = aws.elasticache.Cluster(
        f"payment-cache-{environment_suffix}",
        cluster_id=f"payment-cache-{environment_suffix}",
        engine="redis",
        engine_version="7.0",
        node_type="cache.t3.micro",
        num_cache_nodes=1,
        parameter_group_name="default.redis7",
        port=6379,
        subnet_group_name=cache_subnet_group.name,
        security_group_ids=[security_group_id],
        snapshot_retention_limit=1,
        snapshot_window="03:00-05:00",
        tags={**tags, "Name": f"payment-cache-{environment_suffix}"}
    )

    return {
        "cluster": cluster,
        "subnet_group": cache_subnet_group
    }
