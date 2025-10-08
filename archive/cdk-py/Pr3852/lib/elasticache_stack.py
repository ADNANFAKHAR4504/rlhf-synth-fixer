from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticache as elasticache,
    NestedStack,
    CfnOutput,
)
from constructs import Construct


class ElastiCacheStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get private subnet IDs
        private_subnets = vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        )

        # Subnet group
        subnet_group = elasticache.CfnSubnetGroup(
            self,
            "RedisSubnetGroup",
            description="Subnet group for Redis cluster",
            subnet_ids=private_subnets.subnet_ids,
            cache_subnet_group_name="marketplace-redis-subnet-group",
        )

        # Redis Replication Group with cluster mode enabled
        self.redis_cluster = elasticache.CfnReplicationGroup(
            self,
            "RedisCluster",
            replication_group_description="Marketplace Redis cluster with cluster mode enabled",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.r6g.large",
            num_node_groups=6,  # 6 shards as required
            replicas_per_node_group=1,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=subnet_group.cache_subnet_group_name,
            security_group_ids=[security_group.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auto_minor_version_upgrade=True,
        )

        self.redis_cluster.add_dependency(subnet_group)

        CfnOutput(
            self,
            "RedisEndpoint",
            value=self.redis_cluster.attr_configuration_end_point_address,
            export_name="RedisClusterEndpoint",
        )
