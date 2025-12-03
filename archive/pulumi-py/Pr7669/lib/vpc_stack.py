"""
vpc_stack.py

VPC infrastructure with private subnets, NAT Gateway, and VPC endpoints.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional


class VpcStack(pulumi.ComponentResource):
    """VPC infrastructure with private subnets and VPC endpoints."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:vpc:VpcStack", name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"vpc-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"igw-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnet for NAT Gateway
        self.public_subnet = aws.ec2.Subnet(
            f"public-subnet-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={**tags, "Name": f"public-subnet-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets
        self.private_subnet_a = aws.ec2.Subnet(
            f"private-subnet-a-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone="us-east-1a",
            tags={**tags, "Name": f"private-subnet-a-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.private_subnet_b = aws.ec2.Subnet(
            f"private-subnet-b-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1b",
            tags={**tags, "Name": f"private-subnet-b-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"public-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnet with public route table
        aws.ec2.RouteTableAssociation(
            f"public-rta-{environment_suffix}",
            subnet_id=self.public_subnet.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        # Private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"private-rt-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Cost optimization: Skip NAT Gateway for dev environment
        if environment_suffix != "dev":
            # Elastic IP for NAT Gateway
            self.eip = aws.ec2.Eip(
                f"nat-eip-{environment_suffix}",
                domain="vpc",
                tags={**tags, "Name": f"nat-eip-{environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            # NAT Gateway
            self.nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{environment_suffix}",
                subnet_id=self.public_subnet.id,
                allocation_id=self.eip.id,
                tags={**tags, "Name": f"nat-gateway-{environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{environment_suffix}",
                route_table_id=self.private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id,
                opts=ResourceOptions(parent=self)
            )
        else:
            pulumi.log.info(f"Skipping NAT Gateway for {environment_suffix} (cost optimization: ~$32/month savings)")
            self.eip = None
            self.nat_gateway = None

        # Associate private subnets with private route table
        aws.ec2.RouteTableAssociation(
            f"private-rta-a-{environment_suffix}",
            subnet_id=self.private_subnet_a.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        aws.ec2.RouteTableAssociation(
            f"private-rta-b-{environment_suffix}",
            subnet_id=self.private_subnet_b.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        # Create dedicated security group for Lambda functions
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS outbound for AWS API calls"
                )
            ],
            tags={**tags, "Name": f"lambda-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Security group for VPC endpoints - allow traffic FROM Lambda SG only
        self.vpc_endpoint_sg = aws.ec2.SecurityGroup(
            f"vpc-endpoint-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for VPC endpoints",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    security_groups=[self.lambda_sg.id],
                    description="Allow HTTPS from Lambda functions"
                )
            ],
            tags={**tags, "Name": f"vpc-endpoint-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB VPC Endpoint (Gateway)
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-endpoint-{environment_suffix}",
            vpc_id=self.vpc.id,
            service_name="com.amazonaws.us-east-1.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_route_table.id],
            tags={**tags, "Name": f"dynamodb-endpoint-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # S3 VPC Endpoint (Gateway)
        self.s3_endpoint = aws.ec2.VpcEndpoint(
            f"s3-endpoint-{environment_suffix}",
            vpc_id=self.vpc.id,
            service_name="com.amazonaws.us-east-1.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_route_table.id],
            tags={**tags, "Name": f"s3-endpoint-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "vpc_id": self.vpc.id,
            "private_subnet_a_id": self.private_subnet_a.id,
            "private_subnet_b_id": self.private_subnet_b.id,
            "lambda_sg_id": self.lambda_sg.id,
            "vpc_endpoint_sg_id": self.vpc_endpoint_sg.id,
        })
