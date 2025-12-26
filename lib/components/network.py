"""
Network Infrastructure Component
Creates VPC, subnets, security groups, NAT gateways, and VPC endpoints
"""

#lib/components/network.py

import pulumi
import pulumi_aws as aws
from typing import List

class NetworkInfrastructure(pulumi.ComponentResource):
    def __init__(self, name: str, environment: str, tags: dict, opts=None):
        super().__init__("custom:network:Infrastructure", name, None, opts)

        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"{name}-vpc"},
            opts=pulumi.ResourceOptions(parent=self) # UNCOMMENTED: Ensure opts is passed
        )

        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{name}-igw"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Diagnostic print to see what get_availability_zones returns
        azs = aws.get_availability_zones(state="available")
        print(f"DEBUG: get_availability_zones returned: {azs.names}") # Add this diagnostic print

        self.public_subnets = []
        self.public_subnet_ids = []

        for i, az in enumerate(azs.names[:2]): # Use first 2 AZs
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"{name}-public-subnet-{i+1}", "Type": "Public"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
            self.public_subnet_ids.append(subnet.id)

        self.private_subnets = []
        self.private_subnet_ids = []

        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**tags, "Name": f"{name}-private-subnet-{i+1}", "Type": "Private"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)

        self.nat_eips = []
        for i in range(len(self.public_subnets)):
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i+1}",
                domain="vpc",
                tags={**tags, "Name": f"{name}-nat-eip-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.igw])
            )
            self.nat_eips.append(eip)

        self.nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.nat_eips)):
            nat = aws.ec2.NatGateway(
                f"{name}-nat-{i+1}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={**tags, "Name": f"{name}-nat-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)

        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{name}-public-rt"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.Route(
            f"{name}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        self.private_route_tables = []
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**tags, "Name": f"{name}-private-rt-{i+1}"},
                opts=pulumi.ResourceOptions(parent=self)
            )

            aws.ec2.Route(
                f"{name}-private-route-{i+1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

            aws.ec2.RouteTableAssociation(
                f"{name}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

            self.private_route_tables.append(rt)

        self.lambda_security_group = aws.ec2.SecurityGroup(
            f"{name}-lambda-sg",
            name=f"{name}-lambda-sg",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS outbound"
                ),
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP outbound"
                )
            ],
            tags={**tags, "Name": f"{name}-lambda-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.vpc_endpoint_security_group = aws.ec2.SecurityGroup(
            f"{name}-vpc-endpoint-sg",
            name=f"{name}-vpc-endpoint-sg",
            description="Security group for VPC endpoints",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[self.lambda_security_group.id],
                    description="HTTPS from Lambda"
                )
            ],
            tags={**tags, "Name": f"{name}-vpc-endpoint-sg"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self._create_vpc_endpoints(name, tags)

        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "lambda_security_group_id": self.lambda_security_group.id,
            "vpc_endpoint_security_group_id": self.vpc_endpoint_security_group.id
        })

    def _create_vpc_endpoints(self, name: str, tags: dict):
        """Create VPC endpoints for AWS services"""

        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"{name}-dynamodb-endpoint",
            vpc_id=self.vpc.id,
            # Diagnostic print for get_region
            service_name=f"com.amazonaws.{aws.get_region().name}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={**tags, "Name": f"{name}-dynamodb-endpoint"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.s3_endpoint = aws.ec2.VpcEndpoint(
            f"{name}-s3-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws.get_region().name}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={**tags, "Name": f"{name}-s3-endpoint"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.kinesis_endpoint = aws.ec2.VpcEndpoint(
            f"{name}-kinesis-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws.get_region().name}.kinesis-streams",
            vpc_endpoint_type="Interface",
            subnet_ids=self.private_subnet_ids,
            security_group_ids=[self.vpc_endpoint_security_group.id],
            private_dns_enabled=True,
            tags={**tags, "Name": f"{name}-kinesis-endpoint"},
            opts=pulumi.ResourceOptions(parent=self)
        )
