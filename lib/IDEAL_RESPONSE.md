# Complete Working Solution - IPv6 Dual-Stack VPC with Pulumi Python

To create IPv6 dual-stack VPC infrastructure using Pulumi Python with proper VPC reuse to avoid deployment limits, follow these steps:

## Installation Requirements

```bash
pip install pulumi pulumi-aws
aws configure
pulumi login
```

## Working Code Implementation

### tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
"""
import os
from pulumi import Config
from lib.tap_stack import TapStack, TapStackArgs

config = Config()
environment_suffix = config.get('env') or 'dev'

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name=f"tap-stack-{environment_suffix}",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)
```

### lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for IPv6 dual-stack VPC infrastructure.
"""
import time
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags
    self.unique_suffix = f"{self.environment_suffix}-{int(time.time())}"

    def derive_ipv6_subnet_cidr(vpc_cidr, subnet_number):
      base_cidr = vpc_cidr.replace('/56', '')
      parts = base_cidr.split(':')
      if len(parts) >= 4 and parts[3]:
        base_value = int(parts[3], 16)
        new_value = base_value + subnet_number
        parts[3] = format(new_value, 'x')
        return ':'.join(parts) + '/64'
      return base_cidr.replace('::', f':{subnet_number:x}::/64')

    # VPC - Environment-based naming for reuse
    self.vpc = aws.ec2.Vpc(
      f"ipv6-vpc-{self.environment_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_support=True,
      enable_dns_hostnames=True,
      assign_generated_ipv6_cidr_block=True,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest",
        "ManagedBy": "Pulumi",
        "Name": f"ipv6-vpc-{self.environment_suffix}"
      },
      opts=ResourceOptions(parent=self)
    )

    # Internet Gateway
    self.igw = aws.ec2.InternetGateway(
      f"igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={"Name": f"igw-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Public Subnet
    self.public_subnet = aws.ec2.Subnet(
      f"public-subnet-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      cidr_block="10.0.11.0/24",
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 11)),
      availability_zone=aws.get_availability_zones().names[0],
      assign_ipv6_address_on_creation=True,
      map_public_ip_on_launch=True,
      tags={"Name": f"public-subnet-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self, replace_on_changes=["ipv6_cidr_block"])
    )

    # Private Subnet
    self.private_subnet = aws.ec2.Subnet(
      f"private-subnet-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      cidr_block="10.0.12.0/24",
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 12)),
      availability_zone=aws.get_availability_zones().names[0],
      assign_ipv6_address_on_creation=True,
      tags={"Name": f"private-subnet-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self, replace_on_changes=["ipv6_cidr_block"])
    )

    # Egress-Only Internet Gateway
    self.egress_igw = aws.ec2.EgressOnlyInternetGateway(
      f"egress-igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={"Name": f"egress-igw-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # NAT Gateway EIP
    self.nat_eip = aws.ec2.Eip(
      f"nat-eip-{self.environment_suffix}",
      domain="vpc",
      tags={"Name": f"nat-eip-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # NAT Gateway
    self.nat_gateway = aws.ec2.NatGateway(
      f"nat-gateway-{self.environment_suffix}",
      allocation_id=self.nat_eip.id,
      subnet_id=self.public_subnet.id,
      tags={"Name": f"nat-gateway-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Route Tables
    self.public_route_table = aws.ec2.RouteTable(
      f"public-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        {"cidr_block": "0.0.0.0/0", "gateway_id": self.igw.id},
        {"ipv6_cidr_block": "::/0", "gateway_id": self.igw.id}
      ],
      tags={"Name": f"public-rt-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    self.private_route_table = aws.ec2.RouteTable(
      f"private-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        {"cidr_block": "0.0.0.0/0", "nat_gateway_id": self.nat_gateway.id},
        {"ipv6_cidr_block": "::/0", "egress_only_gateway_id": self.egress_igw.id}
      ],
      tags={"Name": f"private-rt-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Route Table Associations
    self.public_rta = aws.ec2.RouteTableAssociation(
      f"public-rta-{self.environment_suffix}",
      subnet_id=self.public_subnet.id,
      route_table_id=self.public_route_table.id,
      opts=ResourceOptions(parent=self)
    )

    self.private_rta = aws.ec2.RouteTableAssociation(
      f"private-rta-{self.environment_suffix}",
      subnet_id=self.private_subnet.id,
      route_table_id=self.private_route_table.id,
      opts=ResourceOptions(parent=self)
    )

    # Security Group
    self.security_group = aws.ec2.SecurityGroup(
      f"sec-group-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      description="Security group for IPv6 dual-stack instances",
      ingress=[
        {"protocol": "tcp", "from_port": 22, "to_port": 22, "cidr_blocks": ["0.0.0.0/0"]},
        {"protocol": "tcp", "from_port": 22, "to_port": 22, "ipv6_cidr_blocks": ["::/0"]},
        {"protocol": "tcp", "from_port": 80, "to_port": 80, "cidr_blocks": ["0.0.0.0/0"]},
        {"protocol": "tcp", "from_port": 80, "to_port": 80, "ipv6_cidr_blocks": ["::/0"]}
      ],
      egress=[
        {"protocol": "-1", "from_port": 0, "to_port": 0, "cidr_blocks": ["0.0.0.0/0"]},
        {"protocol": "-1", "from_port": 0, "to_port": 0, "ipv6_cidr_blocks": ["::/0"]}
      ],
      tags={"Name": f"sec-group-{self.environment_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Launch Template - Unique naming per deployment
    self.launch_template = aws.ec2.LaunchTemplate(
      f"web-server-lt-{self.unique_suffix}",
      image_id="ami-0c94855ba95b798c7",
      instance_type="t3.micro",
      vpc_security_group_ids=[self.security_group.id],
      user_data="""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>IPv6 Dual-Stack Server</h1>" > /var/www/html/index.html
""",
      tags={"Name": f"web-server-lt-{self.unique_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # EC2 Instances - Unique naming per deployment
    self.instance1 = aws.ec2.Instance(
      f"web-server-1-{self.unique_suffix}",
      ami="ami-0c94855ba95b798c7",
      instance_type="t3.micro",
      subnet_id=self.public_subnet.id,
      vpc_security_group_ids=[self.security_group.id],
      ipv6_addresses=[self.public_subnet.ipv6_cidr_block.apply(
        lambda cidr: f"{cidr[:-3]}100")],
      user_data="#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd",
      tags={"Name": f"web-server-1-{self.unique_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    self.instance2 = aws.ec2.Instance(
      f"web-server-2-{self.unique_suffix}",
      ami="ami-0c94855ba95b798c7",
      instance_type="t3.micro",
      subnet_id=self.public_subnet.id,
      vpc_security_group_ids=[self.security_group.id],
      ipv6_addresses=[self.public_subnet.ipv6_cidr_block.apply(
        lambda cidr: f"{cidr[:-3]}200")],
      user_data="#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd",
      tags={"Name": f"web-server-2-{self.unique_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    # Auto Scaling Group
    self.auto_scaling_group = aws.autoscaling.Group(
      f"web-server-asg-{self.unique_suffix}",
      vpc_zone_identifiers=[self.public_subnet.id],
      health_check_type="EC2",
      launch_template={"id": self.launch_template.id, "version": "$Latest"},
      min_size=1,
      max_size=3,
      desired_capacity=2,
      tags=[{"key": "Name", "value": f"web-server-asg-{self.unique_suffix}", "propagate_at_launch": True}],
      opts=ResourceOptions(parent=self)
    )

    # Export all resource information
    pulumi.export("vpc_id", self.vpc.id)
    pulumi.export("vpc_ipv6_cidr_block", self.vpc.ipv6_cidr_block)
    pulumi.export("public_subnet_id", self.public_subnet.id)
    pulumi.export("public_subnet_ipv6_cidr_block", self.public_subnet.ipv6_cidr_block)
    pulumi.export("private_subnet_id", self.private_subnet.id)
    pulumi.export("private_subnet_ipv6_cidr_block", self.private_subnet.ipv6_cidr_block)
    pulumi.export("internet_gateway_id", self.igw.id)
    pulumi.export("nat_gateway_id", self.nat_gateway.id)
    pulumi.export("egress_igw_id", self.egress_igw.id)
    pulumi.export("security_group_id", self.security_group.id)
    pulumi.export("instance1_id", self.instance1.id)
    pulumi.export("instance1_public_ip", self.instance1.public_ip)
    pulumi.export("instance1_ipv6_addresses", self.instance1.ipv6_addresses)
    pulumi.export("instance2_id", self.instance2.id)
    pulumi.export("instance2_public_ip", self.instance2.public_ip)
    pulumi.export("instance2_ipv6_addresses", self.instance2.ipv6_addresses)
    pulumi.export("launch_template_id", self.launch_template.id)
    pulumi.export("autoscaling_group_name", self.auto_scaling_group.name)
```

## Solution Key Features

**VPC Reuse Strategy**: Uses environment-based naming for network resources (`ipv6-vpc-{environment}`) allowing Pulumi to automatically reuse existing VPCs, preventing VPC limit errors.

**IPv6 Dual-Stack**: Complete implementation with VPC IPv6 CIDR blocks, dual-stack subnets, static IPv6 addressing for instances, and IPv6-aware security groups.

**Deployment Success**: Network resources reuse per environment while compute resources remain unique per deployment, solving the original VPC limit issue.

## Deployment

```bash
export ENVIRONMENT_SUFFIX=pr991
pulumi up --yes --refresh
```
