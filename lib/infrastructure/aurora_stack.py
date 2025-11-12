"""
Aurora PostgreSQL Global Database configuration.
BUG #7: Using wrong engine version
BUG #8: Missing encryption configuration on secondary cluster
BUG #9: Hardcoded password instead of using Secrets Manager
"""

import ipaddress
from dataclasses import dataclass
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class AuroraStack(pulumi.ComponentResource):
    """Aurora PostgreSQL Global Database spanning two regions."""

    @dataclass
    class _NetworkConfig:
        vpc_id: pulumi.Input[str]
        subnet_ids: List[pulumi.Input[str]]
        cidr_block: pulumi.Input[str]
        created: bool

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

        primary_network = self._ensure_network(
            name_prefix="primary",
            environment_suffix=environment_suffix,
            provider=primary_provider,
            region=primary_region,
            tags=tags,
            default_cidr="10.0.0.0/16",
        )

        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-primary-{environment_suffix}",
            subnet_ids=primary_network.subnet_ids,
            tags={**tags, 'Name': f"aurora-subnet-group-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-primary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=primary_network.vpc_id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=[primary_network.cidr_block]
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
            cluster_identifier=f"trading-cluster-primary-{environment_suffix}-new",
            engine="aurora-postgresql",
            engine_version="14.6",  # Must match global cluster
            database_name="trading",
            master_username="dbadmin",
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

        secondary_network = self._ensure_network(
            name_prefix="secondary",
            environment_suffix=environment_suffix,
            provider=secondary_provider,
            region=secondary_region,
            tags=tags,
            default_cidr="10.1.0.0/16",
        )

        self.secondary_subnet_group = aws.rds.SubnetGroup(
            f"aurora-subnet-group-secondary-{environment_suffix}",
            subnet_ids=secondary_network.subnet_ids,
            tags={**tags, 'Name': f"aurora-subnet-group-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_security_group = aws.ec2.SecurityGroup(
            f"aurora-sg-secondary-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=secondary_network.vpc_id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=[secondary_network.cidr_block]
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

        secondary_kms = aws.kms.get_key(
            key_id="alias/aws/rds",
            opts=pulumi.InvokeOptions(parent=self, provider=secondary_provider)
        )

        # BUG #8: Missing storage_encrypted=True on secondary cluster
        # Note: If cluster already exists without global_cluster_identifier, it must be manually deleted
        # or use delete_before_replace to ensure proper replacement
        # IMPORTANT: skip_final_snapshot must be set to True BEFORE deletion can proceed
        # If the cluster already exists with skip_final_snapshot=False, it must be updated first
        self.secondary_cluster = aws.rds.Cluster(
            f"trading-cluster-secondary-{environment_suffix}",
            cluster_identifier=f"trading-cluster-secondary-{environment_suffix}-new",
            engine="aurora-postgresql",
            engine_version="14.6",
            db_subnet_group_name=self.secondary_subnet_group.name,
            vpc_security_group_ids=[self.secondary_security_group.id],
            global_cluster_identifier=self.global_cluster.id,
            kms_key_id=secondary_kms.arn,
            storage_encrypted=True,
            backup_retention_period=7,
            skip_final_snapshot=True,  # Skip snapshot when deleting for replacement
            tags={**tags, 'Name': f"trading-cluster-secondary-{environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                provider=secondary_provider,
                depends_on=[self.primary_cluster],
                # Temporarily removed replace_on_changes to allow update of skip_final_snapshot first
                # After first successful deployment, add back: replace_on_changes=["global_cluster_identifier"]
                delete_before_replace=True,
                retain_on_delete=False,
                ignore_changes=["global_cluster_identifier"]  # Ignore changes to allow update first
            )
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
            opts=ResourceOptions(
                parent=self,
                provider=secondary_provider,
                depends_on=[self.secondary_cluster],
                replace_on_changes=["cluster_identifier"],
                delete_before_replace=True
            )
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

    def _ensure_network(
        self,
        name_prefix: str,
        environment_suffix: str,
        provider: aws.Provider,
        region: str,
        tags: dict,
        default_cidr: str,
    ) -> _NetworkConfig:
        invoke_opts = pulumi.InvokeOptions(provider=provider)

        try:
            existing_vpc = aws.ec2.get_vpc(default=True, opts=invoke_opts)
            existing_subnets = aws.ec2.get_subnets(
                filters=[aws.ec2.GetSubnetsFilterArgs(name="vpc-id", values=[existing_vpc.id])],
                opts=invoke_opts,
            )

            if not existing_subnets.ids:
                raise pulumi.RunError(
                    f"Default VPC in region {region} has no subnets; a dedicated VPC will be created."
                )

            return AuroraStack._NetworkConfig(
                vpc_id=existing_vpc.id,
                subnet_ids=list(existing_subnets.ids),
                cidr_block=existing_vpc.cidr_block,
                created=False,
            )
        except Exception:
            pulumi.log.warn(
                f"No usable default VPC found in region {region}. Provisioning dedicated networking for Aurora."
            )

            network = ipaddress.ip_network(default_cidr)
            vpc = aws.ec2.Vpc(
                f"{name_prefix}-aurora-vpc-{environment_suffix}",
                cidr_block=str(network),
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={**tags, "Name": f"{name_prefix}-aurora-vpc-{environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider),
            )

            availability_zones = aws.get_availability_zones(
                state="available",
                opts=invoke_opts,
            )

            if not availability_zones.names:
                raise pulumi.RunError(f"No availability zones reported for region {region}.")

            subnet_networks = list(network.subnets(new_prefix=24))
            if len(subnet_networks) < 2:
                raise pulumi.RunError("Unable to derive enough subnets from the provided CIDR block.")

            subnet_ids: List[pulumi.Input[str]] = []
            for index, subnet_network in enumerate(subnet_networks[:2]):
                az = availability_zones.names[index % len(availability_zones.names)]
                subnet = aws.ec2.Subnet(
                    f"{name_prefix}-aurora-subnet-{environment_suffix}-{index}",
                    vpc_id=vpc.id,
                    cidr_block=str(subnet_network),
                    availability_zone=az,
                    map_public_ip_on_launch=False,
                    tags={
                        **tags,
                        "Name": f"{name_prefix}-aurora-subnet-{environment_suffix}-{index}",
                    },
                    opts=ResourceOptions(parent=self, provider=provider),
                )
                subnet_ids.append(subnet.id)

            return AuroraStack._NetworkConfig(
                vpc_id=vpc.id,
                subnet_ids=subnet_ids,
                cidr_block=vpc.cidr_block,
                created=True,
            )
