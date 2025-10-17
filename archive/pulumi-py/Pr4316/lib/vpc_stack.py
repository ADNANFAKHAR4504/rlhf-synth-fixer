"""
VPC Stack - Network infrastructure for PCI-DSS compliant environment.

This module creates a VPC with public and private subnets across multiple
availability zones, VPC endpoints for S3 and DynamoDB to avoid NAT Gateway costs,
and VPC Flow Logs for audit compliance.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class VpcStackArgs:
    """
    Arguments for VPC Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        cidr_block: VPC CIDR block
        log_bucket_arn: ARN of S3 bucket for VPC Flow Logs
    """
    def __init__(
        self,
        environment_suffix: str,
        cidr_block: str = "10.0.0.0/16",
        log_bucket_arn: Optional[pulumi.Output] = None
    ):
        self.environment_suffix = environment_suffix
        self.cidr_block = cidr_block
        self.log_bucket_arn = log_bucket_arn


class VpcStack(pulumi.ComponentResource):
    """
    VPC Component Resource for payment processing environment.

    Creates isolated network infrastructure with:
    - VPC with DNS support enabled
    - 2 public and 2 private subnets across 2 AZs
    - Internet Gateway for public subnet connectivity
    - VPC Endpoints for S3 and DynamoDB (cost optimization)
    - VPC Flow Logs to S3 for PCI-DSS audit requirements
    """

    def __init__(
        self,
        name: str,
        args: VpcStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:network:VpcStack', name, None, opts)

        # PCI-DSS Requirement: Network segmentation for cardholder data environment
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Compliance": "PCI-DSS",
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create private subnets for RDS and internal services
        # PCI-DSS Requirement: Isolate cardholder data in private network
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{args.environment_suffix}",
                    "Type": "private",
                    "Environment": args.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create public subnets for future load balancers or bastion hosts
        self.public_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{args.environment_suffix}",
                    "Type": "public",
                    "Environment": args.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Internet Gateway for public subnet internet access
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"payment-igw-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={
                "Name": f"public-rt-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Route table for private subnets (no internet gateway)
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"private-rt-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # VPC Endpoint for S3 (cost optimization - avoid NAT Gateway)
        self.s3_endpoint = aws.ec2.VpcEndpoint(
            f"s3-endpoint-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            service_name="com.amazonaws.us-east-1.s3",
            route_table_ids=[self.private_route_table.id],
            tags={
                "Name": f"s3-endpoint-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # VPC Endpoint for DynamoDB (cost optimization)
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-endpoint-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            service_name="com.amazonaws.us-east-1.dynamodb",
            route_table_ids=[self.private_route_table.id],
            tags={
                "Name": f"dynamodb-endpoint-{args.environment_suffix}",
                "Environment": args.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

        # PCI-DSS Requirement: Audit logging of network traffic
        # VPC Flow Logs to S3 for compliance monitoring
        if args.log_bucket_arn:
            self.flow_log = aws.ec2.FlowLog(
                f"vpc-flow-log-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                traffic_type="ALL",
                log_destination_type="s3",
                log_destination=args.log_bucket_arn,
                tags={
                    "Name": f"vpc-flow-log-{args.environment_suffix}",
                    "Environment": args.environment_suffix,
                    "Compliance": "PCI-DSS-Audit",
                },
                opts=ResourceOptions(parent=self)
            )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "private_subnet_ids": [s.id for s in self.private_subnets],
            "public_subnet_ids": [s.id for s in self.public_subnets],
        })
