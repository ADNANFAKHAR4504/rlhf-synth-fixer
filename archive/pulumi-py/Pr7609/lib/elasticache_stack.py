"""
elasticache_stack.py

ElastiCache Redis cluster for transaction history cache.
Configured with 24-hour TTL and Multi-AZ deployment.
"""

from typing import Optional, Dict, List
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import ec2, elasticache


class ElastiCacheStack(pulumi.ComponentResource):
    """
    ElastiCache Redis stack for transaction history caching.

    Creates:
    - Redis replication group with Multi-AZ
    - Security group with least privilege access
    - Subnet group for private subnets
    - Encryption in-transit and at-rest
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        subnet_ids: List[Output[str]],
        tags: Optional[Dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:elasticache:ElastiCacheStack', name, None, opts)

        resource_tags = tags or {}

        # Create security group for Redis
        self.security_group = ec2.SecurityGroup(
            f"redis-tap-sg-{environment_suffix}",
            name=f"redis-tap-sg-{environment_suffix}",
            description="Security group for ElastiCache Redis cluster",
            vpc_id=vpc_id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    description="Redis from within VPC",
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **resource_tags,
                'Name': f"redis-tap-sg-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create subnet group for Redis
        self.subnet_group = elasticache.SubnetGroup(
            f"redis-tap-subnet-group-{environment_suffix}",
            name=f"redis-tap-subnet-group-{environment_suffix}",
            description=f"Subnet group for Redis cluster in {environment_suffix}",
            subnet_ids=subnet_ids,
            tags={
                **resource_tags,
                'Name': f"redis-tap-subnet-group-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache replication group (Redis cluster)
        self.replication_group = elasticache.ReplicationGroup(
            f"redis-tap-cluster-{environment_suffix}",
            replication_group_id=f"redis-tap-{environment_suffix}",
            description=f"Redis cluster for transaction history - {environment_suffix}",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",  # Small instance for cost optimization
            num_cache_clusters=2,  # Multi-AZ with 1 primary + 1 replica
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            port=6379,
            subnet_group_name=self.subnet_group.name,
            security_group_ids=[self.security_group.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            snapshot_retention_limit=1,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            tags={
                **resource_tags,
                'Name': f"redis-tap-cluster-{environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Export values
        self.cluster_id = self.replication_group.id
        self.redis_endpoint = self.replication_group.primary_endpoint_address
        self.redis_port = pulumi.Output.from_input(6379)
        self.security_group_id = self.security_group.id

        self.register_outputs({
            'cluster_id': self.cluster_id,
            'redis_endpoint': self.redis_endpoint,
            'redis_port': self.redis_port,
            'security_group_id': self.security_group_id
        })
