"""
redis_stack.py

ElastiCache Redis cluster with TLS encryption and Secrets Manager integration
Provides session management and caching for healthcare analytics platform
"""

from typing import Optional, List
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class RedisStackArgs:
    """Arguments for Redis stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]]
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids


class RedisStack(pulumi.ComponentResource):
    """
    ElastiCache Redis cluster with TLS encryption
    Includes Secrets Manager for Redis authentication
    """

    def __init__(
        self,
        name: str,
        args: RedisStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:redis:RedisStack', name, None, opts)

        # Create security group for Redis
        self.redis_sg = aws.ec2.SecurityGroup(
            f"redis-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description='Security group for ElastiCache Redis cluster',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=6379,
                    to_port=6379,
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow Redis access from VPC'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={
                **args.tags,
                'Name': f'redis-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create subnet group for Redis
        self.redis_subnet_group = aws.elasticache.SubnetGroup(
            f"redis-subnet-group-{args.environment_suffix}",
            subnet_ids=args.private_subnet_ids,
            description='Subnet group for ElastiCache Redis cluster',
            tags={
                **args.tags,
                'Name': f'redis-subnet-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Generate random auth token for Redis
        import random
        import string
        auth_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        # Store Redis auth token in Secrets Manager
        self.redis_secret = aws.secretsmanager.Secret(
            f"redis-auth-{args.environment_suffix}",
            name=f"redis-auth-{args.environment_suffix}",
            description='Redis authentication token for healthcare analytics platform',
            tags={
                **args.tags,
                'Name': f'redis-auth-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"redis-auth-version-{args.environment_suffix}",
            secret_id=self.redis_secret.id,
            secret_string=json.dumps({
                'auth_token': auth_token,
                'port': 6379
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache replication group (Redis cluster)
        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f"redis-cluster-{args.environment_suffix}",
            replication_group_id=f"redis-{args.environment_suffix}",
            description='Redis cluster for healthcare analytics session management',
            engine='redis',
            engine_version='7.0',
            node_type='cache.t3.micro',
            num_cache_clusters=2,
            parameter_group_name='default.redis7',
            port=6379,
            subnet_group_name=self.redis_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=auth_token,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window='03:00-05:00',
            maintenance_window='mon:05:00-mon:07:00',
            auto_minor_version_upgrade=True,
            tags={
                **args.tags,
                'Name': f'redis-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.redis_endpoint = self.redis_cluster.primary_endpoint_address
        self.redis_port = pulumi.Output.from_input(6379)
        self.redis_secret_arn = self.redis_secret.arn

        self.register_outputs({
            'redis_endpoint': self.redis_endpoint,
            'redis_port': self.redis_port,
            'redis_secret_arn': self.redis_secret_arn
        })
