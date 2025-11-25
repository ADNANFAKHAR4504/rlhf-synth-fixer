"""Network infrastructure for Blue-Green deployment"""
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation


class NetworkStack(Construct):
    """Network stack with VPC, subnets, and gateways"""

    # pylint: disable=redefined-builtin,too-many-instance-attributes
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(self, 'vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f'bluegreen-vpc-v1-{environment_suffix}'}
        )

        # Public Subnets
        self.public_subnet_1 = Subnet(self, 'public_subnet_1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone='us-east-1a',
            map_public_ip_on_launch=True,
            tags={'Name': f'bluegreen-public-1-v1-{environment_suffix}'}
        )

        self.public_subnet_2 = Subnet(self, 'public_subnet_2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone='us-east-1b',
            map_public_ip_on_launch=True,
            tags={'Name': f'bluegreen-public-2-v1-{environment_suffix}'}
        )

        # Private Subnets
        self.private_subnet_1 = Subnet(self, 'private_subnet_1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.10.0/24',
            availability_zone='us-east-1a',
            tags={'Name': f'bluegreen-private-1-v1-{environment_suffix}'}
        )

        self.private_subnet_2 = Subnet(self, 'private_subnet_2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.11.0/24',
            availability_zone='us-east-1b',
            tags={'Name': f'bluegreen-private-2-v1-{environment_suffix}'}
        )

        # Internet Gateway
        self.igw = InternetGateway(self, 'igw',
            vpc_id=self.vpc.id,
            tags={'Name': f'bluegreen-igw-v1-{environment_suffix}'}
        )

        # EIP for NAT Gateway
        self.nat_eip = Eip(self, 'nat_eip',
            domain='vpc',
            tags={'Name': f'bluegreen-nat-eip-v1-{environment_suffix}'}
        )

        # NAT Gateway
        self.nat_gateway = NatGateway(self, 'nat_gateway',
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={'Name': f'bluegreen-nat-v1-{environment_suffix}'}
        )

        # Public Route Table
        self.public_rt = RouteTable(self, 'public_rt',
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id
            )],
            tags={'Name': f'bluegreen-public-rt-v1-{environment_suffix}'}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(self, 'public_rta_1',
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_rt.id
        )

        RouteTableAssociation(self, 'public_rta_2',
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_rt.id
        )

        # Private Route Table
        self.private_rt = RouteTable(self, 'private_rt',
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block='0.0.0.0/0',
                nat_gateway_id=self.nat_gateway.id
            )],
            tags={'Name': f'bluegreen-private-rt-v1-{environment_suffix}'}
        )

        # Associate private subnets with private route table
        RouteTableAssociation(self, 'private_rta_1',
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_rt.id
        )

        RouteTableAssociation(self, 'private_rta_2',
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_rt.id
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def public_subnet_ids(self):
        return [self.public_subnet_1.id, self.public_subnet_2.id]

    @property
    def private_subnet_ids(self):
        return [self.private_subnet_1.id, self.private_subnet_2.id]
