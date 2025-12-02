"""
TapStack - Multi-VPC Peering Architecture

This module implements a secure multi-VPC network foundation for a fintech payment platform,
featuring VPC Peering connectivity, centralized NAT egress, and comprehensive flow logging.
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
    Multi-VPC Peering Infrastructure Stack

    Creates:
    - Two VPCs (dev and prod) with public and private subnets across 3 AZs
    - VPC Peering connection for inter-VPC connectivity
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

        # Base tags for all resources (without Environment - set per VPC)
        self.base_tags = {
            "Project": "payment-platform",
            "ManagedBy": "Pulumi",
            **args.tags
        }

        # Create VPCs with environment-specific tags
        self.dev_vpc = self._create_vpc(
            "dev",
            "10.1.0.0/16",
            {**self.base_tags, "Environment": "dev"}
        )

        self.prod_vpc = self._create_vpc(
            "prod",
            "10.2.0.0/16",
            {**self.base_tags, "Environment": "prod"}
        )

        # Create VPC Peering connection
        self.vpc_peering = self._create_vpc_peering()

        # Create NAT instances in each VPC
        self.dev_nat_instance = self._create_nat_instance("dev", self.dev_vpc)
        self.prod_nat_instance = self._create_nat_instance("prod", self.prod_vpc)

        # Update route tables to use NAT instances and VPC Peering
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

        # Create private route table (will be updated later with NAT and peering routes)
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

    def _create_vpc_peering(self) -> aws.ec2.VpcPeeringConnection:
        """Create VPC Peering connection for inter-VPC connectivity."""
        # Create VPC Peering connection from dev to prod
        peering = aws.ec2.VpcPeeringConnection(
            "vpc_peering",
            vpc_id=self.dev_vpc["vpc"].id,
            peer_vpc_id=self.prod_vpc["vpc"].id,
            auto_accept=True,
            accepter=aws.ec2.VpcPeeringConnectionAccepterArgs(
                allow_remote_vpc_dns_resolution=True,
            ),
            requester=aws.ec2.VpcPeeringConnectionRequesterArgs(
                allow_remote_vpc_dns_resolution=True,
            ),
            tags={
                **self.base_tags,
                "Name": f"dev-to-prod-peering-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        return peering

    def _create_nat_instance(self, name: str, vpc: Dict[str, Any]) -> aws.ec2.Instance:
        """Create NAT instance in the specified VPC's first public subnet."""
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
            f"{name}_nat_sg",
            vpc_id=vpc["vpc"].id,
            description=f"Security group for {name} NAT instance - {self.environment_suffix}",
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
                "Environment": name,
                "Name": f"{name}-nat-sg-{self.environment_suffix}"
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
            f"{name}_nat_instance",
            instance_type="t3.micro",
            ami=ami.id,
            subnet_id=vpc["public_subnets"][0].id,
            vpc_security_group_ids=[nat_sg.id],
            source_dest_check=False,
            user_data=user_data,
            tags={
                **self.base_tags,
                "Environment": name,
                "Name": f"{name}-nat-instance-{self.environment_suffix}"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )

        return nat_instance

    def _configure_routing(self):
        """Configure routing tables with NAT instances and VPC Peering routes."""
        # Add route to internet via each VPC's own NAT instance
        aws.ec2.Route(
            "dev_private_nat_route",
            route_table_id=self.dev_vpc["private_rt"].id,
            destination_cidr_block="0.0.0.0/0",
            network_interface_id=self.dev_nat_instance.primary_network_interface_id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.dev_nat_instance])
        )

        aws.ec2.Route(
            "prod_private_nat_route",
            route_table_id=self.prod_vpc["private_rt"].id,
            destination_cidr_block="0.0.0.0/0",
            network_interface_id=self.prod_nat_instance.primary_network_interface_id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.prod_nat_instance])
        )

        # Add routes via VPC Peering for inter-VPC communication
        aws.ec2.Route(
            "dev_to_prod_route",
            route_table_id=self.dev_vpc["private_rt"].id,
            destination_cidr_block="10.2.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.vpc_peering])
        )

        aws.ec2.Route(
            "prod_to_dev_route",
            route_table_id=self.prod_vpc["private_rt"].id,
            destination_cidr_block="10.1.0.0/16",
            vpc_peering_connection_id=self.vpc_peering.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.vpc_peering])
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

        # VPC Peering output
        pulumi.export("vpc_peering_id", self.vpc_peering.id)

        # NAT instance outputs
        pulumi.export("dev_nat_instance_id", self.dev_nat_instance.id)
        pulumi.export("dev_nat_instance_private_ip", self.dev_nat_instance.private_ip)
        pulumi.export("prod_nat_instance_id", self.prod_nat_instance.id)
        pulumi.export("prod_nat_instance_private_ip", self.prod_nat_instance.private_ip)

        # Security group outputs
        pulumi.export("dev_security_group_id", self.security_groups["dev"].id)
        pulumi.export("prod_security_group_id", self.security_groups["prod"].id)

        # Flow logs outputs
        pulumi.export("dev_flow_log_id", self.flow_logs["dev_flow_log"].id)
        pulumi.export("prod_flow_log_id", self.flow_logs["prod_flow_log"].id)
        pulumi.export("dev_log_group_name", self.flow_logs["dev_log_group"].name)
        pulumi.export("prod_log_group_name", self.flow_logs["prod_log_group"].name)
