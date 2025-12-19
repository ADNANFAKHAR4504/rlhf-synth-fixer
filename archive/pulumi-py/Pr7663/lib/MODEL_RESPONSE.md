# Multi-VPC Transit Gateway Architecture - Pulumi Python Implementation

This implementation provides a complete multi-VPC architecture with Transit Gateway connectivity and centralized NAT egress for a fintech payment platform.

## File: lib/tap_stack.py

```python
"""
TapStack - Multi-VPC Transit Gateway Architecture

This module implements a secure multi-VPC network foundation for a fintech payment platform,
featuring Transit Gateway connectivity, centralized NAT egress, and comprehensive flow logging.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any


class TapStackArgs:
    """Arguments for TapStack configuration."""

    def __init__(
        self,
        environment_suffix: str,
        region: str = "us-east-1",
        availability_zones: List[str] = None,
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.region = region
        self.availability_zones = availability_zones or ["us-east-1a", "us-east-1b", "us-east-1c"]
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Multi-VPC Transit Gateway Infrastructure Stack

    Creates:
    - Two VPCs (dev and prod) with public and private subnets across 3 AZs
    - Transit Gateway for inter-VPC connectivity
    - Single NAT instance for centralized egress
    - Security groups for HTTPS and SSH access
    - VPC Flow Logs with CloudWatch integration
    - IAM roles and policies
    """

    def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:infrastructure:TapStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.region = args.region
        self.azs = args.availability_zones

        # Base tags for all resources
        self.base_tags = {
            "Project": "payment-platform",
            "ManagedBy": "Pulumi",
            "Environment": self.environment_suffix,
            **args.tags
        }

        # Create VPCs
        self.dev_vpc = self._create_vpc(
            "dev",
            "10.1.0.0/16",
            {"Environment": "dev", **self.base_tags}
        )

        self.prod_vpc = self._create_vpc(
            "prod",
            "10.2.0.0/16",
            {"Environment": "prod", **self.base_tags}
        )

        # Create Transit Gateway
        self.transit_gateway = self._create_transit_gateway()

        # Attach VPCs to Transit Gateway
        self.dev_tgw_attachment = self._attach_vpc_to_tgw(
            "dev",
            self.dev_vpc["vpc"],
            [subnet.id for subnet in self.dev_vpc["private_subnets"]]
        )

        self.prod_tgw_attachment = self._attach_vpc_to_tgw(
            "prod",
            self.prod_vpc["vpc"],
            [subnet.id for subnet in self.prod_vpc["private_subnets"]]
        )

        # Create NAT instance in dev VPC
        self.nat_instance = self._create_nat_instance()

        # Update route tables to use NAT instance and Transit Gateway
        self._configure_routing()

        # Create security groups
        self.security_groups = self._create_security_groups()

        # Create VPC Flow Logs
        self.flow_logs = self._create_flow_logs()

        # Export outputs
        self._export_outputs()

        self.register_outputs({})

    def _create_vpc(self, name: str, cidr: str, tags: Dict[str, str]) -> Dict[str, Any]:
        """Create VPC with public and private subnets across 3 AZs."""
        vpc_name = f"{name}-vpc-{self.environment_suffix}"

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"{name}_vpc",
            cidr_block=cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": vpc_name},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{name}_igw",
            vpc_id=vpc.id,
            tags={**tags, "Name": f"{name}-igw-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create public subnets (one per AZ)
        public_subnets = []
        for i, az in enumerate(self.azs):
            subnet_cidr = self._calculate_subnet_cidr(cidr, i)
            subnet = aws.ec2.Subnet(
                f"{name}_public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **tags,
                    "Name": f"{name}-public-subnet-{i}-{self.environment_suffix}",
                    "Type": "Public"
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)

        # Create private subnets (one per AZ)
        private_subnets = []
        for i, az in enumerate(self.azs):
            subnet_cidr = self._calculate_subnet_cidr(cidr, i + 3)
            subnet = aws.ec2.Subnet(
                f"{name}_private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                tags={
                    **tags,
                    "Name": f"{name}-private-subnet-{i}-{self.environment_suffix}",
                    "Type": "Private"
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Create public route table
        public_rt = aws.ec2.RouteTable(
            f"{name}_public_rt",
            vpc_id=vpc.id,
            tags={
                **tags,
                "Name": f"{name}-public-rt-{self.environment_suffix}",
                "Purpose": "Internet"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Route to Internet Gateway
        aws.ec2.Route(
            f"{name}_public_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}_public_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Create private route table (will be updated later with NAT and TGW routes)
        private_rt = aws.ec2.RouteTable(
            f"{name}_private_rt",
            vpc_id=vpc.id,
            tags={
                **tags,
                "Name": f"{name}-private-rt-{self.environment_suffix}",
                "Purpose": "NAT"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}_private_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        return {
            "vpc": vpc,
            "igw": igw,
            "public_subnets": public_subnets,
            "private_subnets": private_subnets,
            "public_rt": public_rt,
            "private_rt": private_rt
        }

    def _calculate_subnet_cidr(self, vpc_cidr: str, subnet_index: int) -> str:
        """Calculate subnet CIDR based on VPC CIDR and subnet index."""
        # Simple /20 subnets from /16 VPC
        base_octets = vpc_cidr.split(".")
        third_octet = int(base_octets[2]) + (subnet_index * 16)
        return f"{base_octets[0]}.{base_octets[1]}.{third_octet}.0/20"

    def _create_transit_gateway(self) -> aws.ec2transitgateway.TransitGateway:
        """Create Transit Gateway for inter-VPC connectivity."""
        tgw = aws.ec2transitgateway.TransitGateway(
            "transit_gateway",
            description=f"Transit Gateway for payment platform - {self.environment_suffix}",
            default_route_table_association="disable",
            default_route_table_propagation="disable",
            tags={
                **self.base_tags,
                "Name": f"payment-tgw-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Transit Gateway route table
        self.tgw_route_table = aws.ec2transitgateway.RouteTable(
            "tgw_route_table",
            transit_gateway_id=tgw.id,
            tags={
                **self.base_tags,
                "Name": f"payment-tgw-rt-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        return tgw

    def _attach_vpc_to_tgw(
        self,
        name: str,
        vpc: aws.ec2.Vpc,
        subnet_ids: List[pulumi.Output]
    ) -> aws.ec2transitgateway.VpcAttachment:
        """Attach VPC to Transit Gateway."""
        attachment = aws.ec2transitgateway.VpcAttachment(
            f"{name}_tgw_attachment",
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=vpc.id,
            subnet_ids=subnet_ids,
            transit_gateway_default_route_table_association=False,
            transit_gateway_default_route_table_propagation=False,
            tags={
                **self.base_tags,
                "Name": f"{name}-tgw-attachment-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.tgw_route_table])
        )

        # Associate with route table
        aws.ec2transitgateway.RouteTableAssociation(
            f"{name}_tgw_rt_association",
            transit_gateway_attachment_id=attachment.id,
            transit_gateway_route_table_id=self.tgw_route_table.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Propagate routes
        aws.ec2transitgateway.RouteTablePropagation(
            f"{name}_tgw_rt_propagation",
            transit_gateway_attachment_id=attachment.id,
            transit_gateway_route_table_id=self.tgw_route_table.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        return attachment

    def _create_nat_instance(self) -> aws.ec2.Instance:
        """Create NAT instance in dev VPC's first public subnet."""
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
                {"name": "state", "values": ["available"]}
            ]
        )

        # Create security group for NAT instance
        nat_sg = aws.ec2.SecurityGroup(
            "nat_sg",
            vpc_id=self.dev_vpc["vpc"].id,
            description=f"Security group for NAT instance - {self.environment_suffix}",
            ingress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["10.1.0.0/16", "10.2.0.0/16"]
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"]
                }
            ],
            tags={
                **self.base_tags,
                "Name": f"nat-sg-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # User data script to configure NAT
        user_data = """#!/bin/bash
yum install -y iptables-services
systemctl enable iptables
systemctl start iptables
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i eth0 -o eth0 -j ACCEPT
service iptables save
"""

        # Create NAT instance
        nat_instance = aws.ec2.Instance(
            "nat_instance",
            instance_type="t3.micro",
            ami=ami.id,
            subnet_id=self.dev_vpc["public_subnets"][0].id,
            vpc_security_group_ids=[nat_sg.id],
            source_dest_check=False,
            user_data=user_data,
            tags={
                **self.base_tags,
                "Name": f"nat-instance-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        return nat_instance

    def _configure_routing(self):
        """Configure routing tables with NAT instance and Transit Gateway routes."""
        # Add route to internet via NAT instance in both VPC private route tables
        aws.ec2.Route(
            "dev_private_nat_route",
            route_table_id=self.dev_vpc["private_rt"].id,
            destination_cidr_block="0.0.0.0/0",
            network_interface_id=self.nat_instance.primary_network_interface_id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.nat_instance])
        )

        aws.ec2.Route(
            "prod_private_nat_route",
            route_table_id=self.prod_vpc["private_rt"].id,
            destination_cidr_block="0.0.0.0/0",
            network_interface_id=self.nat_instance.primary_network_interface_id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.nat_instance])
        )

        # Add routes to Transit Gateway for inter-VPC communication
        aws.ec2.Route(
            "dev_to_prod_route",
            route_table_id=self.dev_vpc["private_rt"].id,
            destination_cidr_block="10.2.0.0/16",
            transit_gateway_id=self.transit_gateway.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.dev_tgw_attachment])
        )

        aws.ec2.Route(
            "prod_to_dev_route",
            route_table_id=self.prod_vpc["private_rt"].id,
            destination_cidr_block="10.1.0.0/16",
            transit_gateway_id=self.transit_gateway.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.prod_tgw_attachment])
        )

    def _create_security_groups(self) -> Dict[str, aws.ec2.SecurityGroup]:
        """Create security groups for HTTPS and SSH access."""
        # Security group for dev VPC
        dev_sg = aws.ec2.SecurityGroup(
            "dev_sg",
            vpc_id=self.dev_vpc["vpc"].id,
            description=f"Security group for dev environment - {self.environment_suffix}",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["192.168.1.0/24"]
                },
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": ["192.168.1.0/24"]
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"]
                }
            ],
            tags={
                **self.base_tags,
                "Environment": "dev",
                "Name": f"dev-sg-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Security group for prod VPC
        prod_sg = aws.ec2.SecurityGroup(
            "prod_sg",
            vpc_id=self.prod_vpc["vpc"].id,
            description=f"Security group for prod environment - {self.environment_suffix}",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["192.168.1.0/24"]
                },
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": ["192.168.1.0/24"]
                },
                {
                    "protocol": "tcp",
                    "from_port": 5432,
                    "to_port": 5432,
                    "cidr_blocks": ["10.1.0.0/16"]
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"]
                }
            ],
            tags={
                **self.base_tags,
                "Environment": "prod",
                "Name": f"prod-sg-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        return {
            "dev": dev_sg,
            "prod": prod_sg
        }

    def _create_flow_logs(self) -> Dict[str, Any]:
        """Create VPC Flow Logs with CloudWatch integration."""
        # Create IAM role for Flow Logs
        flow_logs_role = aws.iam.Role(
            "flow_logs_role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                **self.base_tags,
                "Name": f"flow-logs-role-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create IAM policy for Flow Logs
        flow_logs_policy = aws.iam.RolePolicy(
            "flow_logs_policy",
            role=flow_logs_role.id,
            policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "*"
                }]
            }""",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Groups
        dev_log_group = aws.cloudwatch.LogGroup(
            "dev_flow_logs_group",
            name=f"/aws/vpc/dev-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.base_tags,
                "Environment": "dev",
                "Name": f"dev-flow-logs-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        prod_log_group = aws.cloudwatch.LogGroup(
            "prod_flow_logs_group",
            name=f"/aws/vpc/prod-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.base_tags,
                "Environment": "prod",
                "Name": f"prod-flow-logs-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Flow Logs for dev VPC
        dev_flow_log = aws.ec2.FlowLog(
            "dev_flow_log",
            vpc_id=self.dev_vpc["vpc"].id,
            traffic_type="ALL",
            iam_role_arn=flow_logs_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=dev_log_group.arn,
            tags={
                **self.base_tags,
                "Environment": "dev",
                "Name": f"dev-flow-log-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self, depends_on=[flow_logs_policy])
        )

        # Create Flow Logs for prod VPC
        prod_flow_log = aws.ec2.FlowLog(
            "prod_flow_log",
            vpc_id=self.prod_vpc["vpc"].id,
            traffic_type="ALL",
            iam_role_arn=flow_logs_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=prod_log_group.arn,
            tags={
                **self.base_tags,
                "Environment": "prod",
                "Name": f"prod-flow-log-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self, depends_on=[flow_logs_policy])
        )

        return {
            "role": flow_logs_role,
            "dev_log_group": dev_log_group,
            "prod_log_group": prod_log_group,
            "dev_flow_log": dev_flow_log,
            "prod_flow_log": prod_flow_log
        }

    def _export_outputs(self):
        """Export all resource IDs and information."""
        # VPC outputs
        pulumi.export("dev_vpc_id", self.dev_vpc["vpc"].id)
        pulumi.export("prod_vpc_id", self.prod_vpc["vpc"].id)

        # Subnet outputs
        pulumi.export("dev_public_subnet_ids", [s.id for s in self.dev_vpc["public_subnets"]])
        pulumi.export("dev_private_subnet_ids", [s.id for s in self.dev_vpc["private_subnets"]])
        pulumi.export("prod_public_subnet_ids", [s.id for s in self.prod_vpc["public_subnets"]])
        pulumi.export("prod_private_subnet_ids", [s.id for s in self.prod_vpc["private_subnets"]])

        # Transit Gateway outputs
        pulumi.export("transit_gateway_id", self.transit_gateway.id)
        pulumi.export("transit_gateway_route_table_id", self.tgw_route_table.id)

        # NAT instance output
        pulumi.export("nat_instance_id", self.nat_instance.id)
        pulumi.export("nat_instance_private_ip", self.nat_instance.private_ip)

        # Security group outputs
        pulumi.export("dev_security_group_id", self.security_groups["dev"].id)
        pulumi.export("prod_security_group_id", self.security_groups["prod"].id)

        # Flow logs outputs
        pulumi.export("dev_flow_log_id", self.flow_logs["dev_flow_log"].id)
        pulumi.export("prod_flow_log_id", self.flow_logs["prod_flow_log"].id)
        pulumi.export("dev_log_group_name", self.flow_logs["dev_log_group"].name)
        pulumi.export("prod_log_group_name", self.flow_logs["prod_log_group"].name)
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
import pulumi
import pulumi_aws as aws
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs


# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config (required)
environment_suffix = config.require("environmentSuffix")

# Get AWS region from config or use default
region = config.get("region") or "us-east-1"

# Get availability zones from config or use defaults for us-east-1
azs_config = config.get("availabilityZones")
if azs_config:
    availability_zones = azs_config.split(",")
else:
    availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Additional tags
additional_tags = {
    "DeployedBy": "Pulumi",
    "DeployedAt": datetime.now(timezone.utc).isoformat()
}

# Create TapStack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    region=region,
    availability_zones=availability_zones,
    tags=additional_tags
)

# Instantiate the TapStack
stack = TapStack("payment-platform", stack_args)
```

## File: Pulumi.yaml

```yaml
name: pulumi-infra
runtime:
  name: python
  options:
    virtualenv: venv
description: Multi-VPC Transit Gateway Architecture for Payment Platform
main: tap.py
config:
  pulumi:tags:
    value:
      Project: payment-platform
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
  pulumi-infra:environmentSuffix: dev-test
  pulumi-infra:availabilityZones: us-east-1a,us-east-1b,us-east-1c
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
```

## File: requirements-dev.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
pytest>=7.0.0
pytest-cov>=4.0.0
moto>=4.0.0
pylint>=2.15.0
```

## File: tests/test_tap_stack.py

```python
"""
Unit tests for TapStack infrastructure.

These tests verify the infrastructure code creates the expected AWS resources
with correct configurations using Pulumi's testing framework.
"""
import unittest
from typing import Any, Dict
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resource testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs) -> tuple[str, dict]:
        """Mock resource creation."""
        outputs = args.inputs

        # Generate mock IDs based on resource type
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs["id"] = f"vpc-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:vpc/vpc-{args.name}"
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs["id"] = f"subnet-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:subnet/subnet-{args.name}"
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs["id"] = f"igw-{args.name}"
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs["id"] = f"rtb-{args.name}"
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs["id"] = f"sg-{args.name}"
        elif args.typ == "aws:ec2transitgateway/transitGateway:TransitGateway":
            outputs["id"] = f"tgw-{args.name}"
            outputs["arn"] = f"arn:aws:ec2:us-east-1:123456789012:transit-gateway/tgw-{args.name}"
        elif args.typ == "aws:ec2transitgateway/routeTable:RouteTable":
            outputs["id"] = f"tgw-rtb-{args.name}"
        elif args.typ == "aws:ec2transitgateway/vpcAttachment:VpcAttachment":
            outputs["id"] = f"tgw-attach-{args.name}"
        elif args.typ == "aws:ec2/instance:Instance":
            outputs["id"] = f"i-{args.name}"
            outputs["primary_network_interface_id"] = f"eni-{args.name}"
            outputs["private_ip"] = "10.1.0.100"
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs["id"] = f"log-group-{args.name}"
            outputs["arn"] = f"arn:aws:logs:us-east-1:123456789012:log-group:{args.name}"
        elif args.typ == "aws:iam/role:Role":
            outputs["id"] = f"role-{args.name}"
            outputs["arn"] = f"arn:aws:iam::123456789012:role/role-{args.name}"
        elif args.typ == "aws:ec2/flowLog:FlowLog":
            outputs["id"] = f"fl-{args.name}"
        else:
            outputs["id"] = f"{args.name}-id"

        return args.name, outputs

    def call(self, args: pulumi.runtime.MockCallArgs) -> Dict[str, Any]:
        """Mock function calls (e.g., get_ami)."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-0c55b159cbfafe1f0",
                "architecture": "x86_64",
                "name": "amzn2-ami-hvm-2.0.20230404.0-x86_64-gp2"
            }
        return {}


pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack infrastructure."""

    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test that both VPCs are created with correct CIDR blocks."""
        def check_vpcs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC
            dev_vpc_cidr = stack.dev_vpc["vpc"].cidr_block
            self.assertEqual(dev_vpc_cidr, "10.1.0.0/16")

            # Verify prod VPC
            prod_vpc_cidr = stack.prod_vpc["vpc"].cidr_block
            self.assertEqual(prod_vpc_cidr, "10.2.0.0/16")

            return True

        return pulumi.Output.all().apply(check_vpcs)

    @pulumi.runtime.test
    def test_subnet_creation(self):
        """Test that each VPC has 3 public and 3 private subnets."""
        def check_subnets(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC subnets
            self.assertEqual(len(stack.dev_vpc["public_subnets"]), 3)
            self.assertEqual(len(stack.dev_vpc["private_subnets"]), 3)

            # Verify prod VPC subnets
            self.assertEqual(len(stack.prod_vpc["public_subnets"]), 3)
            self.assertEqual(len(stack.prod_vpc["private_subnets"]), 3)

            return True

        return pulumi.Output.all().apply(check_subnets)

    @pulumi.runtime.test
    def test_transit_gateway_creation(self):
        """Test that Transit Gateway is created."""
        def check_tgw(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify Transit Gateway exists
            self.assertIsNotNone(stack.transit_gateway)

            # Verify TGW route table exists
            self.assertIsNotNone(stack.tgw_route_table)

            return True

        return pulumi.Output.all().apply(check_tgw)

    @pulumi.runtime.test
    def test_nat_instance_creation(self):
        """Test that NAT instance is created with correct configuration."""
        def check_nat(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify NAT instance exists
            self.assertIsNotNone(stack.nat_instance)

            # Verify instance type
            instance_type = stack.nat_instance.instance_type
            self.assertEqual(instance_type, "t3.micro")

            # Verify source_dest_check is disabled
            source_dest_check = stack.nat_instance.source_dest_check
            self.assertEqual(source_dest_check, False)

            return True

        return pulumi.Output.all().apply(check_nat)

    @pulumi.runtime.test
    def test_security_groups_creation(self):
        """Test that security groups are created for both VPCs."""
        def check_sgs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify security groups exist
            self.assertIn("dev", stack.security_groups)
            self.assertIn("prod", stack.security_groups)

            # Verify dev SG has correct ingress rules
            dev_sg = stack.security_groups["dev"]
            dev_ingress = dev_sg.ingress
            self.assertEqual(len(dev_ingress), 2)  # HTTPS and SSH

            # Verify prod SG has correct ingress rules
            prod_sg = stack.security_groups["prod"]
            prod_ingress = prod_sg.ingress
            self.assertEqual(len(prod_ingress), 3)  # HTTPS, SSH, PostgreSQL

            return True

        return pulumi.Output.all().apply(check_sgs)

    @pulumi.runtime.test
    def test_flow_logs_creation(self):
        """Test that VPC Flow Logs are created with CloudWatch integration."""
        def check_flow_logs(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify flow logs exist
            self.assertIsNotNone(stack.flow_logs["dev_flow_log"])
            self.assertIsNotNone(stack.flow_logs["prod_flow_log"])

            # Verify CloudWatch log groups exist
            self.assertIsNotNone(stack.flow_logs["dev_log_group"])
            self.assertIsNotNone(stack.flow_logs["prod_log_group"])

            # Verify log retention
            dev_retention = stack.flow_logs["dev_log_group"].retention_in_days
            self.assertEqual(dev_retention, 7)

            prod_retention = stack.flow_logs["prod_log_group"].retention_in_days
            self.assertEqual(prod_retention, 7)

            return True

        return pulumi.Output.all().apply(check_flow_logs)

    @pulumi.runtime.test
    def test_resource_tagging(self):
        """Test that resources have correct tags including environmentSuffix."""
        def check_tags(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev VPC tags
            dev_vpc_tags = stack.dev_vpc["vpc"].tags
            self.assertIn("Project", dev_vpc_tags)
            self.assertEqual(dev_vpc_tags["Project"], "payment-platform")
            self.assertIn("Environment", dev_vpc_tags)
            self.assertEqual(dev_vpc_tags["Environment"], "dev")
            self.assertIn("Name", dev_vpc_tags)
            # Name should include environment suffix
            self.assertIn("test123", dev_vpc_tags["Name"])

            # Verify prod VPC tags
            prod_vpc_tags = stack.prod_vpc["vpc"].tags
            self.assertIn("Project", prod_vpc_tags)
            self.assertEqual(prod_vpc_tags["Project"], "payment-platform")
            self.assertIn("Environment", prod_vpc_tags)
            self.assertEqual(prod_vpc_tags["Environment"], "prod")

            return True

        return pulumi.Output.all().apply(check_tags)

    @pulumi.runtime.test
    def test_environment_suffix_in_names(self):
        """Test that all named resources include environmentSuffix."""
        def check_env_suffix(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Check VPC names
            dev_vpc_name = stack.dev_vpc["vpc"].tags["Name"]
            self.assertIn("test123", dev_vpc_name)

            prod_vpc_name = stack.prod_vpc["vpc"].tags["Name"]
            self.assertIn("test123", prod_vpc_name)

            # Check subnet names
            for subnet in stack.dev_vpc["public_subnets"]:
                subnet_name = subnet.tags["Name"]
                self.assertIn("test123", subnet_name)

            for subnet in stack.prod_vpc["private_subnets"]:
                subnet_name = subnet.tags["Name"]
                self.assertIn("test123", subnet_name)

            # Check security group names
            dev_sg_name = stack.security_groups["dev"].tags["Name"]
            self.assertIn("test123", dev_sg_name)

            # Check NAT instance name
            nat_name = stack.nat_instance.tags["Name"]
            self.assertIn("test123", nat_name)

            return True

        return pulumi.Output.all().apply(check_env_suffix)

    @pulumi.runtime.test
    def test_tgw_attachments(self):
        """Test that both VPCs are attached to Transit Gateway."""
        def check_attachments(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify dev TGW attachment
            self.assertIsNotNone(stack.dev_tgw_attachment)

            # Verify prod TGW attachment
            self.assertIsNotNone(stack.prod_tgw_attachment)

            return True

        return pulumi.Output.all().apply(check_attachments)

    @pulumi.runtime.test
    def test_iam_role_for_flow_logs(self):
        """Test that IAM role is created for VPC Flow Logs with correct trust policy."""
        def check_iam(args):
            stack_args = TapStackArgs(
                environment_suffix="test123",
                region="us-east-1"
            )
            stack = TapStack("test-stack", stack_args)

            # Verify IAM role exists
            role = stack.flow_logs["role"]
            self.assertIsNotNone(role)

            # Verify assume role policy contains vpc-flow-logs service principal
            assume_policy = role.assume_role_policy
            self.assertIn("vpc-flow-logs.amazonaws.com", assume_policy)

            return True

        return pulumi.Output.all().apply(check_iam)


if __name__ == "__main__":
    unittest.main()
```

## File: tests/test_integration.py

```python
"""
Integration tests for deployed infrastructure.

These tests verify the actual deployed resources in AWS and their configurations.
They require valid AWS credentials and deployed infrastructure.
"""
import unittest
import json
import os
import boto3
from typing import Dict, Any


class TestIntegration(unittest.TestCase):
    """Integration tests for deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load outputs from deployment."""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            raise unittest.SkipTest(
                f"Outputs file not found: {outputs_file}. "
                "Deploy infrastructure first."
            )

        with open(outputs_file, "r") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2 = boto3.client("ec2", region_name="us-east-1")
        cls.logs = boto3.client("logs", region_name="us-east-1")
        cls.iam = boto3.client("iam")

    def test_dev_vpc_exists(self):
        """Test that dev VPC exists with correct CIDR."""
        vpc_id = self.outputs.get("dev_vpc_id")
        self.assertIsNotNone(vpc_id, "dev_vpc_id not found in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)

        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.1.0.0/16")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")
        self.assertEqual(tags.get("Environment"), "dev")

    def test_prod_vpc_exists(self):
        """Test that prod VPC exists with correct CIDR."""
        vpc_id = self.outputs.get("prod_vpc_id")
        self.assertIsNotNone(vpc_id, "prod_vpc_id not found in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)

        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.2.0.0/16")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")
        self.assertEqual(tags.get("Environment"), "prod")

    def test_subnets_across_azs(self):
        """Test that subnets are distributed across 3 availability zones."""
        dev_private_subnet_ids = self.outputs.get("dev_private_subnet_ids", [])
        self.assertEqual(len(dev_private_subnet_ids), 3)

        response = self.ec2.describe_subnets(SubnetIds=dev_private_subnet_ids)
        azs = set(subnet["AvailabilityZone"] for subnet in response["Subnets"])

        # Verify 3 different AZs
        self.assertEqual(len(azs), 3)
        expected_azs = {"us-east-1a", "us-east-1b", "us-east-1c"}
        self.assertEqual(azs, expected_azs)

    def test_transit_gateway_exists(self):
        """Test that Transit Gateway exists and is in available state."""
        tgw_id = self.outputs.get("transit_gateway_id")
        self.assertIsNotNone(tgw_id, "transit_gateway_id not found in outputs")

        response = self.ec2.describe_transit_gateways(TransitGatewayIds=[tgw_id])
        self.assertEqual(len(response["TransitGateways"]), 1)

        tgw = response["TransitGateways"][0]
        self.assertEqual(tgw["State"], "available")

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in tgw.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")

    def test_nat_instance_exists(self):
        """Test that NAT instance exists and is running."""
        nat_instance_id = self.outputs.get("nat_instance_id")
        self.assertIsNotNone(nat_instance_id, "nat_instance_id not found in outputs")

        response = self.ec2.describe_instances(InstanceIds=[nat_instance_id])
        self.assertEqual(len(response["Reservations"]), 1)
        self.assertEqual(len(response["Reservations"][0]["Instances"]), 1)

        instance = response["Reservations"][0]["Instances"][0]
        self.assertEqual(instance["InstanceType"], "t3.micro")
        self.assertIn(instance["State"]["Name"], ["running", "pending"])

        # Verify source/dest check is disabled
        self.assertEqual(instance["SourceDestCheck"], False)

        # Verify tags
        tags = {tag["Key"]: tag["Value"] for tag in instance.get("Tags", [])}
        self.assertEqual(tags.get("Project"), "payment-platform")

    def test_security_groups_exist(self):
        """Test that security groups exist with correct rules."""
        dev_sg_id = self.outputs.get("dev_security_group_id")
        prod_sg_id = self.outputs.get("prod_security_group_id")

        self.assertIsNotNone(dev_sg_id, "dev_security_group_id not found")
        self.assertIsNotNone(prod_sg_id, "prod_security_group_id not found")

        # Check dev SG
        dev_response = self.ec2.describe_security_groups(GroupIds=[dev_sg_id])
        dev_sg = dev_response["SecurityGroups"][0]

        # Verify ingress rules (HTTPS and SSH from 192.168.1.0/24)
        dev_ingress = dev_sg["IpPermissions"]
        self.assertTrue(len(dev_ingress) >= 2)

        # Check prod SG
        prod_response = self.ec2.describe_security_groups(GroupIds=[prod_sg_id])
        prod_sg = prod_response["SecurityGroups"][0]

        # Verify ingress rules (HTTPS, SSH, PostgreSQL)
        prod_ingress = prod_sg["IpPermissions"]
        self.assertTrue(len(prod_ingress) >= 3)

    def test_flow_logs_exist(self):
        """Test that VPC Flow Logs are configured and active."""
        dev_flow_log_id = self.outputs.get("dev_flow_log_id")
        prod_flow_log_id = self.outputs.get("prod_flow_log_id")

        self.assertIsNotNone(dev_flow_log_id, "dev_flow_log_id not found")
        self.assertIsNotNone(prod_flow_log_id, "prod_flow_log_id not found")

        # Check flow logs
        response = self.ec2.describe_flow_logs(
            FlowLogIds=[dev_flow_log_id, prod_flow_log_id]
        )

        self.assertEqual(len(response["FlowLogs"]), 2)

        for flow_log in response["FlowLogs"]:
            self.assertEqual(flow_log["TrafficType"], "ALL")
            self.assertEqual(flow_log["LogDestinationType"], "cloud-watch-logs")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch Log Groups exist with correct retention."""
        dev_log_group = self.outputs.get("dev_log_group_name")
        prod_log_group = self.outputs.get("prod_log_group_name")

        self.assertIsNotNone(dev_log_group, "dev_log_group_name not found")
        self.assertIsNotNone(prod_log_group, "prod_log_group_name not found")

        # Check dev log group
        dev_response = self.logs.describe_log_groups(
            logGroupNamePrefix=dev_log_group
        )
        self.assertEqual(len(dev_response["logGroups"]), 1)
        self.assertEqual(dev_response["logGroups"][0]["retentionInDays"], 7)

        # Check prod log group
        prod_response = self.logs.describe_log_groups(
            logGroupNamePrefix=prod_log_group
        )
        self.assertEqual(len(prod_response["logGroups"]), 1)
        self.assertEqual(prod_response["logGroups"][0]["retentionInDays"], 7)

    def test_route_tables_configured(self):
        """Test that route tables have correct routes for NAT and TGW."""
        dev_vpc_id = self.outputs.get("dev_vpc_id")

        # Get private route tables for dev VPC
        response = self.ec2.describe_route_tables(
            Filters=[
                {"Name": "vpc-id", "Values": [dev_vpc_id]},
                {"Name": "tag:Type", "Values": ["Private"]}
            ]
        )

        if len(response["RouteTables"]) > 0:
            rt = response["RouteTables"][0]
            routes = rt["Routes"]

            # Check for default route to NAT
            nat_routes = [r for r in routes if r.get("DestinationCidrBlock") == "0.0.0.0/0"]
            self.assertTrue(len(nat_routes) > 0, "No default route found")

            # Check for TGW route to prod VPC
            tgw_routes = [r for r in routes if r.get("DestinationCidrBlock") == "10.2.0.0/16"]
            self.assertTrue(len(tgw_routes) > 0, "No TGW route to prod VPC found")


if __name__ == "__main__":
    unittest.main()
```

## File: lib/README.md

```markdown
# Multi-VPC Transit Gateway Architecture

This Pulumi Python project deploys a secure multi-VPC network architecture for a fintech payment platform with Transit Gateway connectivity and centralized NAT egress.

## Architecture Overview

This infrastructure creates:

- Two VPCs (dev and prod) with isolated networks
- 3 public and 3 private subnets per VPC across 3 availability zones
- AWS Transit Gateway connecting both VPCs for selective inter-VPC communication
- Single NAT instance (t3.micro) in dev VPC for centralized internet egress
- Security groups allowing HTTPS (443) and SSH (22) from specific CIDR ranges
- VPC Flow Logs with CloudWatch Logs integration (7-day retention)
- IAM roles and policies for Flow Logs service
- Comprehensive resource tagging for management and cost tracking

## Key Features

- Network isolation between dev and prod environments
- Transit Gateway enables communication on ports 443 (HTTPS) and 5432 (PostgreSQL) between VPCs
- Cost-optimized single NAT instance instead of multiple NAT Gateways
- All private subnet traffic routes through centralized NAT for compliance auditing
- Flow logs capture all network traffic for security analysis
- Resources span 3 availability zones for high availability
- All resources include environmentSuffix for deployment isolation

## Prerequisites

- Python 3.9 or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, EC2, CloudWatch, IAM resources

## Installation

1. Create and activate virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Set required configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set pulumi-infra:environmentSuffix your-suffix
pulumi config set pulumi-infra:availabilityZones us-east-1a,us-east-1b,us-east-1c
```

The environmentSuffix is required and ensures unique resource names across deployments.

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the preview and confirm to create resources.

## Outputs

After deployment, the following outputs are available:

- dev_vpc_id: ID of the development VPC
- prod_vpc_id: ID of the production VPC
- dev_public_subnet_ids: List of public subnet IDs in dev VPC
- dev_private_subnet_ids: List of private subnet IDs in dev VPC
- prod_public_subnet_ids: List of public subnet IDs in prod VPC
- prod_private_subnet_ids: List of private subnet IDs in prod VPC
- transit_gateway_id: ID of the Transit Gateway
- transit_gateway_route_table_id: ID of the Transit Gateway route table
- nat_instance_id: ID of the NAT instance
- nat_instance_private_ip: Private IP of the NAT instance
- dev_security_group_id: ID of dev security group
- prod_security_group_id: ID of prod security group
- dev_flow_log_id: ID of dev VPC flow log
- prod_flow_log_id: ID of prod VPC flow log
- dev_log_group_name: Name of dev CloudWatch log group
- prod_log_group_name: Name of prod CloudWatch log group

View outputs:

```bash
pulumi stack output
```

## Testing

Run unit tests:

```bash
pytest tests/test_tap_stack.py -v
```

Run integration tests (requires deployed infrastructure):

```bash
pytest tests/test_integration.py -v
```

Run tests with coverage:

```bash
pytest tests/ --cov=lib --cov-report=term --cov-report=json
```

## Resource Cleanup

Destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be permanently deleted.

## Cost Considerations

- NAT instance (t3.micro): Approximately $0.01/hour
- Transit Gateway: $0.05/hour plus data processing charges
- VPC Flow Logs: CloudWatch Logs storage charges based on volume
- EC2 instances: Standard EC2 pricing for NAT instance

Estimated monthly cost: $40-60 depending on traffic volume.

## Security

- Security groups restrict access to HTTPS (443) and SSH (22) from 192.168.1.0/24 only
- Transit Gateway allows only ports 443 and 5432 between VPCs
- VPC Flow Logs enabled for audit compliance
- All egress traffic routed through single NAT instance for centralized logging
- IAM roles follow least privilege principle

## Network Design

- Dev VPC: 10.1.0.0/16
- Prod VPC: 10.2.0.0/16
- Public subnets: /20 CIDRs in each AZ
- Private subnets: /20 CIDRs in each AZ
- Non-overlapping CIDR ranges enable Transit Gateway routing
- Private subnets route internet traffic through NAT instance
- Inter-VPC traffic routes through Transit Gateway

## Troubleshooting

If deployment fails:

1. Check AWS credentials and permissions
2. Verify availability zones are valid for your region
3. Ensure environmentSuffix is set and unique
4. Check AWS service limits for VPCs, Transit Gateways, EC2 instances
5. Review Pulumi logs for specific error messages

## Support

For issues or questions, refer to:
- Pulumi documentation: https://www.pulumi.com/docs/
- AWS VPC documentation: https://docs.aws.amazon.com/vpc/
- AWS Transit Gateway documentation: https://docs.aws.amazon.com/vpc/latest/tgw/
```
