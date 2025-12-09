"""VPC and networking configuration with VPC endpoints for Zero Trust architecture"""
from typing import Dict, List
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint


class ZeroTrustVpc(Construct):
    """
    Creates VPC infrastructure with private subnets and VPC endpoints for Zero Trust architecture.

    This construct implements:
    - VPC with private subnets across 3 availability zones
    - VPC endpoints for AWS services to eliminate internet-bound traffic
    - Security groups with least-privilege access
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # Create VPC
        self.vpc = Vpc(
            self,
            "zero_trust_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"zero-trust-vpc-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create private subnets across 3 AZs
        self.private_subnets: List[Subnet] = []
        availability_zones = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        for idx, az in enumerate(availability_zones):
            subnet = Subnet(
                self,
                f"private_subnet_{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"zero-trust-private-subnet-{idx+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Type": "Private",
                },
            )
            self.private_subnets.append(subnet)

        # Create route table for private subnets
        self.private_route_table = RouteTable(
            self,
            "private_route_table",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"zero-trust-private-rt-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Associate private subnets with route table
        for idx, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_subnet_association_{idx}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
            )

        # Create security group for VPC endpoints
        self.endpoint_security_group = SecurityGroup(
            self,
            "endpoint_security_group",
            name=f"zero-trust-endpoint-sg-{environment_suffix}",
            description="Security group for VPC endpoints",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow HTTPS from VPC",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[self.vpc.cidr_block],
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            tags={
                "Name": f"zero-trust-endpoint-sg-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create VPC endpoints for AWS services (Zero Trust requirement)
        self._create_vpc_endpoints()

    def _create_vpc_endpoints(self) -> None:
        """Create VPC endpoints for essential AWS services only"""

        # Essential interface endpoints only (to stay under VPC endpoint limits)
        # Only including the most critical services for Zero Trust architecture
        interface_services = [
            "ec2",
            "ec2messages",
            "ssm",
            "ssmmessages",
            "logs",
            "kms",
        ]

        subnet_ids = [subnet.id for subnet in self.private_subnets]

        for service in interface_services:
            VpcEndpoint(
                self,
                f"endpoint_{service.replace('.', '_')}",
                vpc_id=self.vpc.id,
                service_name=f"com.amazonaws.{self.aws_region}.{service}",
                vpc_endpoint_type="Interface",
                subnet_ids=subnet_ids,
                security_group_ids=[self.endpoint_security_group.id],
                private_dns_enabled=True,
                tags={
                    "Name": f"zero-trust-{service}-endpoint-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                },
            )

        # Gateway endpoints (S3 only - DynamoDB may hit limits)
        # S3 is critical for CloudTrail and Config
        VpcEndpoint(
            self,
            "gateway_endpoint_s3",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_route_table.id],
            tags={
                "Name": f"zero-trust-s3-gateway-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )
