"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional, Dict, List
import json

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

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
        self.tags = args.tags or {}

        # Create VPC infrastructure
        self._create_vpc_infrastructure()

    def _create_vpc_infrastructure(self) -> None:
        """
        Create a production-ready multi-tier VPC architecture with NAT instances.
        """
        environment_suffix = self.environment_suffix
        base_tags = {
            "Environment": environment_suffix,
            "Project": "payment-processing",
            "ManagedBy": "pulumi"
        }
        # Merge with custom tags
        resource_tags = {**base_tags, **self.tags}

        # VPC
        vpc = aws.ec2.Vpc(
            f"payment-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"payment-igw-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Public Subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{az}-{environment_suffix}",
                    "Tier": "public",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"private-subnet-{az}-{environment_suffix}",
                    "Tier": "private",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Database Subnets
        db_subnets = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"db-subnet-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"db-subnet-{az}-{environment_suffix}",
                    "Tier": "database",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            db_subnets.append(subnet)

        # Security Group for NAT instances
        nat_sg = aws.ec2.SecurityGroup(
            f"nat-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for NAT instances",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["10.0.0.0/16"]
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["10.0.0.0/16"]
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
                "Name": f"nat-sg-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
                {"name": "virtualization-type", "values": ["hvm"]}
            ]
        )

        # NAT Instances
        nat_instances = []
        for i, (subnet, az) in enumerate(zip(public_subnets, azs)):
            nat_instance = aws.ec2.Instance(
                f"nat-instance-{i+1}-{environment_suffix}",
                ami=ami.id,
                instance_type="t3.micro",
                subnet_id=subnet.id,
                source_dest_check=False,
                vpc_security_group_ids=[nat_sg.id],
                user_data="""#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
""",
                tags={
                    "Name": f"nat-instance-{az}-{environment_suffix}",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            nat_instances.append(nat_instance)

        # Public Route Table
        public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"public-rt-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route to Internet Gateway
        aws.ec2.Route(
            f"public-route-{environment_suffix}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Private Route Tables (one per AZ)
        private_rts = []
        for i, (nat_instance, az) in enumerate(zip(nat_instances, azs)):
            rt = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    "Name": f"private-{az}-rt-{environment_suffix}",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            private_rts.append(rt)

            # Create route to NAT instance using network interface
            aws.ec2.Route(
                f"private-route-{i+1}-{environment_suffix}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                network_interface_id=nat_instance.primary_network_interface_id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=private_subnets[i].id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Database Route Tables (one per AZ, no internet access)
        db_rts = []
        for i, az in enumerate(azs):
            rt = aws.ec2.RouteTable(
                f"db-rt-{i+1}-{environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    "Name": f"db-{az}-rt-{environment_suffix}",
                    **resource_tags
                },
                opts=ResourceOptions(parent=self)
            )
            db_rts.append(rt)

            # Associate database subnet with its route table
            aws.ec2.RouteTableAssociation(
                f"db-rta-{i+1}-{environment_suffix}",
                subnet_id=db_subnets[i].id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )

        # Bastion Security Group
        bastion_sg = aws.ec2.SecurityGroup(
            f"bastion-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for bastion hosts",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": ["0.0.0.0/0"]
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
                "Name": f"bastion-sg-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Application Security Group
        app_sg = aws.ec2.SecurityGroup(
            f"app-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for application tier",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"]
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"]
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
                "Name": f"app-sg-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Database Security Group
        db_sg = aws.ec2.SecurityGroup(
            f"db-sg-{environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for database tier",
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 3306,
                    "to_port": 3306,
                    "security_groups": [app_sg.id]
                },
                {
                    "protocol": "tcp",
                    "from_port": 5432,
                    "to_port": 5432,
                    "security_groups": [app_sg.id]
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
                "Name": f"db-sg-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # S3 Bucket for VPC Flow Logs
        flow_logs_bucket = aws.s3.Bucket(
            f"vpc-flow-logs-{environment_suffix}",
            bucket=f"vpc-flow-logs-{environment_suffix}",
            force_destroy=True,
            server_side_encryption_configuration={
                "rule": {
                    "apply_server_side_encryption_by_default": {
                        "sse_algorithm": "AES256"
                    }
                }
            },
            lifecycle_rules=[
                {
                    "enabled": True,
                    "expiration": {
                        "days": 30
                    }
                }
            ],
            tags={
                "Name": f"vpc-flow-logs-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # VPC Flow Logs IAM Role
        flow_logs_role = aws.iam.Role(
            f"vpc-flow-logs-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"vpc-flow-logs-role-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # VPC Flow Logs IAM Policy
        flow_logs_policy = aws.iam.RolePolicy(
            f"vpc-flow-logs-policy-{environment_suffix}",
            role=flow_logs_role.id,
            policy=pulumi.Output.all(flow_logs_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"{args[0]}/*",
                            args[0]
                        ]
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # VPC Flow Logs
        flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=flow_logs_bucket.arn,
            tags={
                "Name": f"vpc-flow-log-{environment_suffix}",
                **resource_tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Store resources as instance variables for access
        self.vpc = vpc
        self.igw = igw
        self.public_subnets = public_subnets
        self.private_subnets = private_subnets
        self.db_subnets = db_subnets
        self.public_rt = public_rt
        self.private_rts = private_rts
        self.db_rts = db_rts
        self.bastion_sg = bastion_sg
        self.app_sg = app_sg
        self.db_sg = db_sg
        self.nat_instances = nat_instances
        self.flow_logs_bucket = flow_logs_bucket

        # Export outputs
        pulumi.export("vpc_id", vpc.id)
        pulumi.export(
            "public_subnet_ids",
            pulumi.Output.all(*[s.id for s in public_subnets]).apply(json.dumps)
        )
        pulumi.export(
            "private_subnet_ids",
            pulumi.Output.all(*[s.id for s in private_subnets]).apply(json.dumps)
        )
        pulumi.export(
            "db_subnet_ids",
            pulumi.Output.all(*[s.id for s in db_subnets]).apply(json.dumps)
        )
        pulumi.export("public_route_table_id", public_rt.id)
        pulumi.export(
            "private_route_table_ids",
            pulumi.Output.all(*[rt.id for rt in private_rts]).apply(json.dumps)
        )
        pulumi.export(
            "db_route_table_ids",
            pulumi.Output.all(*[rt.id for rt in db_rts]).apply(json.dumps)
        )
        pulumi.export("bastion_sg_id", bastion_sg.id)
        pulumi.export("app_sg_id", app_sg.id)
        pulumi.export("db_sg_id", db_sg.id)
        pulumi.export(
            "nat_instance_ids",
            pulumi.Output.all(*[n.id for n in nat_instances]).apply(json.dumps)
        )
