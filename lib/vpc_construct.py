"""VPC configuration with private subnets and NAT instances."""
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.instance import Instance
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class VpcConstruct(Construct):
    """VPC with private subnets and NAT instances."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Availability zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public subnets for NAT instances
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self, f"public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-{az}-{environment_suffix}-ef",
                    "Environment": environment_suffix
                }
            )
            public_subnets.append(subnet)

        # Public route table
        public_rt = RouteTable(
            self, "public-rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-public-rt-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        Route(self, "public-route",
             route_table_id=public_rt.id,
             destination_cidr_block="0.0.0.0/0",
             gateway_id=igw.id)

        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private subnets for Lambda
        self.private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self, f"private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-private-{az}-{environment_suffix}-ef",
                    "Environment": environment_suffix
                }
            )
            self.private_subnets.append(subnet)

        # Security group for NAT instance
        nat_sg = SecurityGroup(
            self, "nat-sg",
            name=f"payment-nat-sg-{environment_suffix}-ef",
            description="Security group for NAT instance",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["10.0.0.0/16"]
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
                "Name": f"payment-nat-sg-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Get Amazon Linux 2 AMI
        ami = DataAwsAmi(
            self, "nat-ami",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
                {"name": "virtualization-type", "values": ["hvm"]}
            ]
        )

        # NAT instance (single instance for cost saving)
        nat_instance = Instance(
            self, "nat-instance",
            ami=ami.id,
            instance_type="t3.micro",
            subnet_id=public_subnets[0].id,
            vpc_security_group_ids=[nat_sg.id],
            source_dest_check=False,
            user_data="""#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
""",
            tags={
                "Name": f"payment-nat-instance-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Private route table
        private_rt = RouteTable(
            self, "private-rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-private-rt-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        Route(self, "private-route",
             route_table_id=private_rt.id,
             destination_cidr_block="0.0.0.0/0",
             network_interface_id=nat_instance.primary_network_interface_id)

        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self, f"private-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Security group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self, "lambda-sg",
            name=f"payment-lambda-sg-{environment_suffix}-ef",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        # Properties for other constructs
        self.private_subnet_ids = [s.id for s in self.private_subnets]
        self.lambda_sg_id = self.lambda_sg.id
