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


class NetworkingConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Primary VPC (us-east-1)
        self.primary_vpc = Vpc(
            self,
            "primary_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-primary-vpc-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Secondary VPC (us-west-2)
        self.secondary_vpc = Vpc(
            self,
            "secondary_vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-secondary-vpc-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Primary region subnets (3 AZs)
        self.primary_private_subnets = []
        primary_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        for i, az in enumerate(primary_azs):
            subnet = Subnet(
                self,
                f"primary_private_subnet_{i}",
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-primary-private-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=primary_provider
            )
            self.primary_private_subnets.append(subnet)

        # Secondary region subnets (3 AZs)
        self.secondary_private_subnets = []
        secondary_azs = ["us-west-2a", "us-west-2b", "us-west-2c"]
        for i, az in enumerate(secondary_azs):
            subnet = Subnet(
                self,
                f"secondary_private_subnet_{i}",
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-secondary-private-{i}-{environment_suffix}",
                    "Environment": environment_suffix
                },
                provider=secondary_provider
            )
            self.secondary_private_subnets.append(subnet)

        # Internet Gateway for primary VPC
        self.primary_igw = InternetGateway(
            self,
            "primary_igw",
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-primary-igw-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Internet Gateway for secondary VPC
        self.secondary_igw = InternetGateway(
            self,
            "secondary_igw",
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-secondary-igw-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Route tables for primary VPC
        self.primary_route_table = RouteTable(
            self,
            "primary_route_table",
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-primary-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Route tables for secondary VPC
        self.secondary_route_table = RouteTable(
            self,
            "secondary_route_table",
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-secondary-rt-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # VPC Peering Connection
        self.vpc_peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            vpc_id=self.primary_vpc.id,
            peer_vpc_id=self.secondary_vpc.id,
            peer_region="us-west-2",
            auto_accept=False,
            tags={
                "Name": f"payment-vpc-peering-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Accept VPC Peering in secondary region
        self.vpc_peering_accepter = VpcPeeringConnectionAccepterA(
            self,
            "vpc_peering_accepter",
            vpc_peering_connection_id=self.vpc_peering.id,
            auto_accept=True,
            tags={
                "Name": f"payment-vpc-peering-accepter-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        # Routes for VPC peering in primary VPC
        Route(
            self,
            "primary_peering_route",
            route_table_id=self.primary_route_table.id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            provider=primary_provider
        )

        # Routes for VPC peering in secondary VPC
        Route(
            self,
            "secondary_peering_route",
            route_table_id=self.secondary_route_table.id,
            destination_cidr_block="10.0.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            provider=secondary_provider
        )

        # Associate subnets with route tables
        for i, subnet in enumerate(self.primary_private_subnets):
            RouteTableAssociation(
                self,
                f"primary_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.primary_route_table.id,
                provider=primary_provider
            )

        for i, subnet in enumerate(self.secondary_private_subnets):
            RouteTableAssociation(
                self,
                f"secondary_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=self.secondary_route_table.id,
                provider=secondary_provider
            )

        # Security Groups - Primary Region
        self.primary_db_sg = SecurityGroup(
            self,
            "primary_db_sg",
            name=f"payment-primary-db-sg-{environment_suffix}",
            description="Security group for Aurora database in primary region",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-primary-db-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        self.primary_lambda_sg = SecurityGroup(
            self,
            "primary_lambda_sg",
            name=f"payment-primary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in primary region",
            vpc_id=self.primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-primary-lambda-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Security Groups - Secondary Region
        self.secondary_db_sg = SecurityGroup(
            self,
            "secondary_db_sg",
            name=f"payment-secondary-db-sg-{environment_suffix}",
            description="Security group for Aurora database in secondary region",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16", "10.1.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-secondary-db-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

        self.secondary_lambda_sg = SecurityGroup(
            self,
            "secondary_lambda_sg",
            name=f"payment-secondary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions in secondary region",
            vpc_id=self.secondary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-secondary-lambda-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=secondary_provider
        )

    @property
    def primary_vpc_id(self):
        return self.primary_vpc.id

    @property
    def secondary_vpc_id(self):
        return self.secondary_vpc.id

    @property
    def primary_private_subnet_ids(self):
        return [subnet.id for subnet in self.primary_private_subnets]

    @property
    def secondary_private_subnet_ids(self):
        return [subnet.id for subnet in self.secondary_private_subnets]

    @property
    def primary_db_sg_id(self):
        return self.primary_db_sg.id

    @property
    def secondary_db_sg_id(self):
        return self.secondary_db_sg.id

    @property
    def primary_lambda_sg_id(self):
        return self.primary_lambda_sg.id

    @property
    def secondary_lambda_sg_id(self):
        return self.secondary_lambda_sg.id
