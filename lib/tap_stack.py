"""
AWS Dual-Stack Infrastructure with Pulumi
=========================================

This module provisions a highly available, dual-stack (IPv4/IPv6) AWS infrastructure
including VPC, EC2 instances, Application Load Balancer, Route53 DNS records,
security groups, IAM roles, and CloudWatch monitoring.

Author: Senior DevOps Engineer
"""

import json
from typing import List, Dict, Any
import pulumi
import pulumi_aws as aws

# Explicitly configure the AWS provider to use us-east-1
aws.Provider("aws-provider", region="us-east-1")

# Configuration
config = pulumi.Config()
domain_name = config.require("domain_name")
environment = config.get("environment") or "dev"
project_name = config.get("project_name") or "dualstack-web-app"
aws_region = config.get("aws:region") or "us-east-1"

# Tags for all resources
common_tags = {
  "Environment": environment,
  "Project": project_name,
  "ManagedBy": "Pulumi",
  "Owner": "DevOps Team"
}

def create_vpc_and_networking() -> Dict[str, Any]:
  """
  Create VPC with dual-stack networking configuration.
  Returns:
      Dict containing VPC, subnets, IGW, and route tables
  """
  vpc = aws.ec2.Vpc(
    f"{project_name}-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    assign_generated_ipv6_cidr_block=True,
    tags={**common_tags, "Name": f"{project_name}-vpc"}
  )
  azs = aws.get_availability_zones(state="available")
  igw = aws.ec2.InternetGateway(
    f"{project_name}-igw",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-igw"}
  )
  public_subnets = []
  def make_ipv6_cidr(cidr, idx):
    if cidr:
      return f"{cidr[:-2]}{idx+1}:/64"
    return None
  for idx, az in enumerate(azs.names[:2]):
    subnet = aws.ec2.Subnet(
      f"{project_name}-public-subnet-{idx+1}",
      vpc_id=vpc.id,
      availability_zone=az,
      cidr_block=f"10.0.{idx+1}.0/24",
      ipv6_cidr_block=vpc.ipv6_cidr_block.apply(lambda cidr, i=idx: make_ipv6_cidr(cidr, i)),
      map_public_ip_on_launch=True,
      assign_ipv6_address_on_creation=True,
      tags={
        **common_tags,
        "Name": f"{project_name}-public-subnet-{idx+1}",
        "Type": "Public"
      }
    )
    public_subnets.append(subnet)
  public_route_table = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"{project_name}-public-rt"}
  )
  aws.ec2.Route(
    f"{project_name}-public-route-ipv4",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
  )
  aws.ec2.Route(
    f"{project_name}-public-route-ipv6",
    route_table_id=public_route_table.id,
    destination_ipv6_cidr_block="::/0",
    gateway_id=igw.id
  )
  for idx, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
      f"{project_name}-public-rta-{idx+1}",
      subnet_id=subnet.id,
      route_table_id=public_route_table.id
    )
  return {
    "vpc": vpc,
    "public_subnets": public_subnets,
    "igw": igw,
    "public_route_table": public_route_table
  }

def create_security_groups(vpc_id: pulumi.Output[str]) -> Dict[str, aws.ec2.SecurityGroup]:
  """
  Create security groups for ALB and EC2 instances.
  Args:
      vpc_id: VPC ID where security groups will be created
  Returns:
      Dict containing ALB and EC2 security groups
  """
  alb_sg = aws.ec2.SecurityGroup(
    f"{project_name}-alb-sg",
    name=f"{project_name}-alb-sg",
    description="Security group for Application Load Balancer",
    vpc_id=vpc_id,
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=80,
        to_port=80,
        cidr_blocks=["0.0.0.0/0"],
        description="HTTP from internet (IPv4)"
      ),
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=80,
        to_port=80,
        ipv6_cidr_blocks=["::/0"],
        description="HTTP from internet (IPv6)"
      ),
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=443,
        to_port=443,
        cidr_blocks=["0.0.0.0/0"],
        description="HTTPS from internet (IPv4)"
      ),
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=443,
        to_port=443,
        ipv6_cidr_blocks=["::/0"],
        description="HTTPS from internet (IPv6)"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        description="All outbound traffic (IPv4)"
      ),
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        ipv6_cidr_blocks=["::/0"],
        description="All outbound traffic (IPv6)"
      )
    ],
    tags={**common_tags, "Name": f"{project_name}-alb-sg"}
  )
  ec2_sg = aws.ec2.SecurityGroup(
    f"{project_name}-ec2-sg",
    name=f"{project_name}-ec2-sg",
    description="Security group for EC2 instances",
    vpc_id=vpc_id,
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=80,
        to_port=80,
        security_groups=[alb_sg.id],
        description="HTTP from ALB"
      ),
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=22,
        to_port=22,
        cidr_blocks=["0.0.0.0/0"],
        description="SSH access"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        description="All outbound traffic (IPv4)"
      ),
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        ipv6_cidr_blocks=["::/0"],
        description="All outbound traffic (IPv6)"
      )
    ],
    tags={**common_tags, "Name": f"{project_name}-ec2-sg"}
  )
  return {
    "alb_sg": alb_sg,
    "ec2_sg": ec2_sg
  }

def create_iam_role() -> aws.iam.Role:
  """
  Create IAM role for EC2 instances with least privilege.
  Returns:
      IAM role for EC2 instances
  """
  trust_policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }
  ec2_role = aws.iam.Role(
    f"{project_name}-ec2-role",
    assume_role_policy=json.dumps(trust_policy),
    description="IAM role for EC2 instances with minimal permissions",
    tags=common_tags
  )
  aws.iam.RolePolicyAttachment(
    f"{project_name}-ec2-cloudwatch-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  )
  instance_profile = aws.iam.InstanceProfile(
    f"{project_name}-ec2-profile",
    role=ec2_role.name,
    tags=common_tags
  )
  return ec2_role, instance_profile

def create_ec2_instances(
  subnets: List[aws.ec2.Subnet],
  security_group: aws.ec2.SecurityGroup,
  instance_profile: aws.iam.InstanceProfile
) -> List[aws.ec2.Instance]:
  """
  Create EC2 instances with Nginx web server.
  Args:
      subnets: List of subnets to deploy instances
      security_group: Security group for instances
      instance_profile: IAM instance profile
  Returns:
      List of EC2 instances
  """
  ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
      aws.ec2.GetAmiFilterArgs(
        name="name",
        values=["amzn2-ami-hvm-*-x86_64-gp2"]
      ),
      aws.ec2.GetAmiFilterArgs(
        name="virtualization-type",
        values=["hvm"]
      )
    ]
  )
  user_data = """#!/bin/bash
yum update -y
yum install -y nginx
systemctl start nginx
systemctl enable nginx

cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Dual-Stack Web Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Dual-Stack Web Application</h1>
        <div class="status">
            <h2>Server Status: ✅ Online</h2>
            <p><strong>Environment:</strong> ${environment}</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>IPv4 Address:</strong> $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)</p>
            <p><strong>IPv6 Address:</strong> $(curl -s http://169.254.169.254/latest/meta-data/ipv6)</p>
        </div>
        <h3>Network Configuration</h3>
        <ul>
            <li>✅ IPv4 and IPv6 dual-stack enabled</li>
            <li>✅ Application Load Balancer configured</li>
            <li>✅ Route53 DNS records configured</li>
            <li>✅ CloudWatch monitoring enabled</li>
        </ul>
    </div>
</body>
</html>
EOF

yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
"""
  instances = []
  for idx, subnet in enumerate(subnets):
    instance = aws.ec2.Instance(
      f"{project_name}-web-{idx+1}",
      ami=ami.id,
      instance_type="t3.micro",
      subnet_id=subnet.id,
      vpc_security_group_ids=[security_group.id],
      iam_instance_profile=instance_profile.name,
      user_data=user_data,
      monitoring=True,
      ipv6_address_count=1,
      tags={
        **common_tags,
        "Name": f"{project_name}-web-{idx+1}",
        "Role": "WebServer"
      }
    )
    instances.append(instance)
  return instances

def create_load_balancer(
  subnets: List[aws.ec2.Subnet],
  security_group: aws.ec2.SecurityGroup,
  instances: List[aws.ec2.Instance],
  vpc_id: pulumi.Output[str]
) -> Dict[str, Any]:
  """
  Create Application Load Balancer with dual-stack configuration.
  Args:
      subnets: List of subnets for ALB
      security_group: Security group for ALB
      instances: List of EC2 instances for target group
      vpc_id: VPC ID
  Returns:
      Dict containing ALB and target group
  """
  alb = aws.lb.LoadBalancer(
    f"{project_name}-alb",
    name=f"{project_name}-alb",
    load_balancer_type="application",
    scheme="internet-facing",
    ip_address_type="dualstack",
    security_groups=[security_group.id],
    subnets=[subnet.id for subnet in subnets],
    enable_deletion_protection=False,
    tags={**common_tags, "Name": f"{project_name}-alb"}
  )
  target_group = aws.lb.TargetGroup(
    f"{project_name}-tg",
    name=f"{project_name}-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc_id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
      enabled=True,
      healthy_threshold=2,
      unhealthy_threshold=2,
      timeout=5,
      interval=30,
      path="/",
      matcher="200",
      protocol="HTTP",
      port="traffic-port"
    ),
    tags={**common_tags, "Name": f"{project_name}-tg"}
  )
  for idx, instance in enumerate(instances):
    aws.lb.TargetGroupAttachment(
      f"{project_name}-tg-attachment-{idx+1}",
      target_group_arn=target_group.arn,
      target_id=instance.id,
      port=80
    )
  listener = aws.lb.Listener(
    f"{project_name}-listener",
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[
      aws.lb.ListenerDefaultActionArgs(
        type="forward",
        target_group_arn=target_group.arn
      )
    ]
  )
  return {
    "alb": alb,
    "target_group": target_group,
    "listener": listener
  }

def create_route53_records(alb: aws.lb.LoadBalancer) -> Dict[str, aws.route53.Record]:
  """
  Create Route53 DNS records for the domain.
  Args:
      alb: Application Load Balancer
  Returns:
      Dict containing A and AAAA records
  """
  hosted_zone = aws.route53.get_zone(name=domain_name)
  a_record = aws.route53.Record(
    f"{project_name}-a-record",
    zone_id=hosted_zone.zone_id,
    name=domain_name,
    type="A",
    aliases=[
      aws.route53.RecordAliasArgs(
        name=alb.dns_name,
        zone_id=alb.zone_id,
        evaluate_target_health=True
      )
    ]
  )
  aaaa_record = aws.route53.Record(
    f"{project_name}-aaaa-record",
    zone_id=hosted_zone.zone_id,
    name=domain_name,
    type="AAAA",
    aliases=[
      aws.route53.RecordAliasArgs(
        name=alb.dns_name,
        zone_id=alb.zone_id,
        evaluate_target_health=True
      )
    ]
  )
  return {
    "a_record": a_record,
    "aaaa_record": aaaa_record
  }

def create_cloudwatch_dashboard(alb: aws.lb.LoadBalancer, instances: List[aws.ec2.Instance]) -> aws.cloudwatch.Dashboard:
  """
  Create CloudWatch dashboard for monitoring.
  Args:
      alb: Application Load Balancer
      instances: List of EC2 instances
  Returns:
      CloudWatch dashboard
  """
  dashboard_body = {
    "widgets": [
      {
        "type": "metric",
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", alb.arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ],
          "view": "timeSeries",
          "stacked": False,
          "region": aws_region,
          "title": "ALB Request Metrics",
          "period": 300
        }
      },
      {
        "type": "metric",
        "x": 12,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup",
             pulumi.Output.concat(alb.arn_suffix, "/", "targetgroup/", project_name, "-tg/", "123456789")],
            [".", "UnHealthyHostCount", ".", "."]
          ],
          "view": "timeSeries",
          "stacked": False,
          "region": aws_region,
          "title": "Target Health",
          "period": 300
        }
      },
      {
        "type": "metric",
        "x": 0,
        "y": 6,
        "width": 24,
        "height": 6,
        "properties": {
          "metrics": (
            [["AWS/EC2", "CPUUtilization", "InstanceId", instance.id] for instance in instances] +
            [[".", "NetworkIn", ".", instance.id] for instance in instances] +
            [[".", "NetworkOut", ".", instance.id] for instance in instances]
          ),
          "view": "timeSeries",
          "stacked": False,
          "region": aws_region,
          "title": "EC2 Instance Metrics",
          "period": 300
        }
      }
    ]
  }
  dashboard = aws.cloudwatch.Dashboard(
    f"{project_name}-dashboard",
    dashboard_name=f"{project_name}-monitoring",
    dashboard_body=pulumi.Output.json_dumps(dashboard_body)
  )
  return dashboard

def main():
  """Main function to provision the infrastructure."""
  network = create_vpc_and_networking()
  security_groups = create_security_groups(network["vpc"].id)
  _, instance_profile = create_iam_role()
  instances = create_ec2_instances(
    network["public_subnets"],
    security_groups["ec2_sg"],
    instance_profile
  )
  load_balancer = create_load_balancer(
    network["public_subnets"],
    security_groups["alb_sg"],
    instances,
    network["vpc"].id
  )
  create_route53_records(load_balancer["alb"])
  dashboard = create_cloudwatch_dashboard(load_balancer["alb"], instances)
  pulumi.export("vpc_id", network["vpc"].id)
  pulumi.export("vpc_ipv6_cidr", network["vpc"].ipv6_cidr_block)
  pulumi.export("public_subnet_ids", [subnet.id for subnet in network["public_subnets"]])
  pulumi.export("alb_dns_name", load_balancer["alb"].dns_name)
  pulumi.export("alb_zone_id", load_balancer["alb"].zone_id)
  pulumi.export("alb_arn", load_balancer["alb"].arn)
  pulumi.export("target_group_arn", load_balancer["target_group"].arn)
  pulumi.export("instance_ids", [instance.id for instance in instances])
  pulumi.export("instance_public_ips", [instance.public_ip for instance in instances])
  pulumi.export("instance_ipv6_addresses", [instance.ipv6_addresses for instance in instances])
  pulumi.export("domain_name", domain_name)
  pulumi.export("website_url_ipv4", f"http://{domain_name}")
  pulumi.export("website_url_ipv6", f"http://[{domain_name}]")
  pulumi.export("dashboard_url", dashboard.dashboard_name.apply(
    lambda name: f"https://{aws_region}.console.aws.amazon.com/cloudwatch/home?region={aws_region}#dashboards:name={name}"
  ))

if __name__ == "__main__":
  main()