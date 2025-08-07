"""
AWS Dual-Stack Infrastructure with Pulumi
=========================================

This module provisions a highly available, scalable, and secure dual-stack
AWS infrastructure using an Auto Scaling Group in public subnets. This version
is designed to be resilient against orphaned resources in the AWS account.
"""
import base64
import json
import ipaddress
from typing import List, Dict, Any

import pulumi
import pulumi_aws as aws
import pulumi_random as random

config = pulumi.Config()
project_name = "prod-web-app-final"
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
  Creates a dual-stack VPC with public subnets.
  """
  vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block="10.0.0.0/16",
    assign_generated_ipv6_cidr_block=True,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"{project_name}-vpc"}
  )

  random_subnet_offset = random.RandomInteger(
    "subnet-offset",
    min=100,
    max=250,
    keepers={"project_name": project_name}
  )

  azs = aws.get_availability_zones(state="available").names[:2]

  igw = aws.ec2.InternetGateway(
    f"{project_name}-igw", vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-igw"}
  )

  public_subnets = []
  for i, az in enumerate(azs):
    resource_opts = None
    if i > 0:
      resource_opts = pulumi.ResourceOptions(depends_on=[public_subnets[i-1]])

    combined_args = pulumi.Output.all(vpc.ipv6_cidr_block, random_subnet_offset.result)

    subnet = aws.ec2.Subnet(
      f"{project_name}-public-subnet-{i+1}",
      vpc_id=vpc.id,
      availability_zone=az,
      cidr_block=f"10.0.{i+1}.0/24",
      ipv6_cidr_block=combined_args.apply(
          lambda args, index=i: str(
              list(ipaddress.IPv6Network(
                  args[0]).subnets(new_prefix=64))[args[1] + index]
          )
      ),
      assign_ipv6_address_on_creation=True,
      map_public_ip_on_launch=True,
      tags={**common_tags, "Name": f"{project_name}-public-{i+1}"},
      opts=resource_opts
    )
    public_subnets.append(subnet)

  public_rt = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=igw.id),
        aws.ec2.RouteTableRouteArgs(ipv6_cidr_block="::/0", gateway_id=igw.id)
    ],
    tags={**common_tags, "Name": f"{project_name}-public-rt"}
  )

  for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"{project_name}-public-rta-{i+1}",
      subnet_id=subnet.id,
      route_table_id=public_rt.id
    )

  return {
    "vpc": vpc,
    "public_subnets": public_subnets,
  }


def create_security_groups(
    vpc_id: pulumi.Output[str]
) -> Dict[str, aws.ec2.SecurityGroup]:
  """
  Creates security groups for ALB and EC2 with explicit, separate rules.
  """
  alb_sg = aws.ec2.SecurityGroup(
    f"{project_name}-alb-sg",
    vpc_id=vpc_id,
    description="Controls access to the ALB",
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp", from_port=80, to_port=80,
        cidr_blocks=["0.0.0.0/0"],
        description="Allow HTTP from IPv4"
      ),
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp", from_port=80, to_port=80,
        ipv6_cidr_blocks=["::/0"],
        description="Allow HTTP from IPv6"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1", from_port=0, to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        description="Allow all outbound IPv4"
      ),
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1", from_port=0, to_port=0,
        ipv6_cidr_blocks=["::/0"],
        description="Allow all outbound IPv6"
      )
    ],
    tags={**common_tags, "Name": f"{project_name}-alb-sg"}
  )

  ec2_sg = aws.ec2.SecurityGroup(
    f"{project_name}-ec2-sg",
    vpc_id=vpc_id,
    description="Controls access to the EC2 instances",
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp", from_port=80, to_port=80,
        security_groups=[alb_sg.id],
        description="Allow HTTP from ALB"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1", from_port=0, to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        ipv6_cidr_blocks=["::/0"],
        description="Allow all outbound traffic"
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
    "Statement": [{"Effect": "Allow", "Principal": {"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"}]
  })
  ec2_role = aws.iam.Role(f"{project_name}-ec2-role", assume_role_policy=trust_policy, tags=common_tags)
  aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )
  return aws.iam.InstanceProfile(f"{project_name}-ec2-profile", role=ec2_role.name, tags=common_tags)


def create_compute_layer(
    public_subnets: List[aws.ec2.Subnet],
    ec2_sg: aws.ec2.SecurityGroup,
    instance_profile: aws.iam.InstanceProfile,
    target_group: aws.lb.TargetGroup
):
  """
  Creates a Launch Template and an Auto Scaling Group in public subnets.
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
  encoded_user_data = base64.b64encode(
    user_data.encode("ascii")).decode("ascii")

  launch_template = aws.ec2.LaunchTemplate(
    f"{project_name}-lt",
    image_id=ami.id,
    instance_type="t3.micro",
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(arn=instance_profile.arn),
    user_data=encoded_user_data,
    network_interfaces=[aws.ec2.LaunchTemplateNetworkInterfaceArgs(
      associate_public_ip_address=True,
      security_groups=[ec2_sg.id],
      ipv6_address_count=1,
    )],
    tags=common_tags
  )

  aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[subnet.id for subnet in public_subnets],
    desired_capacity=2,
    min_size=2,
    max_size=3,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(id=launch_template.id, version="$Latest"),
    target_group_arns=[target_group.arn],
    tags=[aws.autoscaling.GroupTagArgs(key=k, value=v, propagate_at_launch=True) for k, v in common_tags.items()]
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
    ip_address_type="dualstack",
    security_groups=[alb_sg.id],
    subnets=[subnet.id for subnet in public_subnets],
    tags={**common_tags, "Name": f"{project_name}-alb"}
  )

  target_group = aws.lb.TargetGroup(
    f"{project_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc_id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        path="/", healthy_threshold=2,
        unhealthy_threshold=3, timeout=15, interval=30
    ),
    tags={**common_tags, "Name": f"{project_name}-tg"}
  )

  listener = aws.lb.Listener(
    f"{project_name}-listener",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[aws.lb.ListenerDefaultActionArgs(type="forward", target_group_arn=target_group.arn)]
  )

  return {"alb": alb, "target_group": target_group}


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
    network["public_subnets"],
    security_groups["ec2_sg"],
    instance_profile,
    load_balancer["target_group"]
  )
  
  pulumi.export("alb_dns_name", load_balancer["alb"].dns_name)
  pulumi.export("vpc_id", network["vpc"].id)
  pulumi.export("target_group_arn", load_balancer["target_group"].arn)


if __name__ == "__main__":
  main()