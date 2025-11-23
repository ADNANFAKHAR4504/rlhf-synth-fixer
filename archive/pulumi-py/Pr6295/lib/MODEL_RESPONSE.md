# Pulumi Python VPC Infrastructure for Payment Processing Platform

This solution creates a production-ready VPC infrastructure with proper network segmentation for PCI-DSS compliance.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for deploying a production-ready VPC
infrastructure for payment processing applications with PCI-DSS compliance.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for VPC infrastructure.

    Creates a VPC with public and private subnets across 3 availability zones,
    NAT Gateways, Internet Gateway, Network ACLs, and VPC Flow Logs.

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
        self.tags = args.tags

        # VPC Configuration
        vpc_cidr = "10.0.0.0/16"
        availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
        region = "us-east-1"

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "payment-processing",
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{self.environment_suffix}-{region}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"igw-{self.environment_suffix}-{region}",
                "Environment": self.environment_suffix,
                "Purpose": "public-internet-access",
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create Subnets (3 public, 3 private)
        self.public_subnets = []
        self.private_subnets = []

        for i, az in enumerate(availability_zones):
            # Public subnet CIDR: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
            public_cidr = f"10.0.{i}.0/24"
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{self.environment_suffix}-{az}",
                vpc_id=self.vpc.id,
                cidr_block=public_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    "Name": f"public-subnet-{self.environment_suffix}-{az}",
                    "Environment": self.environment_suffix,
                    "Tier": "public",
                    "Purpose": "load-balancers",
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(public_subnet)

            # Private subnet CIDR: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
            private_cidr = f"10.0.{10 + i}.0/24"
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{self.environment_suffix}-{az}",
                vpc_id=self.vpc.id,
                cidr_block=private_cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.tags,
                    "Name": f"private-subnet-{self.environment_suffix}-{az}",
                    "Environment": self.environment_suffix,
                    "Tier": "private",
                    "Purpose": "application-servers",
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(private_subnet)

        # Create Elastic IPs and NAT Gateways for each public subnet
        self.nat_gateways = []
        self.eips = []

        for i, (az, public_subnet) in enumerate(zip(availability_zones, self.public_subnets)):
            eip = aws.ec2.Eip(
                f"eip-{self.environment_suffix}-{az}",
                domain="vpc",
                tags={
                    **self.tags,
                    "Name": f"eip-{self.environment_suffix}-{az}",
                    "Environment": self.environment_suffix,
                    "Purpose": "nat-gateway",
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.eips.append(eip)

            nat_gateway = aws.ec2.NatGateway(
                f"nat-{self.environment_suffix}-{az}",
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.tags,
                    "Name": f"nat-{self.environment_suffix}-{az}",
                    "Environment": self.environment_suffix,
                    "Purpose": "private-outbound",
                },
                opts=ResourceOptions(parent=public_subnet, depends_on=[self.igw])
            )
            self.nat_gateways.append(nat_gateway)

        # Create Public Route Table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"public-rt-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Tier": "public",
                "Purpose": "internet-gateway-routing",
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to Internet Gateway
        public_route = aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Associate public subnets with public route table
        for i, public_subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{self.environment_suffix}-{i}",
                subnet_id=public_subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self.public_route_table)
            )

        # Create Private Route Tables (one per AZ with NAT Gateway)
        self.private_route_tables = []
        for i, (az, nat_gateway, private_subnet) in enumerate(
            zip(availability_zones, self.nat_gateways, self.private_subnets)
        ):
            private_route_table = aws.ec2.RouteTable(
                f"private-rt-{self.environment_suffix}-{az}",
                vpc_id=self.vpc.id,
                tags={
                    **self.tags,
                    "Name": f"private-rt-{self.environment_suffix}-{az}",
                    "Environment": self.environment_suffix,
                    "Tier": "private",
                    "Purpose": "nat-gateway-routing",
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_route_tables.append(private_route_table)

            # Add route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{self.environment_suffix}-{az}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=private_route_table)
            )

            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{self.environment_suffix}-{az}",
                subnet_id=private_subnet.id,
                route_table_id=private_route_table.id,
                opts=ResourceOptions(parent=private_route_table)
            )

        # Create Network ACL for public subnets
        self.public_nacl = aws.ec2.NetworkAcl(
            f"public-nacl-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"public-nacl-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Tier": "public",
                "Purpose": "http-https-only",
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Inbound HTTP rule
        aws.ec2.NetworkAclRule(
            f"public-nacl-http-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=80,
            to_port=80,
            egress=False,
            opts=ResourceOptions(parent=self.public_nacl)
        )

        # Inbound HTTPS rule
        aws.ec2.NetworkAclRule(
            f"public-nacl-https-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=443,
            to_port=443,
            egress=False,
            opts=ResourceOptions(parent=self.public_nacl)
        )

        # Inbound ephemeral ports (for return traffic)
        aws.ec2.NetworkAclRule(
            f"public-nacl-ephemeral-in-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=120,
            protocol="tcp",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=self.public_nacl)
        )

        # Outbound allow all
        aws.ec2.NetworkAclRule(
            f"public-nacl-all-out-{self.environment_suffix}",
            network_acl_id=self.public_nacl.id,
            rule_number=100,
            protocol="-1",
            rule_action="allow",
            cidr_block="0.0.0.0/0",
            egress=True,
            opts=ResourceOptions(parent=self.public_nacl)
        )

        # Associate public subnets with NACL
        for i, public_subnet in enumerate(self.public_subnets):
            aws.ec2.NetworkAclAssociation(
                f"public-nacl-assoc-{self.environment_suffix}-{i}",
                network_acl_id=self.public_nacl.id,
                subnet_id=public_subnet.id,
                opts=ResourceOptions(parent=self.public_nacl)
            )

        # Create CloudWatch Log Group for VPC Flow Logs
        self.flow_log_group = aws.cloudwatch.LogGroup(
            f"vpc-flow-logs-{self.environment_suffix}",
            name=f"/aws/vpc/flow-logs-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                "Name": f"vpc-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "network-monitoring",
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create IAM Role for VPC Flow Logs
        flow_log_role = aws.iam.Role(
            f"vpc-flow-log-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }""",
            tags={
                **self.tags,
                "Name": f"vpc-flow-log-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create IAM Policy for VPC Flow Logs
        flow_log_policy = aws.iam.RolePolicy(
            f"vpc-flow-log-policy-{self.environment_suffix}",
            role=flow_log_role.id,
            policy=self.flow_log_group.arn.apply(lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "{arn}:*"
                    }}
                ]
            }}"""),
            opts=ResourceOptions(parent=flow_log_role)
        )

        # Create VPC Flow Log
        self.flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            iam_role_arn=flow_log_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=self.flow_log_group.arn,
            tags={
                **self.tags,
                "Name": f"vpc-flow-log-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "security-monitoring",
            },
            opts=ResourceOptions(parent=self.vpc, depends_on=[flow_log_policy])
        )

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "vpc_cidr": self.vpc.cidr_block,
            "public_subnet_ids": [subnet.id for subnet in self.public_subnets],
            "private_subnet_ids": [subnet.id for subnet in self.private_subnets],
            "nat_gateway_ids": [nat.id for nat in self.nat_gateways],
            "internet_gateway_id": self.igw.id,
            "flow_log_id": self.flow_log.id,
            "flow_log_group_name": self.flow_log_group.name,
        })
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for VPC infrastructure.
"""
import os
import pulumi
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create stack
stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)

# Export outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("vpc_cidr", stack.vpc.cidr_block)
pulumi.export("public_subnet_ids", [subnet.id for subnet in stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in stack.private_subnets])
pulumi.export("nat_gateway_ids", [nat.id for nat in stack.nat_gateways])
pulumi.export("internet_gateway_id", stack.igw.id)
pulumi.export("flow_log_id", stack.flow_log.id)
pulumi.export("flow_log_group_name", stack.flow_log_group.name)
```

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   pip install pulumi pulumi-aws
   ```

2. **Configure AWS**:
   ```bash
   pulumi config set aws:region us-east-1
   ```

3. **Deploy**:
   ```bash
   pulumi up
   ```

4. **Verify Outputs**:
   ```bash
   pulumi stack output vpc_id
   pulumi stack output public_subnet_ids
   ```

5. **Destroy** (when needed):
   ```bash
   pulumi destroy
   ```

## Architecture

- **VPC**: 10.0.0.0/16 with DNS hostnames
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- **NAT Gateways**: One per AZ in public subnets
- **Network ACLs**: HTTP/HTTPS only for public subnets
- **VPC Flow Logs**: All traffic to CloudWatch
