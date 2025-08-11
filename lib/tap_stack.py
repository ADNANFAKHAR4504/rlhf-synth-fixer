import json
from base64 import b64encode

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export
from pulumi_aws.ec2 import get_ami

config = Config()
region = config.get("region") or "us-west-2"
domain_name = config.get_secret("domainName")

aws_provider = aws.Provider("aws", region=region)

vpc = aws.ec2.Vpc(
    "web-vpc",
    cidr_block="10.0.0.0/16",
    assign_generated_ipv6_cidr_block=True,
    enable_dns_support=True,
    enable_dns_hostnames=True,
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

subnet1 = aws.ec2.Subnet(
    "public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    ipv6_cidr_block=Output.concat(vpc.ipv6_cidr_block, "1::/64"),
    assign_ipv6_address_on_creation=True,
    availability_zone=f"{region}a",
    tags={"Name": "public-subnet-1"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

subnet2 = aws.ec2.Subnet(
    "public-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    ipv6_cidr_block=Output.concat(vpc.ipv6_cidr_block, "2::/64"),
    assign_ipv6_address_on_creation=True,
    availability_zone=f"{region}b",
    tags={"Name": "public-subnet-2"},
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

route_table_assoc1 = aws.ec2.RouteTableAssociation(
    "route-table-assoc-1",
    subnet_id=subnet1.id,
    route_table_id=public_route_table.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

route_table_assoc2 = aws.ec2.RouteTableAssociation(
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

cloudwatch_policy = aws.iam.RolePolicyAttachment(
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

ami = get_ami(
    most_recent=True,
    filters=[
        {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
        {"name": "owner-alias", "values": ["amazon"]}
    ],
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

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
    opts=pulumi.ResourceOptions(provider=aws_provider)
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

ec2_sg_ingress = aws.ec2.SecurityGroupRule(
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
    ami=ami.id,
    subnet_id=subnet1.id,
    associate_public_ip_address=True,
    ipv6_address_count=1,
    security_groups=[ec2_sg.id],
    iam_instance_profile=instance_profile.name,
    user_data=b64encode(user_data.encode()).decode(),
    monitoring=True,
    tags={"Name": "web-instance"},
    opts=pulumi.ResourceOptions(provider=aws_provider, depends_on=[ec2_sg_ingress])
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
    opts=pulumi.ResourceOptions(provider=aws_provider)
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

target_group_attachment = aws.lb.TargetGroupAttachment(
    "web-tg-attachment",
    target_group_arn=target_group.arn,
    target_id=ec2_instance.id,
    port=80,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

listener = aws.lb.Listener(
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

website_url = alb.dns_name
if domain_name:
    hosted_zone = aws.route53.get_zone(name=domain_name)
    record_a = aws.route53.Record(
        "web-a-record",
        zone_id=hosted_zone.zone_id,
        name=domain_name,
        type="A",
        aliases=[
            aws.route53.RecordAliasArgs(
                name=alb.dns_name,
                zone_id=alb.zone_id,
                evaluate_target_health=True
            )
        ],
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )
    record_aaaa = aws.route53.Record(
        "web-aaaa-record",
        zone_id=hosted_zone.zone_id,
        name=domain_name,
        type="AAAA",
        aliases=[
            aws.route53.RecordAliasArgs(
                name=alb.dns_name,
                zone_id=alb.zone_id,
                evaluate_target_health=True
            )
        ],
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )
    website_url = Output.concat("http://", domain_name)

export("alb_dns_name", alb.dns_name)
export("website_url", website_url)
export("ec2_public_ip", ec2_instance.public_ip)
export("ec2_ipv6", ec2_instance.ipv6_addresses[0])