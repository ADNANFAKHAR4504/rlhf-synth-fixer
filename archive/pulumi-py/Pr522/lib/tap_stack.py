"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.
  """

  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Helper function to derive IPv6 subnet CIDR from VPC CIDR
    def derive_ipv6_subnet_cidr(vpc_cidr, subnet_number):
      base_cidr = vpc_cidr.replace('/56', '')
      parts = base_cidr.split(':')
      
      if len(parts) >= 4 and parts[3]:
        base_value = int(parts[3], 16)
        new_value = base_value + subnet_number
        parts[3] = format(new_value, 'x')
        return ':'.join(parts) + '/64'
      
      return base_cidr.replace('::', f':{subnet_number:x}::/64')

    # Create a VPC with both IPv4 and IPv6 CIDR blocks
    self.vpc = aws.ec2.Vpc(
      f"ipv6-vpc-{self.environment_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_support=True,
      enable_dns_hostnames=True,
      assign_generated_ipv6_cidr_block=True,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create an Internet Gateway
    self.igw = aws.ec2.InternetGateway(
      f"igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create a public subnet with IPv6 CIDR block
    self.public_subnet = aws.ec2.Subnet(
      f"public-subnet-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      cidr_block="10.0.11.0/24",
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 1)),
      availability_zone=aws.get_availability_zones().names[0],
      assign_ipv6_address_on_creation=True,
      map_public_ip_on_launch=True,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=pulumi.ResourceOptions(
        replace_on_changes=["ipv6_cidr_block", "assign_ipv6_address_on_creation"],
        parent=self
      ))

    # Create a private subnet with IPv6 CIDR block
    self.private_subnet = aws.ec2.Subnet(
      f"private-subnet-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      cidr_block="10.0.12.0/24",
      ipv6_cidr_block=self.vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 2)),
      availability_zone=aws.get_availability_zones().names[1],
      assign_ipv6_address_on_creation=True,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=pulumi.ResourceOptions(
        replace_on_changes=["ipv6_cidr_block", "assign_ipv6_address_on_creation"],
        parent=self
      ))

    # Create a route table for the public subnet
    self.public_rt = aws.ec2.RouteTable(
      f"public-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        aws.ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          gateway_id=self.igw.id,
        ),
        aws.ec2.RouteTableRouteArgs(
          ipv6_cidr_block="::/0",
          gateway_id=self.igw.id,
        )
      ],
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Associate the public route table with the public subnet
    self.public_rta = aws.ec2.RouteTableAssociation(
      f"public-rta-{self.environment_suffix}",
      subnet_id=self.public_subnet.id,
      route_table_id=self.public_rt.id,
      opts=ResourceOptions(parent=self))

    # Create a NAT Gateway for the private subnet
    self.eip = aws.ec2.Eip(
      f"nat-eip-{self.environment_suffix}",
      vpc=True,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    self.nat_gateway = aws.ec2.NatGateway(
      f"nat-gateway-{self.environment_suffix}",
      allocation_id=self.eip.id,
      subnet_id=self.public_subnet.id,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create an Egress-Only Internet Gateway for private subnet IPv6 access
    self.egress_igw = aws.ec2.EgressOnlyInternetGateway(
      f"egress-igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create a route table for the private subnet
    self.private_rt = aws.ec2.RouteTable(
      f"private-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        aws.ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          nat_gateway_id=self.nat_gateway.id,
        ),
        aws.ec2.RouteTableRouteArgs(
          ipv6_cidr_block="::/0",
          egress_only_gateway_id=self.egress_igw.id,
        )
      ],
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Associate the private route table with the private subnet
    self.private_rta = aws.ec2.RouteTableAssociation(
      f"private-rta-{self.environment_suffix}",
      subnet_id=self.private_subnet.id,
      route_table_id=self.private_rt.id,
      opts=ResourceOptions(parent=self))

    # Create a security group allowing SSH access from specific IPv6 range
    self.security_group = aws.ec2.SecurityGroup(
      f"sec-group-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      ingress=[aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=22,
        to_port=22,
        ipv6_cidr_blocks=["2001:db8::/32"]
      )],
      egress=[aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        ipv6_cidr_blocks=["::/0"]
      )],
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create a launch template for the auto-scaling group
    ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}])

    user_data = """#!/bin/bash
echo "Hello, World!" > index.html
nohup python3 -m http.server 80 &
"""

    self.launch_template = aws.ec2.LaunchTemplate(
      f"web-server-lt-{self.environment_suffix}",
      image_id=ami.id,
      instance_type="t3.micro",
      vpc_security_group_ids=[self.security_group.id],
      user_data=pulumi.Output.from_input(user_data).apply(
        lambda x: __import__('base64').b64encode(x.encode()).decode()),
      tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
          resource_type="instance",
          tags={
            "Environment": "Production",
            "Project": "IPv6StaticTest"
          }
        )
      ],
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
      },
      opts=ResourceOptions(parent=self))

    # Create EC2 instances with static IPv6 addresses in public subnet
    self.instance1 = aws.ec2.Instance(
      f"web-server-1-{self.environment_suffix}",
      ami=ami.id,
      instance_type="t3.micro",
      subnet_id=self.public_subnet.id,
      vpc_security_group_ids=[self.security_group.id],
      user_data=user_data,
      ipv6_address_count=1,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest",
        "Name": f"web-server-1-{self.environment_suffix}"
      },
      opts=pulumi.ResourceOptions(
        replace_on_changes=["subnet_id", "ipv6_address_count"],
        depends_on=[self.public_subnet],
        parent=self
      ))

    self.instance2 = aws.ec2.Instance(
      f"web-server-2-{self.environment_suffix}",
      ami=ami.id,
      instance_type="t3.micro",
      subnet_id=self.public_subnet.id,
      vpc_security_group_ids=[self.security_group.id],
      user_data=user_data,
      ipv6_address_count=1,
      tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest",
        "Name": f"web-server-2-{self.environment_suffix}"
      },
      opts=pulumi.ResourceOptions(
        replace_on_changes=["subnet_id", "ipv6_address_count"],
        depends_on=[self.public_subnet],
        parent=self
      ))

    # Create an auto-scaling group for the public subnet
    self.asg = aws.autoscaling.Group(
      f"web-server-asg-{self.environment_suffix}",
      launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=self.launch_template.id,
        version="$Latest"
      ),
      min_size=1,
      max_size=2,
      desired_capacity=1,
      vpc_zone_identifiers=[self.public_subnet.id],
      tags=[{
        "key": "Environment",
        "value": "Production",
        "propagate_at_launch": True
      }, {
        "key": "Project",
        "value": "IPv6StaticTest",
        "propagate_at_launch": True
      }],
      opts=pulumi.ResourceOptions(
        replace_on_changes=["vpc_zone_identifiers"],
        depends_on=[self.public_subnet],
        parent=self
      ))

    # Export key resource IDs and IPv6 information
    pulumi.export("vpc_id", self.vpc.id)
    pulumi.export("vpc_ipv6_cidr_block", self.vpc.ipv6_cidr_block)
    pulumi.export("public_subnet_id", self.public_subnet.id)
    pulumi.export("public_subnet_ipv6_cidr_block", self.public_subnet.ipv6_cidr_block)
    pulumi.export("private_subnet_id", self.private_subnet.id)
    pulumi.export("private_subnet_ipv6_cidr_block", self.private_subnet.ipv6_cidr_block)
    pulumi.export("security_group_id", self.security_group.id)
    pulumi.export("instance1_id", self.instance1.id)
    pulumi.export("instance1_ipv6_addresses", self.instance1.ipv6_addresses)
    pulumi.export("instance2_id", self.instance2.id)
    pulumi.export("instance2_ipv6_addresses", self.instance2.ipv6_addresses)
    pulumi.export("nat_gateway_id", self.nat_gateway.id)
    pulumi.export("egress_igw_id", self.egress_igw.id)

    # Register outputs
    self.register_outputs({})
