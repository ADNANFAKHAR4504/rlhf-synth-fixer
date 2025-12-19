"""cache_stack.py

This module defines the CacheStack, which creates ElastiCache Redis cluster
for caching popular content metadata.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2, aws_elasticache as elasticache
from constructs import Construct


class CacheStackProps(cdk.NestedStackProps):
    """Properties for CacheStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        redis_security_group: Optional[ec2.ISecurityGroup] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.redis_security_group = redis_security_group


class CacheStack(cdk.NestedStack):
    """
    CacheStack creates ElastiCache Redis cluster for caching metadata.

    This stack provides:
    - ElastiCache Redis replication group with multi-AZ
    - Subnet group spanning multiple availability zones
    - At least 2 nodes for high availability
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[CacheStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        if not props or not props.vpc:
            raise ValueError("VPC must be provided in props")

        environment_suffix = props.environment_suffix if props else "dev"

        # Create subnet group for ElastiCache
        private_subnets = props.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        )

        self.subnet_group = elasticache.CfnSubnetGroup(
            self,
            "RedisSubnetGroup",
            description="Subnet group for ElastiCache Redis cluster",
            subnet_ids=private_subnets.subnet_ids,
            cache_subnet_group_name=f"redis-subnet-group-{environment_suffix}",
        )

        # Create ElastiCache Redis replication group with multi-AZ
        self.replication_group = elasticache.CfnReplicationGroup(
            self,
            "RedisReplicationGroup",
            replication_group_description="Redis cluster for video metadata caching",
            replication_group_id=f"video-cache-{environment_suffix}",
            engine="redis",
            engine_version="7.1",
            cache_node_type="cache.t4g.medium",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=self.subnet_group.cache_subnet_group_name,
            security_group_ids=[props.redis_security_group.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auto_minor_version_upgrade=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            preferred_maintenance_window="mon:05:00-mon:07:00",
            port=6379,
        )

        self.replication_group.add_dependency(self.subnet_group)

        # Outputs
        cdk.CfnOutput(
            self,
            "RedisPrimaryEndpoint",
            value=self.replication_group.attr_primary_end_point_address,
            description="Redis primary endpoint address",
            export_name=f"RedisPrimaryEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "RedisReaderEndpoint",
            value=self.replication_group.attr_reader_end_point_address,
            description="Redis reader endpoint address",
            export_name=f"RedisReaderEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "RedisPort",
            value=str(self.replication_group.port),
            description="Redis port number",
            export_name=f"RedisPort-{environment_suffix}",
        )
