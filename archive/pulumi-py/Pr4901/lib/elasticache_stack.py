"""
elasticache_stack.py

ElastiCache Redis cluster with cluster mode enabled for horizontal scaling.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional, List


class ElastiCacheStack(pulumi.ComponentResource):
    """
    Creates ElastiCache Redis cluster with cluster mode for HA and scaling.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:elasticache:ElastiCacheStack', name, None, opts)

        self.tags = tags or {}
        child_opts = ResourceOptions(parent=self)

        # Create security group for ElastiCache
        self.security_group = aws.ec2.SecurityGroup(
            f'{name}-elasticache-sg',
            vpc_id=vpc_id,
            description='Security group for ElastiCache Redis cluster',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=6379,
                to_port=6379,
                protocol='tcp',
                cidr_blocks=['10.0.0.0/16']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-elasticache-sg'},
            opts=child_opts
        )

        # Create subnet group
        self.subnet_group = aws.elasticache.SubnetGroup(
            f'{name}-cache-subnet-group',
            subnet_ids=private_subnet_ids,
            description='Subnet group for ElastiCache Redis',
            tags=self.tags,
            opts=child_opts
        )

        # Create parameter group for Redis 7.0
        self.parameter_group = aws.elasticache.ParameterGroup(
            f'{name}-redis-params',
            family='redis7',
            description='Custom parameter group for Redis 7.0 cluster mode',
            parameters=[
                aws.elasticache.ParameterGroupParameterArgs(
                    name='cluster-enabled',
                    value='yes'
                ),
                aws.elasticache.ParameterGroupParameterArgs(
                    name='timeout',
                    value='300'
                )
            ],
            tags=self.tags,
            opts=child_opts
        )

        # Create Redis replication group with cluster mode
        self.replication_group = aws.elasticache.ReplicationGroup(
            f'{name}-redis-cluster',
            replication_group_id=f'{name}-redis',
            description='Redis cluster for GlobeCart session management',
            engine='redis',
            engine_version='7.0',
            node_type='cache.t3.micro',
            port=6379,
            parameter_group_name=self.parameter_group.name,
            subnet_group_name=self.subnet_group.name,
            security_group_ids=[self.security_group.id],
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            num_node_groups=2,
            replicas_per_node_group=1,
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window='03:00-05:00',
            maintenance_window='mon:05:00-mon:07:00',
            auto_minor_version_upgrade=True,
            tags=self.tags,
            opts=child_opts
        )

        # Store outputs
        self.security_group_id = self.security_group.id
        self.configuration_endpoint = self.replication_group.configuration_endpoint_address

        self.register_outputs({
            'security_group_id': self.security_group_id,
            'configuration_endpoint': self.configuration_endpoint,
        })
