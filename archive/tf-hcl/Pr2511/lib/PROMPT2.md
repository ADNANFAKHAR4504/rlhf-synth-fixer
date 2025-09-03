This is incomplete code ,Create complete code according to prompt .

# tap_stack.tf - Multi-Region High Availability Infrastructure

terraform {
required_version = ">= 1.0"
required_providers {
aws = {
source = "hashicorp/aws"
version = "~> 5.0"
}
}
}

# Variables Section

variable "environment" {
description = "Environment name (e.g., production, staging)"
type = string
default = "production"
}

variable "instance_type" {
description = "EC2 instance type for web servers"
type = string
default = "t3.medium"
}

variable "min_capacity" {
description = "Minimum number of instances in ASG"
type = number
default = 2
}

variable "desired_capacity" {
description = "Desired number of instances in ASG"
type = number
default = 3
}

variable "max_capacity" {
description = "Maximum number of instances in ASG"
type = number
default = 10
}

variable "domain_name" {
description = "Domain name for the application"
type = string
default = "example.com"
}

variable "key_pair_name" {
description = "EC2 Key Pair name for instances"
type = string
default = "my-key-pair"
}

# Locals Section

locals {
regions = {
primary = "us-east-1"
secondary = "us-west-2"
}

availability_zones = {
"us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
"us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

common_tags = {
Environment = var.environment
Project = "MultiRegion-HA"
ManagedBy = "Terraform"
}
}

# Provider Configuration

provider "aws" {
alias = "primary"
region = local.regions.primary
}

provider "aws" {
alias = "secondary"
region = local.regions.secondary
}

# Data Sources

data "aws_ami" "amazon_linux" {
provider = aws.primary
most_recent = true
owners = ["amazon"]

filter {
name = "name"
values = ["amzn2-ami-hvm-*-x86_64-gp2"]
}
}

data "aws_ami" "amazon_linux_west" {
provider = aws.secondary
most_recent = true
owners = ["amazon"]

filter {
name = "name"
values = ["amzn2-ami-hvm-*-x86_64-gp2"]
}
}

# Route 53 Hosted Zone

resource "aws_route53_zone" "main" {
provider = aws.primary
name = var.domain_name

tags = merge(local.common_tags, {
Name = "${var.environment}-hosted-zone"
})
}

# SSL Certificate for Primary Region

resource "aws_acm_certificate" "primary" {
provider = aws.primary
domain_name = var.domain_name
validation_method = "DNS"

subject_alternative_names = [
"*.${var.domain_name}"
]

lifecycle {
create_before_destroy = true
}

tags = merge(local.common_tags, {
Name = "${var.environment}-cert-primary"
})
}

# SSL Certificate for Secondary Region

resource "aws_acm_certificate" "secondary" {
provider = aws.secondary
domain_name = var.domain_name
validation_method = "DNS"

subject_alternative_names = [
"*.${var.domain_name}"
]

lifecycle {
create_before_destroy = true
}

tags = merge(local.common_tags, {
Name = "${var.environment}-cert-secondary"
})
}

# PRIMARY REGION INFRASTRUCTURE (us-east-1)

# VPC - Primary Region

resource "aws_vpc" "primary" {
provider = aws.primary
cidr_block = "10.0.0.0/16"
enable_dns_hostnames = true
enable_dns_support = true

tags = merge(local.common_tags, {
Name = "${var.environment}-vpc-primary"
})
}

# Internet Gateway - Primary

resource "aws_internet_gateway" "primary" {
provider = aws.primary
vpc_id = aws_vpc.primary.id

tags = merge(local.common_tags, {
Name = "${var.environment}-igw-primary"
})
}

# Public Subnets - Primary Region

resource "aws_subnet" "public_primary" {
provider = aws.primary
count = 3
vpc_id = aws_vpc.primary.id
cidr_block = "10.0.${count.index + 1}.0/24"
availability_zone = local.availability_zones["us-east-1"][count.index]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "${var.environment}-public-subnet-primary-${count.index + 1}"
Type = "Public"
})
}

Private Subnets - Primary Region

resource "aws_subnet" "private_primary" {
provider = aws.primary
count = 3
vpc_id = aws_vpc.primary.id
cidr_block = "10.0.${count.index + 10}.0/24"
availability_zone = local.availability_zones["us-east-1"][count.index]

tags = merge(local.common_tags, {
Name = "${var.environment}-private-subnet-primary-${count.index + 1}"
Type = "Private"
})
}

# NAT Gateways - Primary Region

resource "aws_eip" "nat_primary" {
provider = aws.primary
count = 3
domain = "vpc"

tags = merge(local.common_tags, {
Name = "${var.environment}-nat-eip-primary-${count.index + 1}"
})
}

resource "aws_nat_gateway" "primary" {
provider = aws.primary
count = 3
allocation_id = aws_eip.nat_primary[count.index].id
subnet_id = aws_subnet.public_primary[count.index].id

tags = merge(local.common_tags, {
Name = "${var.environment}-nat-gateway-primary-${count.index + 1}"
})

depends_on = [aws_internet_gateway.primary]
}

# Route Tables - Primary Region

resource "aws_route_table" "public_primary" {
provider = aws.primary
vpc_id = aws_vpc.primary.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.primary.id
}

tags = merge(local.common_tags, {
Name = "${var.environment}-public-rt-primary"
})
}

resource "aws_route_table" "private_primary" {
provider = aws.primary
count = 3
vpc_id = aws_vpc.primary.id

route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.primary[count.index].id
}

tags = merge(local.common_tags, {
Name = "${var.environment}-private-rt-primary-${count.index + 1}"
})
}

# Route Table Associations - Primary Region

resource "aws_route_table_association" "public_primary" {
provider = aws.primary
count = 3
subnet_id = aws_subnet.public_primary[count.index].id
route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary" {
provider = aws.primary
count = 3
subnet_id = aws_subnet.private_primary[count.index].id
route_table_id = aws_route_table.private_primary[count.index].id
}

# Security Groups - Primary Region

resource "aws_security_group" "alb_primary" {
provider = aws.primary
name = "${var.environment}-alb-sg-primary"
description = "Security group for ALB in primary region"
vpc_id = aws_vpc.primary.id

ingress {
from_port = 80
to_port = 80
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

ingress {
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "${var.environment}-alb-sg-primary"
})
}

resource "aws_security_group" "web_primary" {
provider = aws.primary
name = "${var.environment}-web-sg-primary"
description = "Security group for web servers in primary region"
vpc_id = aws_vpc.primary.id

ingress {
from_port = 80
to_port = 80
protocol = "tcp"
security_groups = [aws_security_group.alb_primary.id]
}

ingress {
from_port = 22
to_port = 22
protocol = "tcp"
cidr_blocks = ["10.0.0.0/16"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "${var.environment}-web-sg-primary"
})
}

# IAM Role for EC2 Instances

resource "aws_iam_role" "ec2_role" {
provider = aws.primary
name = "${var.environment}-ec2-role"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ec2.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_policy" {
provider = aws.primary
name = "${var.environment}-ec2-policy"
role = aws_iam_role.ec2_role.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"cloudwatch:PutMetricData",
"ec2:DescribeVolumes",
"ec2:DescribeTags",
"logs:PutLogEvents",
"logs:CreateLogGroup",
"logs:CreateLogStream"
]
Resource = "\*"
}
]
})
}

resource "aws_iam_instance_profile" "ec2_profile" {
provider = aws.primary
name = "${var.environment}-ec2-profile"
role = aws_iam_role.ec2_role.name

tags = local.common_tags
}

# Launch Template - Primary Region

resource "aws_launch_template" "primary" {
provider = aws.primary
name = "${var.environment}-lt-primary"
image_id = data.aws_ami.amazon_linux.id
instance_type = var.instance_type
key_name = var.key_pair_name

vpc_security_group_ids = [aws_security_group.web_primary.id]

iam_instance_profile {
name = aws_iam_instance_profile.ec2_profile.name
}

user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Create a simple web page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region HA App - Primary</title>
    </head>
    <body>
        <h1>Welcome to Multi-Region HA Application</h1>
        <h2>Primary Region: us-east-1</h2>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        <p>Timestamp: $(date)</p>
    </body>
    </html>

HTML

    # Health check endpoint
    cat > /var/www/html/health << 'HEALTH'
    OK

HEALTH

    # Configure CloudWatch monitoring
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux

EOF
)

tag_specifications {
resource_type = "instance"
tags = merge(local.common_tags, {
Name = "${var.environment}-web-instance-primary"
})
}

tags = merge(local.common_tags, {
Name = "${var.environment}-launch-template-primary"
})
}

# Application Load Balancer - Primary Region

resource "aws_lb" "primary" {
provider = aws.primary
name = "${var.environment}-alb-primary"
internal = false
load_balancer_type = "application"
security_groups = [aws_security_group.alb_primary.id]
subnets = aws_subnet.public_primary[*].id

enable_deletion_protection = false
enable_cross_zone_load_balancing = true

tags = merge(local.common_tags, {
Name = "${var.environment}-alb-primary"
})
}

# Target Group - Primary Region

resource "aws_lb_target_group" "primary" {
provider = aws.primary
name = "${var.environment}-tg-primary"
port = 80
protocol = "HTTP"
vpc_id = aws_vpc.primary.id

health_check {
enabled = true
healthy_threshold = 2
unhealthy_threshold = 2
timeout = 5
interval = 30
path = "/health"
matcher = "200"
port = "traffic-port"
protocol = "HTTP"
}

tags = merge(local.common_tags, {
Name = "${var.environment}-target-group-primary"
})
}

# ALB Listeners - Primary Region

resource "aws_lb_listener" "primary_http" {
provider = aws.primary
load_balancer_arn = aws_lb.primary.arn
port = "80"
protocol = "HTTP"

default_action {
type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }

}
}

resource "aws_lb_listener" "primary_https" {
provider = aws.primary
load_balancer_arn = aws_lb.primary.arn
port = "443"
protocol = "HTTPS"
ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"
certificate_arn = aws_acm_certificate.primary.arn

default_action {
type = "forward"
target_group_arn = aws_lb_target_group.primary.arn
}
}

# Auto Scaling Group - Primary Region

resource "aws_autoscaling_group" "primary" {
provider = aws.primary
name = "${var.environment}-asg-primary"
vpc_zone_identifier = aws_subnet.private_primary[*].id
target_group_arns = [aws_lb_target_group.primary.arn]
health_check_type = "ELB"
health_check_grace_period = 300

min_size = var.min_capacity
max_size = var.max_capacity
desired_capacity = var.desired_capacity

launch_template {
id = aws_launch_template.primary.id
version = "$Latest"
}

tag {
key = "Name"
value = "${var.environment}-asg-primary"
propagate_at_launch = false
}

dynamic "tag" {
for_each = local.common_tags
content {
key = tag.key
value = tag.value
propagate_at_launch = true
}
}

instance_refresh {
strategy = "Rolling"
preferences {
min_healthy_percentage = 50
}
}
}

# Auto Scaling Policies - Primary Region

resource "aws_autoscaling_policy" "scale_up_primary" {
provider = aws.primary
name = "${var.environment}-scale-up-primary"
scaling_adjustment = 2
adjustment_type = "ChangeInCapacity"
cooldown = 300
autoscaling_group_name = aws_autoscaling_group.primary.name
}

resource "aws_autoscaling_policy" "scale_down_primary" {
provider = aws.primary
name = "${var.environment}-scale-down-primary"
scaling_adjustment = -1
adjustment_type = "ChangeInCapacity"
cooldown = 300
autoscaling_group_name = aws_autoscaling_group.primary.name
}

# CloudWatch Alarms - Primary Region

resource "aws_cloudwatch_metric_alarm" "cpu_high_primary" {
provider = aws.primary
alarm_name = "${var.environment}-cpu-high-primary"
comparison_operator = "GreaterThanThreshold"
evaluation_periods = "2"
metric_name = "CPUUtilization"
namespace = "AWS/EC2"
period = "300"
statistic = "Average"
threshold = "80"
alarm_description = "This metric monitors ec2 cpu utilization"
alarm_actions = [aws_autoscaling_policy.scale_up_primary.arn]

dimensions = {
AutoScalingGroupName = aws_autoscaling_group.primary.name
}

tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low_primary" {
provider = aws.primary
alarm_name = "${var.environment}-cpu-low-primary"
comparison_operator = "LessThanThreshold"
evaluation_periods = "2"
metric_name = "CPUUtilization"
namespace = "AWS/EC2"
period = "300"
statistic = "Average"
threshold = "20"
alarm_description = "This metric monitors ec2 cpu utilization"
alarm_actions = [aws_autoscaling_policy.scale_down_primary.arn]

dimensions = {
AutoScalingGroupName = aws_autoscaling_group.primary.name
}

tags = local.common_tags
}

# SECONDARY REGION INFRASTRUCTURE (us-west-2)

# VPC - Secondary Region

resource "aws_vpc" "secondary" {
provider = aws.secondary
cidr_block = "10.1.0.0/16"
enable_dns_hostnames = true
enable_dns_support = true

tags = merge(local.common_tags, {
Name = "${var.environment}-vpc-secondary"
})
}

# Internet Gateway - Secondary

resource "aws_internet_gateway" "secondary" {
provider = aws.secondary
vpc_id = aws_vpc.secondary.id

tags = merge(local.common_tags, {
Name = "${var.environment}-igw-secondary"
})
}

# Public Subnets - Secondary Region

resource "aws_subnet" "public_secondary" {
provider = aws.secondary
count = 3
vpc_id = aws_vpc.secondary.id
cidr_block = "10.1.${count.index + 1}.0/24"
availability_zone = local.availability_zones["us-west-2"][count.index]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "${var.environment}-public-subnet-secondary-${count.index + 1}"
Type = "Public"
})
}

# Private Subnets - Secondary Region

resource "aws_subnet" "private_secondary" {
provider = aws.secondary
count = 3
vpc_id = aws_vpc.secondary.id
cidr_block = "10.1.${count.index + 10}.0/24"
availability_zone = local.availability_zones["us-west-2"][count.index]

tags = merge(local.common_tags, {
Name = "${var.environment}-private-subnet-secondary-${count.index + 1}"
Type = "Private"
})
}

# NAT Gateways - Secondary Region

resource "aws_eip" "nat_secondary" {
provider = aws.secondary
count = 3
domain = "vpc"

tags = merge(local.common_tags, {
Name = "${var.environment}-nat-eip-secondary-${count.index + 1}"
})
}

resource "aws_nat_gateway" "secondary" {
provider = aws.secondary
count = 3
allocation_id = aws_eip.nat_secondary[count.index].id
subnet_id = aws_subnet.public_secondary[count.index].id

tags = merge(local.common_tags, {
Name = "${var.environment}-nat-gateway-secondary-${count.index + 1}"
})

depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary Region

resource "aws_route_table" "public_secondary" {
provider = aws.secondary
vpc_id = aws_vpc.secondary.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.secondary.id
}

tags = merge(local.common_tags, {
Name = "${var.environment}-public-rt-secondary"
})
}

resource "aws_route_table" "private_secondary" {
provider = aws.secondary
count = 3
vpc_id = aws_vpc.secondary.id

route {
cidr_block = "0.0.0.0/0"
nat_gateway_id = aws_nat_gateway.secondary[count.index].id
}

tags = merge(local.common_tags, {
Name = "${var.environment}-private-rt-secondary-${count.index + 1}"
})
}

# Route Table Associations - Secondary Region

resource "aws_route_table_association" "public_secondary" {
provider = aws.secondary
count = 3
subnet_id = aws_subnet.public_secondary[count.index].id
route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary" {
provider = aws.secondary
count = 3
subnet_id = aws_subnet.private_secondary[count.index].id
route_table_id = aws_route_table.private_secondary[count.index].id
}

# Security Groups - Secondary Region

resource "aws_security_group" "alb_secondary" {
provider = aws.secondary
name = "${var.environment}-alb-sg-secondary"
description = "Security group for ALB in secondary region"
vpc_id = aws_vpc.secondary.id

ingress {
from_port = 80
to_port = 80
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

ingress {
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "${var.environment}-alb-sg-secondary"
})
}

resource "aws_security_group" "web_secondary" {
provider = aws.secondary
name = "${var.environment}-web-sg-secondary"
description = "Security group for web servers in secondary region"
vpc_id = aws_vpc.secondary.id

ingress {
from_port = 80
to_port = 80
protocol = "tcp"
security_groups = [aws_security_group.alb_secondary.id]
}

ingress {
from_port = 22
to_port = 22
protocol = "tcp"
cidr_blocks = ["10.1.0.0/16"]
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = merge(local.common_tags, {
Name = "${var.environment}-web-sg-secondary"
})
}

# IAM Role for EC2 Instances - Secondary Region

resource "aws_iam_role" "ec2_role_secondary" {
provider = aws.secondary
name = "${var.environment}-ec2-role-secondary"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ec2.amazonaws.com"
}
}
]
})

tags = local.common_tags
}

resource "aws_iam_role_policy" "ec2_policy_secondary" {
provider = aws.secondary
name = "${var.environment}-ec2-policy-secondary"
role = aws_iam_role.ec2_role_secondary.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"cloudwatch:PutMetricData",
"ec2:DescribeVolumes",
"ec2:DescribeTags",
"logs:PutLogEvents",
"logs:CreateLogGroup",
"logs:CreateLogStream"
]
Resource = "\*"
}
]
})
}

resource "aws_iam_instance_profile" "ec2_profile_secondary" {
provider = aws.secondary
name = "${var.environment}-ec2-profile-secondary"
role = aws_iam_role.ec2_role_secondary.name

tags = local.common_tags
}

# Launch Template - Secondary Region

resource "aws_launch_template" "secondary" {
provider = aws.secondary
name = "${var.environment}-lt-secondary"
image_id = data.aws_ami.amazon_linux_west.id
instance_type = var.instance_type
key_name = var.key_pair_name

vpc_security_group_ids = [aws_security_group.web_secondary.id]

iam_instance_profile {
name = aws_iam_instance_profile.ec2_profile_secondary.name
}

user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Create a simple web page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Region HA App - Secondary</title>
    </head>
    <body>
        <h1>Welcome to Multi-Region HA Application</h1>
        <h2>Secondary Region: us-west-2</h2>
        <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        <p>Timestamp: $(date)</p>
    </body>
    </html>

HTML

    # Health check endpoint
    cat > /var/www/html/health << 'HEALTH'
    OK

HEALTH

    # Configure CloudWatch monitoring
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux

EOF
)

tag_specifications {
resource_type = "instance"
tags = merge(local.common_tags, {
Name = "${var.environment}-web-instance-secondary"
})
}

tags = merge(local.common_tags, {
Name = "${var.environment}-launch-template-secondary"
})
}

# Application Load Balancer - Secondary Region

resource "aws_lb" "secondary" {
provider = aws.secondary
name = "${var.environment}-alb-secondary"
internal = false
load_balancer_type = "application"
security_groups = [aws_security_group.alb_secondary.id]
subnets = aws_subnet.public_secondary[*].id

enable_deletion_protection = false
enable_cross_zone_load_balancing = true
