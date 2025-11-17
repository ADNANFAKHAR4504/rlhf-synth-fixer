from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule

class VpcConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cidr_block: str, availability_zones: list, region: str = "us-east-1"):  # Changed default from us-east-2 to us-east-1
        super().__init__(scope, id)
        self.region = region
        self.environment_suffix = environment_suffix

        # VPC - Use consistent naming to avoid recreations
        vpc_name = f"vpc-{environment_suffix}"
        self.vpc = Vpc(self, vpc_name,
                      cidr_block=cidr_block,
                      enable_dns_hostnames=True,
                      enable_dns_support=True,
                      tags={
                          "Name": f"eks-vpc-{environment_suffix}",
                          "Environment": environment_suffix
                      })

        # Internet Gateway
        self.igw = InternetGateway(self, f"igw",
                                   vpc_id=self.vpc.id,
                                   tags={"Name": f"eks-igw-{environment_suffix}"})

        # Private Subnets
        self.private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = Subnet(self, f"private-subnet-{i}",
                           vpc_id=self.vpc.id,
                           cidr_block=f"10.0.{i}.0/24",
                           availability_zone=az,
                           tags={
                               "Name": f"eks-private-subnet-{i}-{environment_suffix}",
                               "kubernetes.io/role/internal-elb": "1"
                           })
            self.private_subnets.append(subnet)

        # Public Subnets for NAT Gateways
        self.public_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = Subnet(self, f"public-subnet-{i}",
                           vpc_id=self.vpc.id,
                           cidr_block=f"10.0.{100 + i}.0/24",
                           availability_zone=az,
                           map_public_ip_on_launch=True,
                           tags={
                               "Name": f"eks-public-subnet-{i}-{environment_suffix}",
                               "kubernetes.io/role/elb": "1"
                           })
            self.public_subnets.append(subnet)

        # NAT Gateway (single for cost optimization)
        self.nat_eip = Eip(self, "nat-eip",
                          domain="vpc",
                          tags={"Name": f"eks-nat-eip-{environment_suffix}"})

        self.nat_gateway = NatGateway(self, f"nat-gateway",
                                     allocation_id=self.nat_eip.id,
                                     subnet_id=self.public_subnets[0].id,
                                     tags={"Name": f"eks-nat-{environment_suffix}"})

        # Public Route Table
        self.public_rt = RouteTable(self, f"public-rt",
                                   vpc_id=self.vpc.id,
                                   route=[RouteTableRoute(
                                       cidr_block="0.0.0.0/0",
                                       gateway_id=self.igw.id
                                   )],
                                   tags={"Name": f"eks-public-rt-{environment_suffix}"})

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public-rta-{i}",
                                 subnet_id=subnet.id,
                                 route_table_id=self.public_rt.id)

        # Private Route Table
        self.private_rt = RouteTable(self, f"private-rt",
                                    vpc_id=self.vpc.id,
                                    route=[RouteTableRoute(
                                        cidr_block="0.0.0.0/0",
                                        nat_gateway_id=self.nat_gateway.id
                                    )],
                                    tags={"Name": f"eks-private-rt-{environment_suffix}"})

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(self, f"private-rta-{i}",
                                 subnet_id=subnet.id,
                                 route_table_id=self.private_rt.id)

        # Security Group for VPC Endpoints
        self.vpce_sg = SecurityGroup(self, f"vpce-sg",
                                    name=f"eks-vpce-sg-{environment_suffix}",
                                    description="Security group for VPC endpoints",
                                    vpc_id=self.vpc.id,
                                    tags={"Name": f"eks-vpce-sg-{environment_suffix}"})

        # Ingress rule for HTTPS
        SecurityGroupRule(self, "vpce-sg-ingress",
                         type="ingress",
                         from_port=443,
                         to_port=443,
                         protocol="tcp",
                         cidr_blocks=[cidr_block],
                         security_group_id=self.vpce_sg.id,
                         description="Allow HTTPS from VPC")

        # Egress rule for all outbound
        SecurityGroupRule(self, "vpce-sg-egress",
                         type="egress",
                         from_port=0,
                         to_port=0,
                         protocol="-1",
                         cidr_blocks=["0.0.0.0/0"],
                         security_group_id=self.vpce_sg.id,
                         description="Allow all outbound")

        # VPC Endpoints
        VpcEndpoint(self, f"s3-endpoint",
                   vpc_id=self.vpc.id,
                   service_name=f"com.amazonaws.{self.region}.s3",
                   vpc_endpoint_type="Gateway",
                   route_table_ids=[self.private_rt.id],
                   tags={"Name": f"s3-endpoint-{environment_suffix}"})

        VpcEndpoint(self, f"ecr-api-endpoint",
                   vpc_id=self.vpc.id,
                   service_name=f"com.amazonaws.{self.region}.ecr.api",
                   vpc_endpoint_type="Interface",
                   subnet_ids=[s.id for s in self.private_subnets],
                   security_group_ids=[self.vpce_sg.id],
                   tags={"Name": f"ecr-api-endpoint-{environment_suffix}"})

        VpcEndpoint(self, f"ecr-dkr-endpoint",
                   vpc_id=self.vpc.id,
                   service_name=f"com.amazonaws.{self.region}.ecr.dkr",
                   vpc_endpoint_type="Interface",
                   subnet_ids=[s.id for s in self.private_subnets],
                   security_group_ids=[self.vpce_sg.id],
                   tags={"Name": f"ecr-dkr-endpoint-{environment_suffix}"})

        VpcEndpoint(self, f"ec2-endpoint",
                   vpc_id=self.vpc.id,
                   service_name=f"com.amazonaws.{self.region}.ec2",
                   vpc_endpoint_type="Interface",
                   subnet_ids=[s.id for s in self.private_subnets],
                   security_group_ids=[self.vpce_sg.id],
                   tags={"Name": f"ec2-endpoint-{environment_suffix}"})

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def private_subnet_ids(self):
        return [subnet.id for subnet in self.private_subnets]
