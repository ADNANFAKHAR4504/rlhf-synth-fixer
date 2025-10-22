"""Cache infrastructure stack with ElastiCache Redis."""

from constructs import Construct
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup


class CacheStack(Construct):
    """Cache infrastructure with ElastiCache Redis."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        kms_key_arn: str
    ):
        """Initialize cache stack."""
        super().__init__(scope, construct_id)

        # Create ElastiCache subnet group
        self.cache_subnet_group = ElasticacheSubnetGroup(
            self,
            "cache_subnet_group",
            name=f"healthcare-cache-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            description="Subnet group for healthcare Redis cluster",
            tags={
                "Name": f"healthcare-cache-subnet-group-{environment_suffix}"
            }
        )

        # Create security group for Redis
        self.cache_security_group = SecurityGroup(
            self,
            "cache_security_group",
            name=f"healthcare-cache-sg-{environment_suffix}",
            description="Security group for healthcare Redis cluster",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow Redis access from VPC"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"healthcare-cache-sg-{environment_suffix}"
            }
        )

        # Create ElastiCache Redis replication group with encryption
        # Note: at_rest_encryption_enabled parameter must be enabled when using KMS
        self.redis_cluster = ElasticacheReplicationGroup(
            self,
            "redis_cluster",
            replication_group_id=f"healthcare-redis-{environment_suffix}",
            description="Redis cluster for healthcare session management",
            engine="redis",
            engine_version="7.1",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name="default.redis7",
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.cache_security_group.id],
            kms_key_id=kms_key_arn,
            transit_encryption_enabled=True,
            auth_token="ChangeMe123456789012",
            automatic_failover_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="02:00-03:00",
            maintenance_window="sun:03:00-sun:04:00",
            tags={
                "Name": f"healthcare-redis-{environment_suffix}",
                "HIPAA": "true"
            }
        )

        # Use escape hatch to set at_rest_encryption_enabled as bool
        self.redis_cluster.add_override("at_rest_encryption_enabled", True)

    @property
    def redis_endpoint(self):
        """Return Redis primary endpoint."""
        return self.redis_cluster.primary_endpoint_address

    @property
    def cache_security_group_id(self):
        """Return cache security group ID."""
        return self.cache_security_group.id
