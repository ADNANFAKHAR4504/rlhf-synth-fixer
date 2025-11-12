# Three-Tier VPC Architecture - Ideal Implementation

This document represents the ideal implementation of the three-tier VPC architecture for the payment processing platform, fully meeting all requirements from the PROMPT.

## Implementation Overview

The solution creates a comprehensive VPC infrastructure with proper network segmentation, security controls, and high availability across three availability zones. The implementation uses Pulumi with Python to define all infrastructure resources.

## Code Structure

### File: `lib/tap_stack.py`

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It creates a comprehensive three-tier VPC architecture with proper network segmentation,
security controls, and high availability across multiple availability zones.
"""

from typing import Optional, List
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the
            deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component creates a three-tier VPC architecture for a payment processing platform
    with public, private, and database subnet tiers across 3 availability zones.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Merge default tags with provided tags
        self.tags = {
            'Environment': self.environment_suffix,
            'Team': 'fintech',
            'CostCenter': 'payment-processing',
            **args.tags
        }

        # Get availability zones for eu-central-1
        azs = aws.get_availability_zones(state="available")

        # Use first 3 AZs
        az_names = [azs.names[i] for i in range(3)]

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"payment-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                'Name': f"payment-vpc-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"payment-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f"payment-igw-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = aws.s3.Bucket(
            f"payment-flow-logs-{self.environment_suffix}",
            tags={
                **self.tags,
                'Name': f"payment-flow-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure S3 bucket ownership controls
        self.bucket_ownership = aws.s3.BucketOwnershipControls(
            f"payment-flow-logs-ownership-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            rule=aws.s3.BucketOwnershipControlsRuleArgs(
                object_ownership="BucketOwnerPreferred"
            ),
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Configure S3 bucket ACL
        self.bucket_acl = aws.s3.BucketAclV2(
            f"payment-flow-logs-acl-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            acl="private",
            opts=ResourceOptions(
                parent=self.flow_logs_bucket,
                depends_on=[self.bucket_ownership]
            )
        )

        # Create VPC Flow Log to S3
        self.flow_log = aws.ec2.FlowLog(
            f"payment-flow-log-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                **self.tags,
                'Name': f"payment-flow-log-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Public Subnets
        self.public_subnets = []
        public_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

        for i, (az, cidr) in enumerate(zip(az_names, public_cidrs)):
            subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    'Name': f"payment-public-subnet-{az}-{self.environment_suffix}",
                    'Tier': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create Public Route Table
        self.public_rt = aws.ec2.RouteTable(
            f"payment-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f"payment-public-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        self.public_route = aws.ec2.Route(
            f"payment-public-route-{self.environment_suffix}",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_rt)
        )

        # Associate public subnets with public route table
        self.public_rt_associations = []
        for i, subnet in enumerate(self.public_subnets):
            assoc = aws.ec2.RouteTableAssociation(
                f"payment-public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self.public_rt)
            )
            self.public_rt_associations.append(assoc)

        # Create Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(3):
            eip = aws.ec2.Eip(
                f"payment-nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    **self.tags,
                    'Name': f"payment-nat-eip-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self)
            )
            self.eips.append(eip)

        # Create NAT Gateways in each public subnet
        self.nat_gateways = []
        for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.eips)):
            nat = aws.ec2.NatGateway(
                f"payment-nat-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.tags,
                    'Name': f"payment-nat-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )
            self.nat_gateways.append(nat)

        # Create Private Subnets
        self.private_subnets = []
        private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

        for i, (az, cidr) in enumerate(zip(az_names, private_cidrs)):
            subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags={
                    **self.tags,
                    'Name': f"payment-private-subnet-{az}-{self.environment_suffix}",
                    'Tier': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create Private Route Tables (one per AZ for NAT Gateway)
        self.private_rts = []
        self.private_routes = []
        self.private_rt_associations = []

        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            # Create route table
            rt = aws.ec2.RouteTable(
                f"payment-private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    **self.tags,
                    'Name': f"payment-private-rt-{i+1}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_rts.append(rt)

            # Create route to NAT Gateway
            route = aws.ec2.Route(
                f"payment-private-route-{i+1}-{self.environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=ResourceOptions(parent=rt)
            )
            self.private_routes.append(route)

            # Associate subnet with route table
            assoc = aws.ec2.RouteTableAssociation(
                f"payment-private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=rt)
            )
            self.private_rt_associations.append(assoc)

        # Create Database Subnets
        self.database_subnets = []
        database_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

        for i, (az, cidr) in enumerate(zip(az_names, database_cidrs)):
            subnet = aws.ec2.Subnet(
                f"payment-database-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                tags={
                    **self.tags,
                    'Name': f"payment-database-subnet-{az}-{self.environment_suffix}",
                    'Tier': 'database'
                },
                opts=ResourceOptions(parent=self)
            )
            self.database_subnets.append(subnet)

        # Create Database Route Table (no internet routing)
        self.database_rt = aws.ec2.RouteTable(
            f"payment-database-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                'Name': f"payment-database-rt-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate database subnets with database route table
        self.database_rt_associations = []
        for i, subnet in enumerate(self.database_subnets):
            assoc = aws.ec2.RouteTableAssociation(
                f"payment-database-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.database_rt.id,
                opts=ResourceOptions(parent=self.database_rt)
            )
            self.database_rt_associations.append(assoc)

        # Create Security Group for Web Tier (ALB)
        self.web_sg = aws.ec2.SecurityGroup(
            f"payment-web-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for web tier (ALB) - allows HTTPS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **self.tags,
                'Name': f"payment-web-sg-{self.environment_suffix}",
                'Tier': 'web'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Security Group for App Tier
        self.app_sg = aws.ec2.SecurityGroup(
            f"payment-app-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for app tier - allows port 8080 from web tier",
            tags={
                **self.tags,
                'Name': f"payment-app-sg-{self.environment_suffix}",
                'Tier': 'app'
            },
            opts=ResourceOptions(parent=self)
        )

        # App tier ingress rule (depends on web_sg being created)
        self.app_sg_ingress = aws.ec2.SecurityGroupRule(
            f"payment-app-sg-ingress-{self.environment_suffix}",
            type="ingress",
            security_group_id=self.app_sg.id,
            source_security_group_id=self.web_sg.id,
            protocol="tcp",
            from_port=8080,
            to_port=8080,
            description="Allow traffic from web tier on port 8080",
            opts=ResourceOptions(parent=self.app_sg)
        )

        # App tier egress rule
        self.app_sg_egress = aws.ec2.SecurityGroupRule(
            f"payment-app-sg-egress-{self.environment_suffix}",
            type="egress",
            security_group_id=self.app_sg.id,
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic",
            opts=ResourceOptions(parent=self.app_sg)
        )

        # Create Security Group for Database Tier
        self.db_sg = aws.ec2.SecurityGroup(
            f"payment-db-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for database tier - allows PostgreSQL from app tier",
            tags={
                **self.tags,
                'Name': f"payment-db-sg-{self.environment_suffix}",
                'Tier': 'database'
            },
            opts=ResourceOptions(parent=self)
        )

        # Database tier ingress rule (depends on app_sg being created)
        self.db_sg_ingress = aws.ec2.SecurityGroupRule(
            f"payment-db-sg-ingress-{self.environment_suffix}",
            type="ingress",
            security_group_id=self.db_sg.id,
            source_security_group_id=self.app_sg.id,
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            description="Allow PostgreSQL from app tier on port 5432",
            opts=ResourceOptions(parent=self.db_sg)
        )

        # Database tier egress rule
        self.db_sg_egress = aws.ec2.SecurityGroupRule(
            f"payment-db-sg-egress-{self.environment_suffix}",
            type="egress",
            security_group_id=self.db_sg.id,
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic",
            opts=ResourceOptions(parent=self.db_sg)
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'vpc_cidr': self.vpc.cidr_block,
            'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
            'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
            'database_subnet_ids': [subnet.id for subnet in self.database_subnets],
            'web_security_group_id': self.web_sg.id,
            'app_security_group_id': self.app_sg.id,
            'database_security_group_id': self.db_sg.id,
            'nat_gateway_ids': [nat.id for nat in self.nat_gateways],
            'internet_gateway_id': self.igw.id,
            'flow_logs_bucket': self.flow_logs_bucket.bucket
        })

```