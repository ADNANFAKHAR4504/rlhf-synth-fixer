"""Networking infrastructure for zero-trust architecture."""
from cdktf import TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from constructs import Construct


class NetworkingStack(Construct):
    """Creates VPC and networking resources for zero-trust architecture."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix

        # Get availability zones
        self.azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # Create VPC (no internet gateway for zero-trust)
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Create 3 private subnets across different AZs
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i}-{environment_suffix}",
                    "CostCenter": "payment-processing",
                    "DataClassification": "confidential",
                    "ComplianceScope": "pci-dss-level-1",
                    "Tier": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID for zero-trust network"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[s.id for s in self.private_subnets],
            description="Private subnet IDs"
        )
