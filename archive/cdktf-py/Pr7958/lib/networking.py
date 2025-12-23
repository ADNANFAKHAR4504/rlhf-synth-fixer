from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA
from cdktf_cdktf_provider_aws.vpc_peering_connection_options import VpcPeeringConnectionOptions


class NetworkingConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_region: str,
        secondary_region: str
    ):
        super().__init__(scope, construct_id)

        # Primary VPC
        self.primary_vpc = Vpc(
            self,
            "primary-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"primary-vpc-{environment_suffix}"},
            provider=primary_provider
        )

        # Secondary VPC
        self.secondary_vpc = Vpc(
            self,
            "secondary-vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"secondary-vpc-{environment_suffix}"},
            provider=secondary_provider
        )

        # Primary region subnets
        self.primary_public_subnets = []
        self.primary_private_subnets = []

        for i, az in enumerate(["a", "b"]):
            public_subnet = Subnet(
                self,
                f"primary-public-subnet-{az}",
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"{primary_region}{az}",
                map_public_ip_on_launch=True,
                tags={"Name": f"primary-public-{az}-{environment_suffix}"},
                provider=primary_provider
            )
            self.primary_public_subnets.append(public_subnet)

            private_subnet = Subnet(
                self,
                f"primary-private-subnet-{az}",
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=f"{primary_region}{az}",
                tags={"Name": f"primary-private-{az}-{environment_suffix}"},
                provider=primary_provider
            )
            self.primary_private_subnets.append(private_subnet)

        # Secondary region subnets
        self.secondary_public_subnets = []
        self.secondary_private_subnets = []

        for i, az in enumerate(["a", "b"]):
            public_subnet = Subnet(
                self,
                f"secondary-public-subnet-{az}",
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=f"{secondary_region}{az}",
                map_public_ip_on_launch=True,
                tags={"Name": f"secondary-public-{az}-{environment_suffix}"},
                provider=secondary_provider
            )
            self.secondary_public_subnets.append(public_subnet)

            private_subnet = Subnet(
                self,
                f"secondary-private-subnet-{az}",
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{10+i}.0/24",
                availability_zone=f"{secondary_region}{az}",
                tags={"Name": f"secondary-private-{az}-{environment_suffix}"},
                provider=secondary_provider
            )
            self.secondary_private_subnets.append(private_subnet)

        # Internet Gateways
        primary_igw = InternetGateway(
            self,
            "primary-igw",
            vpc_id=self.primary_vpc.id,
            tags={"Name": f"primary-igw-{environment_suffix}"},
            provider=primary_provider
        )

        secondary_igw = InternetGateway(
            self,
            "secondary-igw",
            vpc_id=self.secondary_vpc.id,
            tags={"Name": f"secondary-igw-{environment_suffix}"},
            provider=secondary_provider
        )

        # Route tables for primary region
        primary_public_rt = RouteTable(
            self,
            "primary-public-rt",
            vpc_id=self.primary_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=primary_igw.id
            )],
            tags={"Name": f"primary-public-rt-{environment_suffix}"},
            provider=primary_provider
        )

        for i, subnet in enumerate(self.primary_public_subnets):
            RouteTableAssociation(
                self,
                f"primary-public-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=primary_public_rt.id,
                provider=primary_provider
            )

        # Route tables for secondary region
        secondary_public_rt = RouteTable(
            self,
            "secondary-public-rt",
            vpc_id=self.secondary_vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=secondary_igw.id
            )],
            tags={"Name": f"secondary-public-rt-{environment_suffix}"},
            provider=secondary_provider
        )

        for i, subnet in enumerate(self.secondary_public_subnets):
            RouteTableAssociation(
                self,
                f"secondary-public-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=secondary_public_rt.id,
                provider=secondary_provider
            )

        # VPC Peering
        self.peering_connection = VpcPeeringConnection(
            self,
            "vpc-peering",
            vpc_id=self.primary_vpc.id,
            peer_vpc_id=self.secondary_vpc.id,
            peer_region=secondary_region,
            auto_accept=False,
            tags={"Name": f"vpc-peering-{environment_suffix}"},
            provider=primary_provider
        )

        # Accept peering connection in secondary region
        VpcPeeringConnectionAccepterA(
            self,
            "vpc-peering-accepter",
            vpc_peering_connection_id=self.peering_connection.id,
            auto_accept=True,
            tags={"Name": f"vpc-peering-accepter-{environment_suffix}"},
            provider=secondary_provider
        )

        # Security Groups - Primary Region
        self.primary_alb_sg = SecurityGroup(
            self,
            "primary-alb-sg",
            name=f"primary-alb-sg-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"primary-alb-sg-{environment_suffix}"},
            provider=primary_provider
        )

        self.primary_app_sg = SecurityGroup(
            self,
            "primary-app-sg",
            name=f"primary-app-sg-{environment_suffix}",
            description="Security group for primary application servers",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.primary_alb_sg.id],
                    description="Traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"primary-app-sg-{environment_suffix}"},
            provider=primary_provider
        )

        self.primary_db_sg = SecurityGroup(
            self,
            "primary-db-sg",
            name=f"primary-db-sg-{environment_suffix}",
            description="Security group for primary database",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.primary_app_sg.id],
                    description="MySQL from app servers"
                ),
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.1.0.0/16"],
                    description="MySQL from secondary region"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"primary-db-sg-{environment_suffix}"},
            provider=primary_provider
        )

        self.primary_lambda_sg = SecurityGroup(
            self,
            "primary-lambda-sg",
            name=f"primary-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.primary_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"primary-lambda-sg-{environment_suffix}"},
            provider=primary_provider
        )

        # Security Groups - Secondary Region
        self.secondary_alb_sg = SecurityGroup(
            self,
            "secondary-alb-sg",
            name=f"secondary-alb-sg-{environment_suffix}",
            description="Security group for secondary ALB",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"secondary-alb-sg-{environment_suffix}"},
            provider=secondary_provider
        )

        self.secondary_app_sg = SecurityGroup(
            self,
            "secondary-app-sg",
            name=f"secondary-app-sg-{environment_suffix}",
            description="Security group for secondary application servers",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.secondary_alb_sg.id],
                    description="Traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"secondary-app-sg-{environment_suffix}"},
            provider=secondary_provider
        )

        self.secondary_db_sg = SecurityGroup(
            self,
            "secondary-db-sg",
            name=f"secondary-db-sg-{environment_suffix}",
            description="Security group for secondary database",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.secondary_app_sg.id],
                    description="MySQL from app servers"
                ),
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="MySQL from primary region"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound"
                )
            ],
            tags={"Name": f"secondary-db-sg-{environment_suffix}"},
            provider=secondary_provider
        )

    @property
    def primary_public_subnet_ids(self):
        return [subnet.id for subnet in self.primary_public_subnets]

    @property
    def primary_private_subnet_ids(self):
        return [subnet.id for subnet in self.primary_private_subnets]

    @property
    def secondary_public_subnet_ids(self):
        return [subnet.id for subnet in self.secondary_public_subnets]

    @property
    def secondary_private_subnet_ids(self):
        return [subnet.id for subnet in self.secondary_private_subnets]

    @property
    def primary_alb_security_group_id(self):
        return self.primary_alb_sg.id

    @property
    def primary_app_security_group_id(self):
        return self.primary_app_sg.id

    @property
    def primary_db_security_group_id(self):
        return self.primary_db_sg.id

    @property
    def primary_lambda_security_group_id(self):
        return self.primary_lambda_sg.id

    @property
    def secondary_alb_security_group_id(self):
        return self.secondary_alb_sg.id

    @property
    def secondary_app_security_group_id(self):
        return self.secondary_app_sg.id

    @property
    def secondary_db_security_group_id(self):
        return self.secondary_db_sg.id
