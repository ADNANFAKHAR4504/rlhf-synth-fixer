"""
AWS Dual-Stack Infrastructure with Pulumi
=========================================

This module provisions a highly available, scalable, and secure AWS infrastructure
following best practices, including public/private subnets, a NAT Gateway, and
an Auto Scaling Group.

Author: Senior DevOps Engineer
"""

import json
import ipaddress
from typing import List, Dict, Any

import pulumi
import pulumi_aws as aws

config = pulumi.Config()
project_name = "prod-web-app"
domain_name = config.get("domain_name")
environment = config.get("environment") or "prod"
aws_region = config.get("aws:region") or "us-east-1"

common_tags = {
  "Environment": environment,
  "Project": project_name,
  "ManagedBy": "Pulumi",
  "Owner": "DevOps Team"
}


def create_vpc_and_networking() -> Dict[str, Any]:
  """
  Creates a VPC with public/private subnets and a NAT Gateway.
  """
  vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    assign_generated_ipv6_cidr_block=True,
    tags={**common_tags, "Name": f"{project_name}-vpc"}
  )

  azs = aws.get_availability_zones(state="available").names[:2]

  igw = aws.ec2.InternetGateway(
    f"{project_name}-igw", vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-igw"}
  )

  # Public Subnets for ALB
  public_subnets = []
  for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
      f"{project_name}-public-subnet-{i+1}", vpc_id=vpc.id,
      availability_zone=az, cidr_block=f"10.0.{i+1}.0/24",
      map_public_ip_on_launch=True,
      tags={**common_tags, "Name": f"{project_name}-public-{i+1}"}
    )
    public_subnets.append(subnet)

  public_rt = aws.ec2.RouteTable(
    f"{project_name}-public-rt", vpc_id=vpc.id,
    routes=[aws.ec2.RouteTableRouteArgs(
      cidr_block="0.0.0.0/0", gateway_id=igw.id
    )],
    tags={**common_tags, "Name": f"{project_name}-public-rt"}
  )

  for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"{project_name}-public-rta-{i+1}",
      subnet_id=subnet.id, route_table_id=public_rt.id
    )

  # Private Subnets for EC2 Instances with NAT Gateway
  eip = aws.ec2.Eip(f"{project_name}-nat-eip", tags=common_tags)
  nat_gw = aws.ec2.NatGateway(
    f"{project_name}-nat-gw",
    subnet_id=public_subnets[0].id,
    allocation_id=eip.id,
    tags={**common_tags, "Name": f"{project_name}-nat-gw"},
    opts=pulumi.ResourceOptions(depends_on=[igw])
  )

  private_subnets = []
  for i, az in enumerate(azs):
    subnet = aws.ec2.Subnet(
      f"{project_name}-private-subnet-{i+1}", vpc_id=vpc.id,
      availability_zone=az, cidr_block=f"10.0.{100+i+1}.0/24",
      ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
          lambda cidr: str(list(ipaddress.IPv6Network(cidr).subnets(new_prefix=64))[i])),
      assign_ipv6_address_on_creation=True,
      tags={**common_tags, "Name": f"{project_name}-private-{i+1}"}
    )
    private_subnets.append(subnet)

  private_rt = aws.ec2.RouteTable(
    f"{project_name}-private-rt", vpc_id=vpc.id,
    routes=[aws.ec2.RouteTableRouteArgs(
      cidr_block="0.0.0.0/0", nat_gateway_id=nat_gw.id
    )],
    tags={**common_tags, "Name": f"{project_name}-private-rt"}
  )

  for i, subnet in enumerate(private_subnets):
    aws.ec2.RouteTableAssociation(
      f"{project_name}-private-rta-{i+1}",
      subnet_id=subnet.id, route_table_id=private_rt.id
    )

  return {
    "vpc": vpc,
    "public_subnets": public_subnets,
    "private_subnets": private_subnets
  }


def create_security_groups(
    vpc_id: pulumi.Output[str]
) -> Dict[str, aws.ec2.SecurityGroup]:
  """
  Creates security groups for ALB and EC2 with proper references.
  """
  alb_sg = aws.ec2.SecurityGroup(
    f"{project_name}-alb-sg", vpc_id=vpc_id,
    description="Controls access to the ALB",
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp", from_port=80, to_port=80,
        cidr_blocks=["0.0.0.0/0"], ipv6_cidr_blocks=["::/0"]
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1", from_port=0, to_port=0,
        cidr_blocks=["0.0.0.0/0"], ipv6_cidr_blocks=["::/0"]
      )
    ],
    tags={**common_tags, "Name": f"{project_name}-alb-sg"}
  )

  ec2_sg = aws.ec2.SecurityGroup(
    f"{project_name}-ec2-sg", vpc_id=vpc_id,
    description="Controls access to the EC2 instances",
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp", from_port=80, to_port=80,
        security_groups=[alb_sg.id], # BEST PRACTICE: Reference ALB SG
        description="Allow HTTP from ALB"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1", from_port=0, to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        description="Allow all outbound traffic for updates"
      )
    ],
    tags={**common_tags, "Name": f"{project_name}-ec2-sg"}
  )
  return {"alb_sg": alb_sg, "ec2_sg": ec2_sg}


def create_iam_role() -> aws.iam.InstanceProfile:
  """
  Creates an IAM role and instance profile for EC2 instances.
  """
  trust_policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  })
  ec2_role = aws.iam.Role(
    f"{project_name}-ec2-role",
    assume_role_policy=trust_policy,
    tags=common_tags
  )
  aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )
  return aws.iam.InstanceProfile(
    f"{project_name}-ec2-profile",
    role=ec2_role.name,
    tags=common_tags
  )


def create_compute_layer(
    private_subnets: List[aws.ec2.Subnet],
    ec2_sg: aws.ec2.SecurityGroup,
    instance_profile: aws.iam.InstanceProfile,
    target_group: aws.lb.TargetGroup
):
  """
  Creates a Launch Template and an Auto Scaling Group for EC2 instances.
  """
  ami = aws.ec2.get_ami(
    most_recent=True, owners=["amazon"],
    filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}]
  )

  user_data = """#!/bin/bash
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
"""

  launch_template = aws.ec2.LaunchTemplate(
    f"{project_name}-lt",
    image_id=ami.id,
    instance_type="t3.micro",
    vpc_security_group_ids=[ec2_sg.id],
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
      arn=instance_profile.arn
    ),
    user_data=pulumi.Output.secret(user_data).apply(
      lambda ud: ud.encode('utf-8').decode('ascii')
    ),
    tags=common_tags
  )

  aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[subnet.id for subnet in private_subnets],
    desired_capacity=2,
    min_size=2,
    max_size=3,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
      id=launch_template.id,
      version="$Latest"
    ),
    target_group_arns=[target_group.arn],
    tags=[aws.autoscaling.GroupTagArgs(
        key=k, value=v, propagate_at_launch=True
    ) for k, v in common_tags.items()]
  )


def create_load_balancer(
    vpc_id: pulumi.Output[str],
    public_subnets: List[aws.ec2.Subnet],
    alb_sg: aws.ec2.SecurityGroup
) -> Dict[str, Any]:
  """
  Creates an ALB and a Target Group.
  """
  alb = aws.lb.LoadBalancer(
    f"{project_name}-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_sg.id],
    subnets=[subnet.id for subnet in public_subnets],
    ip_address_type="dualstack",
    tags={**common_tags, "Name": f"{project_name}-alb"}
  )

  target_group = aws.lb.TargetGroup(
    f"{project_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc_id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
      path="/", healthy_threshold=2, unhealthy_threshold=2, timeout=5, interval=30
    ),
    tags={**common_tags, "Name": f"{project_name}-tg"}
  )

  listener = aws.lb.Listener(
    f"{project_name}-listener",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[aws.lb.ListenerDefaultActionArgs(
      type="forward",
      target_group_arn=target_group.arn
    )]
  )

  return {"alb": alb, "target_group": target_group, "listener": listener}


def create_route53_records(alb: aws.lb.LoadBalancer):
  """
  Creates A and AAAA alias records pointing to the ALB.
  """
  if not domain_name:
    pulumi.log.warn("domain_name not set, skipping Route 53 record creation.")
    return

  zone = aws.route53.get_zone(name=domain_name)
  
  aws.route53.Record(
    f"{project_name}-a-record",
    zone_id=zone.zone_id, name=domain_name, type="A",
    aliases=[aws.route53.RecordAliasArgs(
      name=alb.dns_name, zone_id=alb.zone_id, evaluate_target_health=True
    )]
  )
  
  aws.route53.Record(
    f"{project_name}-aaaa-record",
    zone_id=zone.zone_id, name=domain_name, type="AAAA",
    aliases=[aws.route53.RecordAliasArgs(
      name=alb.dns_name, zone_id=alb.zone_id, evaluate_target_health=True
    )]
  )


def main():
  """Main function to provision the infrastructure."""
  network = create_vpc_and_networking()
  security_groups = create_security_groups(network["vpc"].id)
  instance_profile = create_iam_role()
  
  load_balancer = create_load_balancer(
    network["vpc"].id,
    network["public_subnets"],
    security_groups["alb_sg"]
  )
  
  create_compute_layer(
    network["private_subnets"],
    security_groups["ec2_sg"],
    instance_profile,
    load_balancer["target_group"]
  )
  
  create_route53_records(load_balancer["alb"])

  pulumi.export("alb_dns_name", load_balancer["alb"].dns_name)
  pulumi.export("vpc_id", network["vpc"].id)

if __name__ == "__main__":
  main()