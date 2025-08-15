import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export
import base64

# Configuration
config = Config()
aws_region = config.get("aws:region") or "us-east-1"

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
        {"name": "state", "values": ["available"]},
    ]
)

# VPC with dual-stack (IPv4 and IPv6) support
vpc = aws.ec2.Vpc(
    "dual-stack-vpc",
    cidr_block="10.0.0.0/16",
    assign_generated_ipv6_cidr_block=True,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": "dual-stack-vpc",
        "Purpose": "Dual-stack web application infrastructure"
    }
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    "dual-stack-igw",
    vpc_id=vpc.id,
    tags={
        "Name": "dual-stack-igw"
    }
)

# Get availability zones
azs = aws.get_availability_zones(state="available")

# Public Subnet 1 (dual-stack)
public_subnet_1 = aws.ec2.Subnet(
    "public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(lambda cidr: f"{cidr[:-2]}01::/64"),
    availability_zone=azs.names[0],
    assign_ipv6_address_on_creation=True,
    map_public_ip_on_launch=True,
    tags={
        "Name": "public-subnet-1",
        "Type": "Public"
    }
)

# Public Subnet 2 (dual-stack)
public_subnet_2 = aws.ec2.Subnet(
    "public-subnet-2",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(lambda cidr: f"{cidr[:-2]}02::/64"),
    availability_zone=azs.names[1],
    assign_ipv6_address_on_creation=True,
    map_public_ip_on_launch=True,
    tags={
        "Name": "public-subnet-2",
        "Type": "Public"
    }
)

# Route Table for public subnets
public_route_table = aws.ec2.RouteTable(
    "public-route-table",
    vpc_id=vpc.id,
    tags={
        "Name": "public-route-table"
    }
)

# IPv4 route to Internet Gateway
ipv4_route = aws.ec2.Route(
    "ipv4-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# IPv6 route to Internet Gateway
ipv6_route = aws.ec2.Route(
    "ipv6-route",
    route_table_id=public_route_table.id,
    destination_ipv6_cidr_block="::/0",
    gateway_id=igw.id
)

# Associate route table with public subnets
public_subnet_1_association = aws.ec2.RouteTableAssociation(
    "public-subnet-1-association",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id
)

public_subnet_2_association = aws.ec2.RouteTableAssociation(
    "public-subnet-2-association",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id
)

# IAM Role for EC2 instance (least privilege)
ec2_role = aws.iam.Role(
    "ec2-role",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                }
            }
        ]
    }""",
    tags={
        "Name": "ec2-role"
    }
)

# IAM Instance Profile
ec2_instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    role=ec2_role.name
)

# Attach CloudWatch monitoring policy to EC2 role
cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
    "ec2-cloudwatch-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
)

# Security Group for ALB (allows HTTP from internet)
alb_security_group = aws.ec2.SecurityGroup(
    "alb-security-group",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP from internet (IPv4)",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP from internet (IPv6)",
            from_port=80,
            to_port=80,
            protocol="tcp",
            ipv6_cidr_blocks=["::/0"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="All outbound traffic (IPv4)",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupEgressArgs(
            description="All outbound traffic (IPv6)",
            from_port=0,
            to_port=0,
            protocol="-1",
            ipv6_cidr_blocks=["::/0"]
        )
    ],
    tags={
        "Name": "alb-security-group"
    }
)

# Security Group for EC2 (allows HTTP only from ALB)
ec2_security_group = aws.ec2.SecurityGroup(
    "ec2-security-group",
    description="Security group for EC2 instances",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP from ALB",
            from_port=80,
            to_port=80,
            protocol="tcp",
            security_groups=[alb_security_group.id]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="All outbound traffic (IPv4)",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupEgressArgs(
            description="All outbound traffic (IPv6)",
            from_port=0,
            to_port=0,
            protocol="-1",
            ipv6_cidr_blocks=["::/0"]
        )
    ],
    tags={
        "Name": "ec2-security-group"
    }
)

# User data script to install and configure Nginx
user_data = """#!/bin/bash
yum update -y
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create a simple test page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Dual-Stack Web Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Dual-Stack Web Application</h1>
        <div class="status">
            <h2>Server Information</h2>
            <p><strong>Server:</strong> Nginx on Amazon Linux 2</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>IPv4 Address:</strong> $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)</p>
            <p><strong>IPv6 Address:</strong> $(curl -s http://169.254.169.254/latest/meta-data/ipv6)</p>
        </div>
        <div class="status">
            <h2>Connection Information</h2>
            <p>This server supports both IPv4 and IPv6 connections.</p>
            <p>Deployed with Pulumi Infrastructure as Code.</p>
        </div>
    </div>
</body>
</html>
EOF

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
"""

# EC2 Instance with dual-stack configuration
ec2_instance = aws.ec2.Instance(
    "web-server",
    instance_type="t3.micro",
    ami=ami.id,
    subnet_id=public_subnet_1.id,
    vpc_security_group_ids=[ec2_security_group.id],
    iam_instance_profile=ec2_instance_profile.name,
    user_data=base64.b64encode(user_data.encode()).decode(),
    associate_public_ip_address=True,
    ipv6_address_count=1,
    monitoring=True,  # Enable detailed monitoring
    tags={
        "Name": "dual-stack-web-server",
        "Purpose": "Web server for dual-stack application"
    }
)

# Application Load Balancer (dual-stack)
alb = aws.lb.LoadBalancer(
    "dual-stack-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_security_group.id],
    subnets=[public_subnet_1.id, public_subnet_2.id],
    ip_address_type="dualstack",
    enable_deletion_protection=False,
    tags={
        "Name": "dual-stack-alb",
        "Purpose": "Load balancer for dual-stack web application"
    }
)

# Target Group for ALB
target_group = aws.lb.TargetGroup(
    "web-target-group",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        interval=30,
        matcher="200",
        path="/",
        port="traffic-port",
        protocol="HTTP",
        timeout=5,
        unhealthy_threshold=2
    ),
    tags={
        "Name": "web-target-group"
    }
)

# Attach EC2 instance to target group
target_group_attachment = aws.lb.TargetGroupAttachment(
    "web-target-attachment",
    target_group_arn=target_group.arn,
    target_id=ec2_instance.id,
    port=80
)

# ALB Listener
alb_listener = aws.lb.Listener(
    "web-listener",
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[aws.lb.ListenerDefaultActionArgs(
        type="forward",
        target_group_arn=target_group.arn
    )]
)

# CloudWatch Dashboard for monitoring
dashboard_body = Output.all(alb.arn_suffix, target_group.arn_suffix).apply(
    lambda args: f"""{{
        "widgets": [
            {{
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {{
                    "metrics": [
                        [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "{args[0]}" ],
                        [ ".", "TargetResponseTime", ".", "." ],
                        [ ".", "HTTPCode_Target_2XX_Count", ".", "." ],
                        [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                        [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "{aws_region}",
                    "title": "ALB Request Metrics",
                    "period": 300
                }}
            }},
            {{
                "type": "metric",
                "x": 0,
                "y": 6,
                "width": 12,
                "height": 6,
                "properties": {{
                    "metrics": [
                        [ "AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", "{args[1]}" ],
                        [ ".", "UnHealthyHostCount", ".", "." ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "{aws_region}",
                    "title": "Target Health Status",
                    "period": 300
                }}
            }},
            {{
                "type": "metric",
                "x": 0,
                "y": 12,
                "width": 12,
                "height": 6,
                "properties": {{
                    "metrics": [
                        [ "AWS/EC2", "CPUUtilization", "InstanceId", "{ec2_instance.id}" ],
                        [ ".", "NetworkIn", ".", "." ],
                        [ ".", "NetworkOut", ".", "." ]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "{aws_region}",
                    "title": "EC2 Instance Metrics",
                    "period": 300
                }}
            }}
        ]
    }}"""
)

cloudwatch_dashboard = aws.cloudwatch.Dashboard(
    "dual-stack-dashboard",
    dashboard_name="DualStackWebApplication",
    dashboard_body=dashboard_body
)

# Exports
export("vpc_id", vpc.id)
export("vpc_ipv6_cidr_block", vpc.ipv6_cidr_block)
export("public_subnet_1_id", public_subnet_1.id)
export("public_subnet_2_id", public_subnet_2.id)
export("ec2_instance_id", ec2_instance.id)
export("ec2_instance_public_ip", ec2_instance.public_ip)
export("ec2_instance_ipv6_addresses", ec2_instance.ipv6_addresses)
export("alb_dns_name", alb.dns_name)
export("alb_zone_id", alb.zone_id)
export("alb_arn", alb.arn)
export("target_group_arn", target_group.arn)
export("dashboard_url", Output.concat(
    "https://",
    aws_region,
    ".console.aws.amazon.com/cloudwatch/home?region=",
    aws_region,
    "#dashboards:name=DualStackWebApplication"
))

# Output instructions for verification
export("verification_instructions", Output.concat(
    "1. Access the application via ALB DNS: http://",
    alb.dns_name,
    "\n",
    "2. View CloudWatch Dashboard: ",
    "https://",
    aws_region,
    ".console.aws.amazon.com/cloudwatch/home?region=",
    aws_region,
    "#dashboards:name=DualStackWebApplication",
    "\n",
    "3. Test IPv6 connectivity: curl -6 http://",
    alb.dns_name,
    "\n",
    "4. Test IPv4 connectivity: curl -4 http://",
    alb.dns_name
))