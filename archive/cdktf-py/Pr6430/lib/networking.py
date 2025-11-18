from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class Networking(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin,too-many-positional-arguments
                 environment_suffix: str):
        super().__init__(scope, id)

        # Get available AZs
        azs = DataAwsAvailabilityZones(self, "azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"eks-vpc-{environment_suffix}",
                "Environment": environment_suffix,
                f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared"
            }
        )

        # Create Internet Gateway
        self.igw = InternetGateway(self, "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"eks-igw-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create public subnets for NAT Gateways
        self.public_subnets = []
        public_subnet_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

        for i, cidr in enumerate(public_subnet_cidrs):
            subnet = Subnet(self, f"public_subnet_{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"eks-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Type": "public",
                    f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
                    "kubernetes.io/role/elb": "1"
                }
            )
            self.public_subnets.append(subnet)

        # Create route table for public subnets
        public_rt = RouteTable(self, "public_route_table",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"eks-public-rt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Add route to internet gateway
        Route(self, "public_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public_rt_association_{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Create Elastic IPs for NAT Gateways
        nat_eips = []
        for i in range(3):
            eip = Eip(self, f"nat_eip_{i+1}",
                domain="vpc",
                tags={
                    "Name": f"eks-nat-eip-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )
            nat_eips.append(eip)

        # Create NAT Gateways
        nat_gateways = []
        for i, (eip, subnet) in enumerate(zip(nat_eips, self.public_subnets)):
            nat = NatGateway(self, f"nat_gateway_{i+1}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"eks-nat-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )
            nat_gateways.append(nat)

        # Create private subnets for EKS nodes
        self.private_subnets = []
        private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

        for i, cidr in enumerate(private_subnet_cidrs):
            subnet = Subnet(self, f"private_subnet_{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=Fn.element(azs.names, i),
                tags={
                    "Name": f"eks-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Type": "private",
                    f"kubernetes.io/cluster/eks-cluster-{environment_suffix}": "shared",
                    "kubernetes.io/role/internal-elb": "1"
                }
            )
            self.private_subnets.append(subnet)

            # Create route table for each private subnet
            private_rt = RouteTable(self, f"private_route_table_{i+1}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"eks-private-rt-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix
                }
            )

            # Add route to NAT Gateway
            Route(self, f"private_route_{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateways[i].id
            )

            # Associate private subnet with route table
            RouteTableAssociation(self, f"private_rt_association_{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

    @property
    def vpc_id(self) -> str:
        return self.vpc.id

    @property
    def vpc_cidr(self) -> str:
        return self.vpc.cidr_block

    @property
    def private_subnet_ids(self) -> list:
        return [subnet.id for subnet in self.private_subnets]

    @property
    def public_subnet_ids(self) -> list:
        return [subnet.id for subnet in self.public_subnets]