"""Networking stack for multi-region VPC infrastructure."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class NetworkingStack(Construct):
    """Multi-region VPC networking infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
    ):
        """Initialize networking infrastructure in both regions."""
        super().__init__(scope, construct_id)

        # Get availability zones for both regions
        primary_azs = DataAwsAvailabilityZones(
            self,
            "primary_azs",
            provider=primary_provider,
            state="available",
        )

        secondary_azs = DataAwsAvailabilityZones(
            self,
            "secondary_azs",
            provider=secondary_provider,
            state="available",
        )

        # Create VPC in primary region (us-east-1)
        primary_vpc = Vpc(
            self,
            "primary_vpc",
            provider=primary_provider,
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"primary-vpc-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create VPC in secondary region (us-west-2)
        secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            provider=secondary_provider,
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"secondary-vpc-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create Internet Gateway for primary VPC
        primary_igw = InternetGateway(
            self,
            "primary_igw",
            provider=primary_provider,
            vpc_id=primary_vpc.id,
            tags={
                "Name": f"primary-igw-{environment_suffix}",
            },
        )

        # Create Internet Gateway for secondary VPC
        secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            provider=secondary_provider,
            vpc_id=secondary_vpc.id,
            tags={
                "Name": f"secondary-igw-{environment_suffix}",
            },
        )

        # Create private subnets in primary region (3 AZs)
        primary_private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                provider=primary_provider,
                vpc_id=primary_vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"${{element({primary_azs.fqn}.names, {i})}}",
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"primary-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "private",
                },
            )
            primary_private_subnets.append(subnet)

        # Create private subnets in secondary region (3 AZs)
        secondary_private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"secondary_private_subnet_{i}",
                provider=secondary_provider,
                vpc_id=secondary_vpc.id,
                cidr_block=f"10.1.{i+10}.0/24",
                availability_zone=f"${{element({secondary_azs.fqn}.names, {i})}}",
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"secondary-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "private",
                },
            )
            secondary_private_subnets.append(subnet)

        # Create security group for Aurora in primary region
        primary_db_sg = SecurityGroup(
            self,
            "primary_db_sg",
            provider=primary_provider,
            name=f"primary-aurora-sg-{environment_suffix}",
            description="Security group for Aurora primary cluster",
            vpc_id=primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow Aurora from VPC",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=[primary_vpc.cidr_block],
                ),
                SecurityGroupIngress(
                    description="Allow Aurora from secondary region",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=[secondary_vpc.cidr_block],
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
                "Name": f"primary-aurora-sg-{environment_suffix}",
            },
        )

        # Create security group for Aurora in secondary region
        secondary_db_sg = SecurityGroup(
            self,
            "secondary_db_sg",
            provider=secondary_provider,
            name=f"secondary-aurora-sg-{environment_suffix}",
            description="Security group for Aurora secondary cluster",
            vpc_id=secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow Aurora from VPC",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=[secondary_vpc.cidr_block],
                ),
                SecurityGroupIngress(
                    description="Allow Aurora from primary region",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=[primary_vpc.cidr_block],
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
                "Name": f"secondary-aurora-sg-{environment_suffix}",
            },
        )

        # Create security group for Lambda in primary region
        primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            provider=primary_provider,
            name=f"primary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in primary region",
            vpc_id=primary_vpc.id,
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
                "Name": f"primary-lambda-sg-{environment_suffix}",
            },
        )

        # Create security group for Lambda in secondary region
        secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            provider=secondary_provider,
            name=f"secondary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in secondary region",
            vpc_id=secondary_vpc.id,
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
                "Name": f"secondary-lambda-sg-{environment_suffix}",
            },
        )

        # Create VPC peering connection from primary to secondary
        vpc_peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            provider=primary_provider,
            vpc_id=primary_vpc.id,
            peer_vpc_id=secondary_vpc.id,
            peer_region="us-west-2",
            auto_accept=False,
            tags={
                "Name": f"primary-to-secondary-peering-{environment_suffix}",
            },
        )

        # Accept VPC peering connection in secondary region
        vpc_peering_accepter = VpcPeeringConnectionAccepterA(
            self,
            "vpc_peering_accepter",
            provider=secondary_provider,
            vpc_peering_connection_id=vpc_peering.id,
            auto_accept=True,
            tags={
                "Name": f"secondary-peering-accepter-{environment_suffix}",
            },
        )

        # Create route tables for primary subnets
        primary_route_table = RouteTable(
            self,
            "primary_route_table",
            provider=primary_provider,
            vpc_id=primary_vpc.id,
            tags={
                "Name": f"primary-private-rt-{environment_suffix}",
            },
        )

        # Add route to secondary VPC through peering connection
        Route(
            self,
            "primary_to_secondary_route",
            provider=primary_provider,
            route_table_id=primary_route_table.id,
            destination_cidr_block=secondary_vpc.cidr_block,
            vpc_peering_connection_id=vpc_peering.id,
            depends_on=[vpc_peering_accepter],
        )

        # Associate route table with primary subnets
        for i, subnet in enumerate(primary_private_subnets):
            RouteTableAssociation(
                self,
                f"primary_rt_assoc_{i}",
                provider=primary_provider,
                subnet_id=subnet.id,
                route_table_id=primary_route_table.id,
            )

        # Create route tables for secondary subnets
        secondary_route_table = RouteTable(
            self,
            "secondary_route_table",
            provider=secondary_provider,
            vpc_id=secondary_vpc.id,
            tags={
                "Name": f"secondary-private-rt-{environment_suffix}",
            },
        )

        # Add route to primary VPC through peering connection
        Route(
            self,
            "secondary_to_primary_route",
            provider=secondary_provider,
            route_table_id=secondary_route_table.id,
            destination_cidr_block=primary_vpc.cidr_block,
            vpc_peering_connection_id=vpc_peering.id,
            depends_on=[vpc_peering_accepter],
        )

        # Associate route table with secondary subnets
        for i, subnet in enumerate(secondary_private_subnets):
            RouteTableAssociation(
                self,
                f"secondary_rt_assoc_{i}",
                provider=secondary_provider,
                subnet_id=subnet.id,
                route_table_id=secondary_route_table.id,
            )

        # Export attributes for use in other stacks
        self.primary_vpc_id = primary_vpc.id
        self.secondary_vpc_id = secondary_vpc.id
        self.primary_private_subnet_ids = [s.id for s in primary_private_subnets]
        self.secondary_private_subnet_ids = [s.id for s in secondary_private_subnets]
        self.primary_db_security_group_id = primary_db_sg.id
        self.secondary_db_security_group_id = secondary_db_sg.id
        self.primary_lambda_security_group_id = primary_lambda_sg.id
        self.secondary_lambda_security_group_id = secondary_lambda_sg.id