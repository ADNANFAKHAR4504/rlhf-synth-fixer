# tap_stack.py
```python
import pulumi
import pulumi_aws as aws
from pulumi import Output

# Get the current AWS region and availability zones
current = aws.get_caller_identity()
region = aws.get_region()
azs = aws.get_availability_zones(state="available")

# Configuration
config = pulumi.Config()
instance_type = config.get("instanceType") or "t3.micro"
db_instance_class = config.get("dbInstanceClass") or "db.t3.micro"
key_pair_name = config.get("keyPairName") or "prod-web-app-key"

# Tags for all resources
common_tags = {
    "Environment": "Production",
    "Project": "WebApp",
    "ManagedBy": "Pulumi",
    "Owner": "DevOps"
}

# VPC
vpc = aws.ec2.Vpc(
    "ProdVPC",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": "Prod-VPC"}
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    "ProdIGW",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": "Prod-IGW"}
)

# Public Subnets (one per AZ)
public_subnet_1 = aws.ec2.Subnet(
    "ProdPublicSubnet1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": "Prod-Public-Subnet-1", "Type": "Public"}
)

public_subnet_2 = aws.ec2.Subnet(
    "ProdPublicSubnet2",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": "Prod-Public-Subnet-2", "Type": "Public"}
)

# Private Subnets (one per AZ)
private_subnet_1 = aws.ec2.Subnet(
    "ProdPrivateSubnet1",
    vpc_id=vpc.id,
    cidr_block="10.0.10.0/24",
    availability_zone=azs.names[0],
    tags={**common_tags, "Name": "Prod-Private-Subnet-1", "Type": "Private"}
)

private_subnet_2 = aws.ec2.Subnet(
    "ProdPrivateSubnet2",
    vpc_id=vpc.id,
    cidr_block="10.0.20.0/24",
    availability_zone=azs.names[1],
    tags={**common_tags, "Name": "Prod-Private-Subnet-2", "Type": "Private"}
)

# Elastic IP for NAT Gateway
nat_eip = aws.ec2.Eip(
    "ProdNATEIP",
    domain="vpc",
    tags={**common_tags, "Name": "Prod-NAT-EIP"}
)

# NAT Gateway (in first public subnet)
nat_gateway = aws.ec2.NatGateway(
    "ProdNATGateway",
    allocation_id=nat_eip.id,
    subnet_id=public_subnet_1.id,
    tags={**common_tags, "Name": "Prod-NAT-Gateway"}
)

# Route Tables
# Public Route Table
public_rt = aws.ec2.RouteTable(
    "ProdPublicRT",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": "Prod-Public-RT"}
)

# Public Route (to Internet Gateway)
public_route = aws.ec2.Route(
    "ProdPublicRoute",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
public_rt_association_1 = aws.ec2.RouteTableAssociation(
    "ProdPublicRTAssociation1",
    subnet_id=public_subnet_1.id,
    route_table_id=public_rt.id
)

public_rt_association_2 = aws.ec2.RouteTableAssociation(
    "ProdPublicRTAssociation2",
    subnet_id=public_subnet_2.id,
    route_table_id=public_rt.id
)

# Private Route Table
private_rt = aws.ec2.RouteTable(
    "ProdPrivateRT",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": "Prod-Private-RT"}
)

# Private Route (to NAT Gateway)
private_route = aws.ec2.Route(
    "ProdPrivateRoute",
    route_table_id=private_rt.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id
)

# Associate private subnets with private route table
private_rt_association_1 = aws.ec2.RouteTableAssociation(
    "ProdPrivateRTAssociation1",
    subnet_id=private_subnet_1.id,
    route_table_id=private_rt.id
)

private_rt_association_2 = aws.ec2.RouteTableAssociation(
    "ProdPrivateRTAssociation2",
    subnet_id=private_subnet_2.id,
    route_table_id=private_rt.id
)

# Security Groups
# ALB Security Group
alb_sg = aws.ec2.SecurityGroup(
    "ProdALBSecurityGroup",
    name="prod-alb-sg",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "HTTP access from anywhere"
        },
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "HTTPS access from anywhere"
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "All outbound traffic"
        }
    ],
    tags={**common_tags, "Name": "Prod-ALB-SG"}
)

# EC2 Security Group
ec2_sg = aws.ec2.SecurityGroup(
    "ProdEC2SecurityGroup",
    name="prod-ec2-sg",
    description="Security group for EC2 instances",
    vpc_id=vpc.id,
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "security_groups": [alb_sg.id],
            "description": "HTTP access from ALB"
        },
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "security_groups": [alb_sg.id],
            "description": "HTTPS access from ALB"
        },
        {
            "protocol": "tcp",
            "from_port": 22,
            "to_port": 22,
            "cidr_blocks": ["10.0.0.0/16"],
            "description": "SSH access from VPC"
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "All outbound traffic"
        }
    ],
    tags={**common_tags, "Name": "Prod-EC2-SG"}
)

# RDS Security Group
rds_sg = aws.ec2.SecurityGroup(
    "ProdRDSSecurityGroup",
    name="prod-rds-sg",
    description="Security group for RDS database",
    vpc_id=vpc.id,
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 3306,
            "to_port": 3306,
            "security_groups": [ec2_sg.id],
            "description": "MySQL access from EC2 instances"
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "All outbound traffic"
        }
    ],
    tags={**common_tags, "Name": "Prod-RDS-SG"}
)

# Parameter Store for configuration
db_password_param = aws.ssm.Parameter(
    "ProdDBPassword",
    name="/prod/webapp/db/password",
    type="SecureString",
    value="ChangeMe123!",  # In production, generate a secure password
    description="Database password for production web application",
    tags=common_tags
)

app_config_param = aws.ssm.Parameter(
    "ProdAppConfig",
    name="/prod/webapp/config/environment",
    type="String",
    value="production",
    description="Application environment configuration",
    tags=common_tags
)

# IAM Role for EC2 instances
ec2_role = aws.iam.Role(
    "ProdEC2Role",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Effect": "Allow",
                "Sid": ""
            }
        ]
    }""",
    tags=common_tags
)

# IAM Policy for EC2 instances (SSM access)
ec2_policy = aws.iam.RolePolicy(
    "ProdEC2Policy",
    role=ec2_role.id,
    policy="""{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath",
                    "ssm:DescribeParameters"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:UpdateInstanceInformation",
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel",
                    "ec2messages:AcknowledgeMessage",
                    "ec2messages:DeleteMessage",
                    "ec2messages:FailMessage",
                    "ec2messages:GetEndpoint",
                    "ec2messages:GetMessages",
                    "ec2messages:SendReply"
                ],
                "Resource": "*"
            }
        ]
    }"""
)

# Instance Profile
ec2_instance_profile = aws.iam.InstanceProfile(
    "ProdEC2InstanceProfile",
    role=ec2_role.name
)

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        {
            "name": "name",
            "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        }
    ]
)

# User data script for EC2 instances
user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install AWS CLI and SSM agent
yum install -y awscli amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable amazon-ssm-agent

# Create a simple web page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Production Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #232F3E; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Production Web Application</h1>
        </div>
        <div class="content">
            <h2>Welcome to our production environment!</h2>
            <p>This application is running on AWS infrastructure managed by Pulumi.</p>
            <p>Server: $(hostname)</p>
            <p>Region: $(curl -s http://169.254.169.254/latest/meta-data/placement/region)</p>
            <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        </div>
    </div>
</body>
</html>
EOF

# Replace placeholders with actual values
sed -i "s/\$(hostname)/$(hostname)/g" /var/www/html/index.html
sed -i "s/\$(curl -s http:\/\/169.254.169.254\/latest\/meta-data\/placement\/region)/$(curl -s http://169.254.169.254/latest/meta-data/placement/region)/g" /var/www/html/index.html
sed -i "s/\$(curl -s http:\/\/169.254.169.254\/latest\/meta-data\/placement\/availability-zone)/$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)/g" /var/www/html/index.html
"""

# Launch Template for Auto Scaling
launch_template = aws.ec2.LaunchTemplate(
    "ProdLaunchTemplate",
    name_prefix="prod-web-",
    image_id=ami.id,
    instance_type=instance_type,
    key_name=key_pair_name,
    vpc_security_group_ids=[ec2_sg.id],
    iam_instance_profile={
        "name": ec2_instance_profile.name
    },
    user_data=pulumi.Output.from_input(user_data).apply(
        lambda ud: __import__('base64').b64encode(ud.encode()).decode()
    ),
    tag_specifications=[
        {
            "resource_type": "instance",
            "tags": {**common_tags, "Name": "Prod-Web-Server"}
        }
    ],
    tags=common_tags
)

# Application Load Balancer
alb = aws.lb.LoadBalancer(
    "ProdALB",
    name="prod-web-alb",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_sg.id],
    subnets=[public_subnet_1.id, public_subnet_2.id],
    enable_deletion_protection=False,  # Set to True in production
    tags=common_tags
)

# Target Group
target_group = aws.lb.TargetGroup(
    "ProdTargetGroup",
    name="prod-web-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check={
        "enabled": True,
        "healthy_threshold": 2,
        "interval": 30,
        "matcher": "200",
        "path": "/",
        "port": "traffic-port",
        "protocol": "HTTP",
        "timeout": 5,
        "unhealthy_threshold": 2
    },
    tags=common_tags
)

# ALB Listener
alb_listener = aws.lb.Listener(
    "ProdALBListener",
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[{
        "type": "forward",
        "target_group_arn": target_group.arn
    }]
)

# Auto Scaling Group
asg = aws.autoscaling.Group(
    "ProdAutoScalingGroup",
    name="prod-web-asg",
    vpc_zone_identifiers=[private_subnet_1.id, private_subnet_2.id],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    min_size=2,
    max_size=6,
    desired_capacity=2,
    launch_template={
        "id": launch_template.id,
        "version": "$Latest"
    },
    tags=[
        {
            "key": "Name",
            "value": "Prod-ASG-Instance",
            "propagate_at_launch": True
        },
        {
            "key": "Environment",
            "value": "Production",
            "propagate_at_launch": True
        },
        {
            "key": "Project",
            "value": "WebApp",
            "propagate_at_launch": True
        }
    ]
)

# Auto Scaling Policies
scale_up_policy = aws.autoscaling.Policy(
    "ProdScaleUpPolicy",
    name="prod-scale-up",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=asg.name,
    policy_type="SimpleScaling"
)

scale_down_policy = aws.autoscaling.Policy(
    "ProdScaleDownPolicy",
    name="prod-scale-down",
    scaling_adjustment=-1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=asg.name,
    policy_type="SimpleScaling"
)

# CloudWatch Alarms
cpu_high_alarm = aws.cloudwatch.MetricAlarm(
    "ProdCPUHighAlarm",
    alarm_name="prod-cpu-high",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods="2",
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period="120",
    statistic="Average",
    threshold="70",
    alarm_description="This metric monitors ec2 cpu utilization",
    alarm_actions=[scale_up_policy.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    },
    tags=common_tags
)

cpu_low_alarm = aws.cloudwatch.MetricAlarm(
    "ProdCPULowAlarm",
    alarm_name="prod-cpu-low",
    comparison_operator="LessThanThreshold",
    evaluation_periods="2",
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period="120",
    statistic="Average",
    threshold="30",
    alarm_description="This metric monitors ec2 cpu utilization",
    alarm_actions=[scale_down_policy.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    },
    tags=common_tags
)

# RDS Subnet Group
db_subnet_group = aws.rds.SubnetGroup(
    "ProdDBSubnetGroup",
    name="prod-db-subnet-group",
    subnet_ids=[private_subnet_1.id, private_subnet_2.id],
    tags={**common_tags, "Name": "Prod-DB-Subnet-Group"}
)

# RDS Instance
rds_instance = aws.rds.Instance(
    "ProdRDSInstance",
    identifier="prod-webapp-db",
    allocated_storage=20,
    max_allocated_storage=100,
    storage_type="gp2",
    engine="mysql",
    engine_version="8.0",
    instance_class=db_instance_class,
    db_name="webapp",
    username="admin",
    password=db_password_param.value,
    vpc_security_group_ids=[rds_sg.id],
    db_subnet_group_name=db_subnet_group.name,
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    multi_az=True,
    storage_encrypted=True,
    skip_final_snapshot=True,  # Set to False in production
    deletion_protection=False,  # Set to True in production
    tags=common_tags
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [public_subnet_1.id, public_subnet_2.id])
pulumi.export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_zone_id", alb.zone_id)
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("nat_gateway_ip", nat_eip.public_ip)
pulumi.export("application_url", alb.dns_name.apply(lambda dns: f"http://{dns}"))
```
