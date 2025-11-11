"""
Aurora PostgreSQL Global Database configuration.
BUG #7: Using wrong engine version
BUG #8: Missing encryption configuration on secondary cluster
BUG #9: Hardcoded password instead of using Secrets Manager
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class AuroraStack(pulumi.ComponentResource):
    """Aurora PostgreSQL Global Database spanning two regions."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:AuroraStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Get VPC and subnets for primary
        primary_vpc = aws.ec2.get_vpc(default=True)
        primary_subnets = aws.ec2.get_subnets(
            filters=[aws.ec2.GetSubnetsFilterArgs(name="vpc-id", values=[primary_vpc.id])]
        )

        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-primary-{environment_suffix}",
            subnet_ids=primary_subnets.ids,
            tags={**tags, 'Name': f"aurora-subnet-group-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-primary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=primary_vpc.id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=["0.0.0.0/0"]  # BUG #10: Too permissive! Should restrict to VPC CIDR
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**tags, 'Name': f"aurora-sg-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # BUG #7: Wrong engine version - using 14.6 instead of 15.4
        self.global_cluster = aws.rds.GlobalCluster(
            f"trading-global-cluster-{environment_suffix}",
            global_cluster_identifier=f"trading-global-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",  # WRONG! Should be 15.4
            database_name="trading",
            storage_encrypted=True,
            opts=ResourceOptions(parent=self)
        )

        # BUG #9: Hardcoded password instead of Secrets Manager
        self.primary_cluster = aws.rds.Cluster(
            f"trading-cluster-primary-{environment_suffix}",
            cluster_identifier=f"trading-cluster-primary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",  # Must match global cluster
            database_name="trading",
            master_username="admin",
            master_password="insecure123",  # BUG #9: Hardcoded, not secret!
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={**tags, 'Name': f"trading-cluster-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_instance = aws.rds.ClusterInstance(
            f"trading-instance-primary-{environment_suffix}",
            identifier=f"trading-instance-primary-{environment_suffix}",
            cluster_identifier=self.primary_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            engine_version="14.6",
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**tags, 'Name': f"trading-instance-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary region setup
        secondary_vpc = aws.ec2.get_vpc(default=True, opts=pulumi.InvokeOptions(provider=secondary_provider))
        secondary_subnets = aws.ec2.get_subnets(
            filters=[aws.ec2.GetSubnetsFilterArgs(name="vpc-id", values=[secondary_vpc.id])],
            opts=pulumi.InvokeOptions(provider=secondary_provider)
        )

        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-secondary-{environment_suffix}",
            subnet_ids=secondary_subnets.ids,
            tags={**tags, 'Name': f"aurora-subnet-group-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-secondary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=secondary_vpc.id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=["0.0.0.0/0"]  # Same permissive bug
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**tags, 'Name': f"aurora-sg-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # BUG #8: Missing storage_encrypted=True on secondary cluster
        self.secondary_cluster = aws.rds.Cluster(
            f"trading-cluster-secondary-{environment_suffix}",
            cluster_identifier=f"trading-cluster-secondary-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            # storage_encrypted=True,  # MISSING!
            backup_retention_period=7,
            tags={**tags, 'Name': f"trading-cluster-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[self.primary_cluster])
        )

        self.secondary_instance = aws.rds.ClusterInstance(
            f"trading-instance-secondary-{environment_suffix}",
            identifier=f"trading-instance-secondary-{environment_suffix}",
            cluster_identifier=self.secondary_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            engine_version="14.6",
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            tags={**tags, 'Name': f"trading-instance-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.global_cluster_id = self.global_cluster.id
        self.primary_cluster_id = self.primary_cluster.id
        self.secondary_cluster_arn = self.secondary_cluster.arn
        self.primary_endpoint = self.primary_cluster.endpoint
        self.secondary_endpoint = self.secondary_cluster.endpoint

        self.register_outputs({
            'global_cluster_id': self.global_cluster.id,
            'primary_cluster_id': self.primary_cluster.id,
            'primary_endpoint': self.primary_cluster.endpoint,
            'secondary_cluster_arn': self.secondary_cluster.arn,
        })
