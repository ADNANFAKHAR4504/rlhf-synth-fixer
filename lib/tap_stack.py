"""
Pulumi infrastructure as code for dual-stack web application.
Creates VPC, subnets, ALB, EC2 instance, and CloudWatch dashboard.
"""

import json
import ipaddress
from base64 import b64encode

try:
  import pulumi
  import pulumi_aws as aws
  from pulumi import Config, Output, export
  from pulumi_aws.ec2 import get_ami
except ImportError:
  pass

def create_infrastructure():
  """Create the entire AWS infrastructure stack."""
  config = Config()
  region = config.get("region") or "us-east-1"

  aws_provider = aws.Provider("aws", region=region)

  # Pick two available AZs dynamically for this account/region
  azs = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=aws_provider)
  )

  vpc = aws.ec2.Vpc(
    "web-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_support=True,
    enable_dns_hostnames=True,
    assign_generated_ipv6_cidr_block=True,
    tags={"Name": "web-vpc"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  igw = aws.ec2.InternetGateway(
    "web-igw",
    vpc_id=vpc.id,
    tags={"Name": "web-igw"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  public_route_table = aws.ec2.RouteTable(
    "public-route-table",
    vpc_id=vpc.id,
    routes=[
      aws.ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        gateway_id=igw.id
      ),
      aws.ec2.RouteTableRouteArgs(
        ipv6_cidr_block="::/0",
        gateway_id=igw.id
      )
    ],
    tags={"Name": "public-route-table"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  # Compute two /64 IPv6 subnets from the VPC's /56 IPv6 block
  subnet1_ipv6 = vpc.ipv6_cidr_block.apply(
    lambda cidr: str(list(ipaddress.ip_network(cidr).subnets(new_prefix=64))[0])
  )
  subnet2_ipv6 = vpc.ipv6_cidr_block.apply(
    lambda cidr: str(list(ipaddress.ip_network(cidr).subnets(new_prefix=64))[1])
  )

  subnet1 = aws.ec2.Subnet(
    "public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.101.0/24",
    ipv6_cidr_block=subnet1_ipv6,
    assign_ipv6_address_on_creation=True,
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={"Name": "public-subnet-1"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  subnet2 = aws.ec2.Subnet(
    "public-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.102.0/24",
    ipv6_cidr_block=subnet2_ipv6,
    assign_ipv6_address_on_creation=True,
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={"Name": "public-subnet-2"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  rta1 = aws.ec2.RouteTableAssociation(
    "route-table-assoc-1",
    subnet_id=subnet1.id,
    route_table_id=public_route_table.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  rta2 = aws.ec2.RouteTableAssociation(
    "route-table-assoc-2",
    subnet_id=subnet2.id,
    route_table_id=public_route_table.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  ec2_role = aws.iam.Role(
    "ec2-role",
    assume_role_policy=json.dumps({
      "Version": "2012-10-17",
      "Statement": [{
        "Action": "sts:AssumeRole",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Effect": "Allow"
      }]
    }),
    tags={"Name": "ec2-role"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  aws.iam.RolePolicyAttachment(
    "cloudwatch-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    role=ec2_role.name,
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  try:
    ami = get_ami(
      most_recent=True,
      filters=[
        {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
        {"name": "owner-alias", "values": ["amazon"]}
      ],
      owners=["137112412989"],
      opts=pulumi.InvokeOptions(provider=aws_provider)
    )
    ami_id = ami.id
  except Exception:
    ami_id = "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI for us-east-1

  user_data = """#!/bin/bash
yum update -y
amazon-linux-extras install nginx1 -y
systemctl enable nginx
systemctl start nginx
echo '<h1>Hello from Nginx on AWS!</h1>' > /usr/share/nginx/html/index.html
"""

  ec2_sg = aws.ec2.SecurityGroup(
    "ec2-sg",
    vpc_id=vpc.id,
    description="Allow HTTP from ALB",
    ingress=[],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
  cidr_blocks=["0.0.0.0/0"],
  ipv6_cidr_blocks=["::/0"]
      )
    ],
    tags={"Name": "ec2-sg"},
  opts=pulumi.ResourceOptions(provider=aws_provider, ignore_changes=["egress"])
  )

  alb_sg = aws.ec2.SecurityGroup(
    "alb-sg",
    vpc_id=vpc.id,
    description="Allow HTTP from anywhere",
    ingress=[
      aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=80,
        to_port=80,
        cidr_blocks=["0.0.0.0/0"],
        ipv6_cidr_blocks=["::/0"],
        description="Allow HTTP from anywhere"
      )
    ],
    egress=[
      aws.ec2.SecurityGroupEgressArgs(
        protocol="tcp",
        from_port=80,
        to_port=80,
        security_groups=[ec2_sg.id],
        description="Allow HTTP to EC2"
      )
    ],
    tags={"Name": "alb-sg"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  aws.ec2.SecurityGroupRule(
    "ec2-sg-ingress",
    type="ingress",
    protocol="tcp",
    from_port=80,
    to_port=80,
    source_security_group_id=alb_sg.id,
    security_group_id=ec2_sg.id,
    description="Allow HTTP from ALB",
    opts=pulumi.ResourceOptions(provider=aws_provider, depends_on=[alb_sg])
  )

  ec2_instance = aws.ec2.Instance(
    "web-instance",
    instance_type="t3.micro",
    ami=ami_id,
    subnet_id=subnet1.id,
    associate_public_ip_address=True,
    ipv6_address_count=1,
  vpc_security_group_ids=[ec2_sg.id],
    iam_instance_profile=instance_profile.name,
    user_data=user_data,
    monitoring=True,
    tags={"Name": "web-instance"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  alb = aws.lb.LoadBalancer(
    "web-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_sg.id],
    subnets=[subnet1.id, subnet2.id],
    ip_address_type="dualstack",
    enable_deletion_protection=False,
    tags={"Name": "web-alb"},
    opts=pulumi.ResourceOptions(provider=aws_provider, depends_on=[rta1, rta2])
  )

  target_group = aws.lb.TargetGroup(
    "web-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
      path="/",
      protocol="HTTP",
      matcher="200",
      interval=30,
      timeout=5,
      healthy_threshold=5,
      unhealthy_threshold=2
    ),
    tags={"Name": "web-tg"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  aws.lb.TargetGroupAttachment(
    "web-tg-attachment",
    target_group_arn=target_group.arn,
    target_id=ec2_instance.id,
    port=80,
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  aws.lb.Listener(
    "web-listener",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
      aws.lb.ListenerDefaultActionArgs(
        type="forward",
        target_group_arn=target_group.arn
      )
    ],
    tags={"Name": "web-listener"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  dashboard_body = Output.all(alb.arn, target_group.arn).apply(
    lambda args: json.dumps({
      "widgets": [
        {
          "type": "metric",
          "x": 0,
          "y": 0,
          "width": 12,
          "height": 6,
          "properties": {
            "metrics": [
              [
                "AWS/ApplicationELB",
                "RequestCount",
                "LoadBalancer",
                args[0].split('/')[-1],
                {"period": 60}
              ],
              [
                "AWS/ApplicationELB",
                "HealthyHostCount",
                "TargetGroup",
                args[1].split('/')[-1]
              ],
              [
                "AWS/ApplicationELB",
                "HTTPCode_ELB_5XX_Count",
                "LoadBalancer",
                args[0].split('/')[-1]
              ]
            ],
            "view": "timeSeries",
            "stacked": False,
            "region": region,
            "title": "ALB Metrics"
          }
        }
      ]
    })
  )

  dashboard = aws.cloudwatch.Dashboard(
    "web-dashboard",
    dashboard_name="WebAppDashboard",
    dashboard_body=dashboard_body,
    opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  # Export outputs
  export("alb_dns_name", alb.dns_name)
  export("website_url", Output.concat("http://", alb.dns_name))
  export("ec2_public_ip", ec2_instance.public_ip)

  # Return resources for testing
  return {
    'vpc': vpc,
    'alb': alb,
    'ec2_instance': ec2_instance,
    'ec2_sg': ec2_sg,
    'alb_sg': alb_sg,
    'dashboard': dashboard
  }

# Execute the infrastructure creation when module is imported
# This allows the module to work both standalone and in tests
if __name__ != "__main__":
  # For imports (including tests), make resources available at module level
  try:
    resources = create_infrastructure()
    vpc = resources['vpc']
    alb = resources['alb']
    ec2_instance = resources['ec2_instance']
    ec2_sg = resources['ec2_sg']
    alb_sg = resources['alb_sg']
    dashboard = resources['dashboard']
  except Exception:  # pylint: disable=broad-except
    # If creation fails (e.g., in test environment), create placeholder variables
    vpc = None
    alb = None
    ec2_instance = None
    ec2_sg = None
    alb_sg = None
    dashboard = None
else:
  # When run directly, create infrastructure normally
  create_infrastructure()
