from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.route import Route
from typing import List, Dict


class NetworkingModule(Construct):
    """
    Creates VPC infrastructure with public and private subnets across multiple AZs.
    Implements VPC peering connection for cross-account communication.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        region: str = "us-east-1",
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = region
        self.common_tags = common_tags or {}
        self.availability_zones = [f"{region}a", f"{region}b", f"{region}c"]

        # Create Payment VPC (Account 1)
        self.payment_vpc = self._create_vpc(
            "payment",
            "10.0.0.0/16",
            {"Environment": "payment", **self.common_tags}
        )

        # Create Analytics VPC (Account 2)
        self.analytics_vpc = self._create_vpc(
            "analytics",
            "10.1.0.0/16",
            {"Environment": "analytics", **self.common_tags}
        )

        # Create subnets for Payment VPC
        self.payment_public_subnets, self.payment_private_subnets = self._create_subnets(
            self.payment_vpc,
            "payment",
            "10.0.0.0/16"
        )

        # Create subnets for Analytics VPC
        self.analytics_public_subnets, self.analytics_private_subnets = self._create_subnets(
            self.analytics_vpc,
            "analytics",
            "10.1.0.0/16"
        )

        # Create Internet Gateways
        self.payment_igw = self._create_internet_gateway(
            self.payment_vpc,
            "payment"
        )
        self.analytics_igw = self._create_internet_gateway(
            self.analytics_vpc,
            "analytics"
        )

        # Create NAT Gateways for Payment VPC
        self.payment_nat_gateways = self._create_nat_gateways(
            self.payment_public_subnets,
            "payment"
        )

        # Create NAT Gateways for Analytics VPC
        self.analytics_nat_gateways = self._create_nat_gateways(
            self.analytics_public_subnets,
            "analytics"
        )

        # Create route tables for Payment VPC
        self.payment_public_rt, self.payment_private_rts = self._create_route_tables(
            self.payment_vpc,
            self.payment_igw,
            self.payment_nat_gateways,
            self.payment_public_subnets,
            self.payment_private_subnets,
            "payment"
        )

        # Create route tables for Analytics VPC
        self.analytics_public_rt, self.analytics_private_rts = self._create_route_tables(
            self.analytics_vpc,
            self.analytics_igw,
            self.analytics_nat_gateways,
            self.analytics_public_subnets,
            self.analytics_private_subnets,
            "analytics"
        )

        # Create VPC Peering Connection
        self.peering_connection = self._create_vpc_peering()

        # Add peering routes to private route tables
        self._add_peering_routes()

    def _create_vpc(self, name: str, cidr: str, tags: Dict[str, str]) -> Vpc:
        """Create a VPC with DNS support enabled"""
        vpc = Vpc(
            self,
            f"vpc-{name}-{self.environment_suffix}",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{name}-{self.environment_suffix}",
                **tags
            }
        )
        return vpc

    def _create_subnets(
        self,
        vpc: Vpc,
        vpc_name: str,
        vpc_cidr: str
    ) -> tuple:
        """Create public and private subnets across 3 availability zones"""
        public_subnets = []
        private_subnets = []

        # Calculate subnet CIDRs
        base_octets = vpc_cidr.split('.')
        base = f"{base_octets[0]}.{base_octets[1]}"

        for idx, az in enumerate(self.availability_zones):
            # Public subnet
            public_subnet = Subnet(
                self,
                f"subnet-public-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base}.{idx * 16}.0/20",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"subnet-public-{vpc_name}-{az}-{self.environment_suffix}",
                    "Type": "public",
                    **self.common_tags
                }
            )
            public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"subnet-private-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"{base}.{128 + idx * 16}.0/20",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"subnet-private-{vpc_name}-{az}-{self.environment_suffix}",
                    "Type": "private",
                    **self.common_tags
                }
            )
            private_subnets.append(private_subnet)

        return public_subnets, private_subnets

    def _create_internet_gateway(self, vpc: Vpc, vpc_name: str) -> InternetGateway:
        """Create Internet Gateway for public subnet internet access"""
        igw = InternetGateway(
            self,
            f"igw-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"igw-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return igw

    def _create_nat_gateways(
        self,
        public_subnets: List[Subnet],
        vpc_name: str
    ) -> List[NatGateway]:
        """Create NAT Gateways in each public subnet for outbound internet access"""
        nat_gateways = []

        for idx, subnet in enumerate(public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"eip-nat-{vpc_name}-{idx}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"eip-nat-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                }
            )

            # Create NAT Gateway with explicit dependency on EIP
            nat = NatGateway(
                self,
                f"nat-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={
                    "Name": f"nat-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                },
                depends_on=[eip]
            )
            nat_gateways.append(nat)

        return nat_gateways

    def _create_route_tables(
        self,
        vpc: Vpc,
        igw: InternetGateway,
        nat_gateways: List[NatGateway],
        public_subnets: List[Subnet],
        private_subnets: List[Subnet],
        vpc_name: str
    ) -> tuple:
        """Create and configure route tables for public and private subnets"""

        # Public route table (shared across all public subnets)
        public_rt = RouteTable(
            self,
            f"rt-public-{vpc_name}-{self.environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"rt-public-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )

        # Associate public subnets with public route table
        for idx, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"rta-public-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private route tables (one per AZ for NAT Gateway routing)
        private_rts = []
        for idx, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = RouteTable(
                self,
                f"rt-private-{vpc_name}-{idx}-{self.environment_suffix}",
                vpc_id=vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id
                    )
                ],
                tags={
                    "Name": f"rt-private-{vpc_name}-{idx}-{self.environment_suffix}",
                    **self.common_tags
                }
            )
            private_rts.append(private_rt)

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"rta-private-{vpc_name}-{idx}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        return public_rt, private_rts

    def _create_vpc_peering(self) -> VpcPeeringConnection:
        """Create VPC peering connection between payment and analytics VPCs"""
        peering = VpcPeeringConnection(
            self,
            f"peering-payment-analytics-{self.environment_suffix}",
            vpc_id=self.payment_vpc.id,
            peer_vpc_id=self.analytics_vpc.id,
            auto_accept=True,
            tags={
                "Name": f"peering-payment-analytics-{self.environment_suffix}",
                "Side": "Requester",
                **self.common_tags
            }
        )
        return peering

    def _add_peering_routes(self):
        """Add routes to private route tables for VPC peering traffic"""
        # Add routes from Payment VPC private subnets to Analytics VPC
        for idx, rt in enumerate(self.payment_private_rts):
            Route(
                self,
                f"route-payment-to-analytics-{idx}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="10.1.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id
            )

        # Add routes from Analytics VPC private subnets to Payment VPC
        for idx, rt in enumerate(self.analytics_private_rts):
            Route(
                self,
                f"route-analytics-to-payment-{idx}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="10.0.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id
            )
