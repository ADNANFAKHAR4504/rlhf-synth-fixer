"""Networking infrastructure for StreamFlix video processing pipeline."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkingConstruct(Construct):
    """Networking construct for VPC, subnets, and security groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"streamflix-vpc-{environment_suffix}"},
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"streamflix-igw-{environment_suffix}"},
        )

        # Create public subnets
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"streamflix-public-subnet-1-{environment_suffix}"},
        )

        self.public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"streamflix-public-subnet-2-{environment_suffix}"},
        )

        # Create private subnets
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"streamflix-private-subnet-1-{environment_suffix}"},
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"streamflix-private-subnet-2-{environment_suffix}"},
        )

        # Create Elastic IP for NAT Gateway
        nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={"Name": f"streamflix-nat-eip-{environment_suffix}"},
        )

        # Create NAT Gateway
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={"Name": f"streamflix-nat-{environment_suffix}"},
        )

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id,
                )
            ],
            tags={"Name": f"streamflix-public-rt-{environment_suffix}"},
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_rt.id,
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_rt.id,
        )

        # Create route table for private subnets
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id,
                )
            ],
            tags={"Name": f"streamflix-private-rt-{environment_suffix}"},
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_rt.id,
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_rt.id,
        )

        # Create security group for ECS tasks
        self.ecs_security_group = SecurityGroup(
            self,
            "ecs_sg",
            name=f"streamflix-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTPS from VPC",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
            tags={"Name": f"streamflix-ecs-sg-{environment_suffix}"},
        )

        # Create security group for RDS
        self.database_security_group = SecurityGroup(
            self,
            "database_sg",
            name=f"streamflix-db-sg-{environment_suffix}",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.ecs_security_group.id],
                    description="PostgreSQL from ECS tasks",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
            tags={"Name": f"streamflix-db-sg-{environment_suffix}"},
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def private_subnet_ids(self):
        return [self.private_subnet_1.id, self.private_subnet_2.id]

    @property
    def public_subnet_ids(self):
        return [self.public_subnet_1.id, self.public_subnet_2.id]

    @property
    def ecs_security_group_id(self):
        return self.ecs_security_group.id

    @property
    def database_security_group_id(self):
        return self.database_security_group.id
