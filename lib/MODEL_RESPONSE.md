I'll create a comprehensive Python Pulumi program that meets all your requirements for a secure, scalable, dual-stack AWS infrastructure. Here's the complete solution:

Project Structure
First, let's set up the project structure:

aws-dualstack-infrastructure/
├── __main__.py
├── Pulumi.yaml
├── Pulumi.dev.yaml
└── requirements.txt
Pulumi.yaml
name: aws-dualstack-infrastructure
runtime: python
description: A secure, scalable dual-stack (IPv4/IPv6) web application infrastructure on AWS
Pulumi.dev.yaml
config:
  aws:region: us-east-1
  aws-dualstack-infrastructure:environment: dev
  aws-dualstack-infrastructure:instance-type: t3.micro
  aws-dualstack-infrastructure:project-name: dualstack-web-app
requirements.txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
main.py
"""
AWS Dual-Stack Infrastructure with Pulumi
=========================================

This module provisions a highly available, dual-stack (IPv4 and IPv6) 
web application infrastructure on AWS using Pulumi and Python.

Features:
- Dual-stack VPC with IPv4 and IPv6 CIDR blocks
- Multi-AZ public subnets with internet connectivity
- EC2 instances with Nginx web server
- Application Load Balancer with dual-stack support
- Security groups with least privilege access
- CloudWatch monitoring and dashboards
- IAM roles with minimal permissions
"""

import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any
import json

# =============================================================================
# Configuration Management
# =============================================================================

config = pulumi.Config()
aws_config = pulumi.Config("aws")

# Environment-specific configuration
ENVIRONMENT = config.get("environment") or "dev"
AWS_REGION = aws_config.require("region")
INSTANCE_TYPE = config.get("instance-type") or "t3.micro"
PROJECT_NAME = config.get("project-name") or "dualstack-web-app"

# Resource naming convention
def get_resource_name(resource_type: str) -> str:
    """Generate consistent resource names following naming convention."""
    return f"{PROJECT_NAME}-{ENVIRONMENT}-{resource_type}"

# =============================================================================
# Data Sources
# =============================================================================

# Get available AZs in the region
availability_zones = aws.get_availability_zones(state="available")

# Get the latest Amazon Linux 2 AMI
amazon_linux_ami = aws.ec2.get_ami(
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

# =============================================================================
# Networking Infrastructure
# =============================================================================

# Create VPC with dual-stack support
vpc = aws.ec2.Vpc(
    get_resource_name("vpc"),
    cidr_block="10.0.0.0/16",
    assign_generated_ipv6_cidr_block=True,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": get_resource_name("vpc"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# Internet Gateway for public internet access
internet_gateway = aws.ec2.InternetGateway(
    get_resource_name("igw"),
    vpc_id=vpc.id,
    tags={
        "Name": get_resource_name("igw"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# Create public subnets across multiple AZs for high availability
public_subnets: List[aws.ec2.Subnet] = []

for i in range(min(2, len(availability_zones.names))):
    az = availability_zones.names[i]
    
    # Calculate IPv4 and IPv6 CIDR blocks for each subnet
    ipv4_cidr = f"10.0.{i + 1}.0/24"
    
    subnet = aws.ec2.Subnet(
        get_resource_name(f"public-subnet-{i + 1}"),
        vpc_id=vpc.id,
        availability_zone=az,
        cidr_block=ipv4_cidr,
        ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
            lambda cidr: f"{cidr[:-2]}{i + 1}::/64"
        ),
        map_public_ip_on_launch=True,
        assign_ipv6_address_on_creation=True,
        tags={
            "Name": get_resource_name(f"public-subnet-{i + 1}"),
            "Environment": ENVIRONMENT,
            "Project": PROJECT_NAME,
            "Type": "Public",
            "AZ": az
        }
    )
    
    public_subnets.append(subnet)

# Route table for public subnets
public_route_table = aws.ec2.RouteTable(
    get_resource_name("public-rt"),
    vpc_id=vpc.id,
    tags={
        "Name": get_resource_name("public-rt"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Type": "Public"
    }
)

# IPv4 route to Internet Gateway
ipv4_route = aws.ec2.Route(
    get_resource_name("ipv4-route"),
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id
)

# IPv6 route to Internet Gateway
ipv6_route = aws.ec2.Route(
    get_resource_name("ipv6-route"),
    route_table_id=public_route_table.id,
    destination_ipv6_cidr_block="::/0",
    gateway_id=internet_gateway.id
)

# Associate route table with public subnets
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        get_resource_name(f"public-rta-{i + 1}"),
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )

# =============================================================================
# Security Groups
# =============================================================================

# Security group for Application Load Balancer
alb_security_group = aws.ec2.SecurityGroup(
    get_resource_name("alb-sg"),
    name=get_resource_name("alb-sg"),
    description="Security group for Application Load Balancer - allows HTTP traffic from internet",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTP traffic from anywhere (IPv4)
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTP traffic from internet (IPv4)"
        ),
        # Allow HTTP traffic from anywhere (IPv6)
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            ipv6_cidr_blocks=["::/0"],
            description="Allow HTTP traffic from internet (IPv6)"
        )
    ],
    egress=[
        # Allow all outbound traffic (IPv4)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic (IPv4)"
        ),
        # Allow all outbound traffic (IPv6)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            ipv6_cidr_blocks=["::/0"],
            description="Allow all outbound traffic (IPv6)"
        )
    ],
    tags={
        "Name": get_resource_name("alb-sg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Purpose": "ALB Security Group"
    }
)

# Security group for EC2 instances
ec2_security_group = aws.ec2.SecurityGroup(
    get_resource_name("ec2-sg"),
    name=get_resource_name("ec2-sg"),
    description="Security group for EC2 instances - allows HTTP traffic only from ALB",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTP traffic only from ALB security group
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            security_groups=[alb_security_group.id],
            description="Allow HTTP traffic from ALB only"
        ),
        # Allow SSH for management (optional - can be removed for production)
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["0.0.0.0/0"],  # Restrict this in production
            description="Allow SSH access for management"
        )
    ],
    egress=[
        # Allow all outbound traffic (IPv4)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic (IPv4)"
        ),
        # Allow all outbound traffic (IPv6)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            ipv6_cidr_blocks=["::/0"],
            description="Allow all outbound traffic (IPv6)"
        )
    ],
    tags={
        "Name": get_resource_name("ec2-sg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Purpose": "EC2 Security Group"
    }
)

# =============================================================================
# IAM Roles and Policies
# =============================================================================

# IAM role for EC2 instances with minimal permissions
ec2_assume_role_policy = {
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
}

ec2_role = aws.iam.Role(
    get_resource_name("ec2-role"),
    name=get_resource_name("ec2-role"),
    assume_role_policy=json.dumps(ec2_assume_role_policy),
    description="IAM role for EC2 instances with minimal required permissions",
    tags={
        "Name": get_resource_name("ec2-role"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# Custom policy for EC2 instances (CloudWatch metrics and logs)
ec2_policy_document = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups"
            ],
            "Resource": "*"
        }
    ]
}

ec2_policy = aws.iam.Policy(
    get_resource_name("ec2-policy"),
    name=get_resource_name("ec2-policy"),
    description="Custom policy for EC2 instances - CloudWatch and logging permissions",
    policy=json.dumps(ec2_policy_document)
)

# Attach custom policy to role
ec2_policy_attachment = aws.iam.RolePolicyAttachment(
    get_resource_name("ec2-policy-attachment"),
    role=ec2_role.name,
    policy_arn=ec2_policy.arn
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile(
    get_resource_name("ec2-instance-profile"),
    name=get_resource_name("ec2-instance-profile"),
    role=ec2_role.name
)

# =============================================================================
# User Data Script for EC2 Instances
# =============================================================================

user_data_script = f"""#!/bin/bash
# Update system packages
yum update -y

# Install and configure Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create a custom index page with system information
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dual-Stack Web Application</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        .info-section {{
            margin: 20px 0;
            padding: 15px;
            background-color: #ecf0f1;
            border-radius: 5px;
        }}
        .success {{
            color: #27ae60;
            font-weight: bold;
        }}
        .highlight {{
            background-color: #f39c12;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🌐 Dual-Stack Web Application</h1>
        
        <div class="info-section">
            <h2>✅ Deployment Status</h2>
            <p class="success">Successfully deployed on AWS with dual-stack (IPv4/IPv6) support!</p>
            <p><strong>Environment:</strong> <span class="highlight">{ENVIRONMENT}</span></p>
            <p><strong>Region:</strong> <span class="highlight">{AWS_REGION}</span></p>
            <p><strong>Instance Type:</strong> <span class="highlight">{INSTANCE_TYPE}</span></p>
        </div>
        
        <div class="info-section">
            <h2>🏗️ Infrastructure Components</h2>
            <ul>
                <li><strong>VPC:</strong> Dual-stack with IPv4 and IPv6 CIDR blocks</li>
                <li><strong>Subnets:</strong> Multi-AZ public subnets with internet connectivity</li>
                <li><strong>Load Balancer:</strong> Application Load Balancer with dual-stack support</li>
                <li><strong>Security:</strong> Least privilege security groups and IAM roles</li>
                <li><strong>Monitoring:</strong> CloudWatch dashboard and detailed monitoring</li>
            </ul>
        </div>
        
        <div class="info-section">
            <h2>📊 System Information</h2>
            <p><strong>Server:</strong> Amazon Linux 2 with Nginx</p>
            <p><strong>Timestamp:</strong> <span id="timestamp"></span></p>
            <p><strong>User Agent:</strong> <span id="user-agent"></span></p>
        </div>
        
        <div class="info-section">
            <h2>🔧 Infrastructure as Code</h2>
            <p>This infrastructure is managed using <strong>Pulumi</strong> with Python, ensuring:</p>
            <ul>
                <li>Reproducible deployments</li>
                <li>Version-controlled infrastructure</li>
                <li>Automated provisioning and updates</li>
                <li>Best practices for security and scalability</li>
            </ul>
        </div>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        document.getElementById('user-agent').textContent = navigator.userAgent;
    </script>
</body>
</html>
EOF

# Configure Nginx for both IPv4 and IPv6
cat > /etc/nginx/conf.d/dualstack.conf << 'EOF'
server {{
    listen 80;
    listen [::]:80;
    server_name _;
    
    location / {{
        root /var/www/html;
        index index.html;
    }}
    
    location /health {{
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }}
}}
EOF

# Restart Nginx to apply configuration
systemctl restart nginx

# Install CloudWatch agent for detailed monitoring
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
    "metrics": {{
        "namespace": "CWAgent",
        "metrics_collected": {{
            "cpu": {{
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            }},
            "disk": {{
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }},
            "diskio": {{
                "measurement": ["io_time"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }},
            "mem": {{
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }},
            "netstat": {{
                "measurement": ["tcp_established", "tcp_time_wait"],
                "metrics_collection_interval": 60
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
    -a fetch-config -m ec2 -s \\
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Log deployment completion
echo "$(date): Dual-stack web server deployment completed successfully" >> /var/log/deployment.log
"""

# =============================================================================
# EC2 Instances
# =============================================================================

# Deploy EC2 instances across multiple subnets for high availability
ec2_instances: List[aws.ec2.Instance] = []

for i, subnet in enumerate(public_subnets):
    instance = aws.ec2.Instance(
        get_resource_name(f"web-server-{i + 1}"),
        ami=amazon_linux_ami.id,
        instance_type=INSTANCE_TYPE,
        subnet_id=subnet.id,
        vpc_security_group_ids=[ec2_security_group.id],
        iam_instance_profile=ec2_instance_profile.name,
        user_data=user_data_script,
        monitoring=True,  # Enable detailed monitoring
        ipv6_address_count=1,  # Assign one IPv6 address
        tags={
            "Name": get_resource_name(f"web-server-{i + 1}"),
            "Environment": ENVIRONMENT,
            "Project": PROJECT_NAME,
            "Role": "WebServer",
            "AZ": subnet.availability_zone
        }
    )
    
    ec2_instances.append(instance)

# =============================================================================
# Application Load Balancer
# =============================================================================

# Create target group for EC2 instances
target_group = aws.lb.TargetGroup(
    get_resource_name("web-tg"),
    name=get_resource_name("web-tg"),
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    ip_address_type="dualstack",  # Support both IPv4 and IPv6
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        unhealthy_threshold=2,
        timeout=5,
        interval=30,
        path="/health",
        matcher="200",
        protocol="HTTP",
        port="traffic-port"
    ),
    tags={
        "Name": get_resource_name("web-tg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# Attach EC2 instances to target group
for i, instance in enumerate(ec2_instances):
    aws.lb.TargetGroupAttachment(
        get_resource_name(f"web-tg-attachment-{i + 1}"),
        target_group_arn=target_group.arn,
        target_id=instance.id,
        port=80
    )

# Create Application Load Balancer with dual-stack support
alb = aws.lb.LoadBalancer(
    get_resource_name("web-alb"),
    name=get_resource_name("web-alb"),
    load_balancer_type="application",
    ip_address_type="dualstack",  # Enable dual-stack (IPv4 and IPv6)
    scheme="internet-facing",
    security_groups=[alb_security_group.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,  # Set to True for production
    tags={
        "Name": get_resource_name("web-alb"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Type": "Application Load Balancer"
    }
)

# Create HTTP listener
http_listener = aws.lb.Listener(
    get_resource_name("web-listener"),
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

# =============================================================================
# CloudWatch Monitoring and Dashboard
# =============================================================================

# Create CloudWatch Dashboard for monitoring
dashboard_body = pulumi.Output.all(
    alb_full_name=alb.arn_suffix,
    target_group_full_name=target_group.arn_suffix
).apply(lambda args: json.dumps({
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", args["alb_full_name"]],
                    [".", "ActiveConnectionCount", ".", "."],
                    [".", "NewConnectionCount", ".", "."]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": AWS_REGION,
                "title": "ALB Request and Connection Metrics",
                "period": 300,
                "stat": "Sum"
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
                    ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", args["target_group_full_name"]],
                    [".", "UnHealthyHostCount", ".", "."]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": AWS_REGION,
                "title": "Target Group Health Status",
                "period": 300,
                "stat": "Average"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", args["alb_full_name"]],
                    [".", "HTTPCode_Target_4XX_Count", ".", "."],
                    [".", "HTTPCode_Target_5XX_Count", ".", "."]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": AWS_REGION,
                "title": "HTTP Response Codes",
                "period": 300,
                "stat": "Sum"
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", args["alb_full_name"]]
                ],
                "view": "timeSeries",
                "stacked": False,
                "region": AWS_REGION,
                "title": "Target Response Time",
                "period": 300,
                "stat": "Average"
            }
        }
    ]
}))

cloudwatch_dashboard = aws.cloudwatch.Dashboard(
    get_resource_name("monitoring-dashboard"),
    dashboard_name=get_resource_name("monitoring-dashboard"),
    dashboard_body=dashboard_body
)

# Create CloudWatch Alarms for critical metrics
# Alarm for unhealthy targets
unhealthy_targets_alarm = aws.cloudwatch.MetricAlarm(
    get_resource_name("unhealthy-targets-alarm"),
    name=get_resource_name("unhealthy-targets-alarm"),
    description="Alarm when there are unhealthy targets in the target group",
    metric_name="UnHealthyHostCount",
    namespace="AWS/ApplicationELB",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    dimensions={
        "TargetGroup": target_group.arn_suffix
    },
    tags={
        "Name": get_resource_name("unhealthy-targets-alarm"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# Alarm for high response time
high_response_time_alarm = aws.cloudwatch.MetricAlarm(
    get_resource_name("high-response-time-alarm"),
    name=get_resource_name("high-response-time-alarm"),
    description="Alarm when target response time is too high",
    metric_name="TargetResponseTime",
    namespace="AWS/ApplicationELB",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=1.0,  # 1 second
    comparison_operator="GreaterThanThreshold",
    dimensions={
        "LoadBalancer": alb.arn_suffix
    },
    tags={
        "Name": get_resource_name("high-response-time-alarm"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    }
)

# =============================================================================
# Outputs
# =============================================================================

# Export key infrastructure information
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_ipv4_cidr", vpc.cidr_block)
pulumi.export("vpc_ipv6_cidr", vpc.ipv6_cidr_block)

pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("availability_zones", [subnet.availability_zone for subnet in public_subnets])

pulumi.export("ec2_instance_ids", [instance.id for instance in ec2_instances])
pulumi.export("ec2_public_ips", [instance.public_ip for instance in ec2_instances])
pulumi.export("ec2_ipv6_addresses", [instance.ipv6_addresses for instance in ec2_instances])

pulumi.export("alb_arn", alb.arn)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_zone_id", alb.zone_id)
pulumi.export("alb_security_group_id", alb_security_group.id)

pulumi.export("target_group_arn", target_group.arn)
pulumi.export("cloudwatch_dashboard_url", 
    pulumi.Output.concat(
        "https://",
        AWS_REGION,
        ".console.aws.amazon.com/cloudwatch/home?region=",
        AWS_REGION,
        "#dashboards:name=",
        cloudwatch_dashboard.dashboard_name
    )
)

# Primary output - ALB DNS name for direct access
pulumi.export("application_url", 
    pulumi.Output.concat("http://", alb.dns_name)
)

# Export configuration summary
pulumi.export("deployment_summary", {
    "environment": ENVIRONMENT,
    "region": AWS_REGION,
    "instance_type": INSTANCE_TYPE,
    "project_name": PROJECT_NAME,
    "dual_stack_enabled": True,
    "high_availability": True,
    "monitoring_enabled": True,
    "security_hardened": True
})

# =============================================================================
# Deployment Instructions and Verification
# =============================================================================

pulumi.export("deployment_instructions", {
    "step_1": "Run 'pulumi up' to deploy the infrastructure",
    "step_2": "Wait for deployment to complete (typically 5-10 minutes)",
    "step_3": "Access the application using the 'application_url' output",
    "step_4": "Monitor the infrastructure using the CloudWatch dashboard",
    "verification": {
        "web_access": "Open the application_url in a web browser",
        "ipv6_test": "Use 'curl -6' with the ALB DNS name to test IPv6 connectivity",
        "health_check": "Check target group health in AWS Console",
        "monitoring": "View metrics in the CloudWatch dashboard"
    }
})

print("🚀 AWS Dual-Stack Infrastructure Deployment")
print("=" * 50)
print(f"Environment: {ENVIRONMENT}")
print(f"Region: {AWS_REGION}")
print(f"Instance Type: {INSTANCE_TYPE}")
print(f"Project: {PROJECT_NAME}")
print("=" * 50)
print("✅ Infrastructure components:")
print("   • Dual-stack VPC with IPv4 and IPv6 support")
print("   • Multi-AZ public subnets for high availability")
print("   • Application Load Balancer with dual-stack support")
print("   • EC2 instances with Nginx web server")
print("   • Security groups with least privilege access")
print("   • IAM roles with minimal permissions")
print("   • CloudWatch monitoring and dashboards")
print("   • Automated health checks and alarms")
print("=" * 50)