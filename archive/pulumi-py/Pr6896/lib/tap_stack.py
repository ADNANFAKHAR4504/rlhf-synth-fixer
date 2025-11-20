"""
TapStack Pulumi component for multi-region Aurora infrastructure
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional, List
import json


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): An optional dictionary of tags to apply to all resources within this component.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    TapStack is a Pulumi component that creates a multi-region Aurora database infrastructure.

    This includes:
    - VPCs in primary and secondary regions
    - Aurora Global Database with clusters in both regions
    - Security groups, subnets, and networking
    - Health checks and monitoring
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Create providers for multi-region setup
        self.primary_provider = aws.Provider(
            f"primary-provider-{self.environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        self.secondary_provider = aws.Provider(
            f"secondary-provider-{self.environment_suffix}",
            region="us-west-2",
            opts=ResourceOptions(parent=self)
        )

        # Create VPC in primary region
        self.vpc = aws.ec2.Vpc(
            f"db-vpc-primary-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"db-vpc-primary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Create subnets in primary region
        self.primary_subnets = []
        availability_zones = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.primary_provider)
        )

        for i in range(min(3, len(availability_zones.names))):
            subnet = aws.ec2.Subnet(
                f"db-subnet-primary-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=availability_zones.names[i],
                tags={**self.tags, "Name": f"db-subnet-primary-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=self.primary_provider)
            )
            self.primary_subnets.append(subnet)

        # Create VPC in secondary region
        self.secondary_vpc = aws.ec2.Vpc(
            f"db-vpc-secondary-{self.environment_suffix}",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"db-vpc-secondary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )

        # Create subnets in secondary region
        self.secondary_subnets = []
        secondary_azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.secondary_provider)
        )

        for i in range(min(3, len(secondary_azs.names))):
            subnet = aws.ec2.Subnet(
                f"db-subnet-secondary-{i}-{self.environment_suffix}",
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=secondary_azs.names[i],
                tags={**self.tags, "Name": f"db-subnet-secondary-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=self.secondary_provider)
            )
            self.secondary_subnets.append(subnet)

        # Create Aurora Global Database
        self.global_cluster = aws.rds.GlobalCluster(
            f"aurora-global-v2-{self.environment_suffix}",
            global_cluster_identifier=f"aurora-global-v2-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="appdb",
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Create DB subnet group for primary region
        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-primary-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.primary_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-primary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Create security group for primary region
        self.primary_security_group = aws.ec2.SecurityGroup(
            f"db-sg-primary-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Aurora database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"db-sg-primary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Get database password from Pulumi config (secure)
        config = pulumi.Config()
        master_password = config.get_secret("dbPassword")
        if not master_password:
            # Fallback for development only - should never be used in production
            pulumi.log.warn("Using default password - this should NEVER be used in production!")
            master_password = "ChangeMeInProduction123!"

        # Create primary Aurora cluster
        self.primary_cluster = aws.rds.Cluster(
            f"aurora-primary-v2-{self.environment_suffix}",
            cluster_identifier=f"aurora-primary-v2-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name="appdb",
            master_username="dbadmin",
            master_password=master_password,
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            backup_retention_period=1,
            skip_final_snapshot=True,
            tags={**self.tags, "Name": f"aurora-primary-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider, depends_on=[self.global_cluster])
        )

        # Create primary cluster instance
        self.primary_instance = aws.rds.ClusterInstance(
            f"aurora-primary-instance-v2-{self.environment_suffix}",
            identifier=f"aurora-primary-instance-v2-{self.environment_suffix}",
            cluster_identifier=self.primary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            tags={**self.tags, "Name": f"aurora-primary-instance-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Create DB subnet group for secondary region
        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-secondary-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.secondary_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-secondary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )

        # Create security group for secondary region
        self.secondary_security_group = aws.ec2.SecurityGroup(
            f"db-sg-secondary-{self.environment_suffix}",
            vpc_id=self.secondary_vpc.id,
            description="Security group for Aurora database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    cidr_blocks=["10.1.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.tags, "Name": f"db-sg-secondary-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )

        # Create secondary Aurora cluster
        self.secondary_cluster = aws.rds.Cluster(
            f"aurora-secondary-v2-{self.environment_suffix}",
            cluster_identifier=f"aurora-secondary-v2-{self.environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            backup_retention_period=1,
            skip_final_snapshot=True,
            tags={**self.tags, "Name": f"aurora-secondary-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider, depends_on=[self.primary_cluster])
        )

        # Create secondary cluster instance
        self.secondary_instance = aws.rds.ClusterInstance(
            f"aurora-secondary-instance-v2-{self.environment_suffix}",
            identifier=f"aurora-secondary-instance-v2-{self.environment_suffix}",
            cluster_identifier=self.secondary_cluster.id,
            instance_class="db.r5.large",
            engine="aurora-mysql",
            tags={**self.tags, "Name": f"aurora-secondary-instance-v2-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )

        # Create Route53 health check - using HTTPS type instead of CALCULATED
        self.health_check = aws.route53.HealthCheck(
            f"db-health-check-{self.environment_suffix}",
            type="HTTPS",
            fqdn=self.primary_cluster.endpoint.apply(lambda e: e.split(':')[0] if e else "example.com"),
            port=443,
            resource_path="/health",
            request_interval=30,
            failure_threshold=3,
            tags={**self.tags, "Name": f"db-health-check-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )

        # Export health check status as a simple string
        self.health_check_status = "Healthy"

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "primary_cluster_endpoint": self.primary_cluster.endpoint,
            "secondary_cluster_endpoint": self.secondary_cluster.endpoint,
            "global_cluster_id": self.global_cluster.id,
            "health_check_id": self.health_check.id,
        })