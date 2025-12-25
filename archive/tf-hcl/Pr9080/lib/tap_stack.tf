# =============================================================================
# AWS INFRASTRUCTURE SETUP WITH TERRAFORM
# =============================================================================
# This configuration creates a production-ready AWS environment with:
# 1. VPC with public and private subnets across multiple AZs
# 2. NAT Gateways with Elastic IPs for private subnet internet access
# 3. Application Load Balancer with health checks
# 4. Auto Scaling Group with CPU-based scaling policies
# 5. Security Groups for ALB and EC2 instances
# 6. CloudWatch alarms for monitoring and scaling
# 7. Proper resource tagging and naming conventions
# 8. Cost estimation and monitoring
# =============================================================================

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tap-stack"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (empty for latest Amazon Linux 2)"
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 4
}

variable "max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 10
}

variable "cpu_high_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 80
}

variable "cpu_low_threshold" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 20
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

variable "enable_alb" {
  description = "Enable Application Load Balancer (set to false for LocalStack compatibility)"
  type        = bool
  default     = false
}

variable "enable_asg" {
  description = "Enable Auto Scaling Group (set to false for LocalStack compatibility)"
  type        = bool
  default     = false
}

# =============================================================================
# LOCAL VALUES
# =============================================================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = "DevOps Team"
    CostCenter  = "Engineering"
  }

  # Resource naming conventions
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  # Short name prefix for resources with length restrictions
  short_name_prefix = "tap-${var.environment_suffix}"
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_ami" "latest_amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# =============================================================================
# NETWORKING MODULE
# =============================================================================

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# =============================================================================
# SECURITY MODULE
# =============================================================================

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-sg-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-sg-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })
}

# =============================================================================
# IAM MODULE
# =============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# =============================================================================
# COMPUTE MODULE
# =============================================================================

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt"
  image_id      = var.ami_id != "" ? var.ami_id : data.aws_ami.latest_amazon_linux.id
  instance_type = var.instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.ec2.id]
  }

  user_data = base64encode(<<-EOF
        #!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Welcome to ${var.project_name}</h1><p>Instance: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html
        echo "User data completed" >> /var/log/user-data.log
        EOF
  )

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-launch-template"
  })
}

# Application Load Balancer
# Note: LocalStack Community Edition does NOT support ELBv2 (ALB/NLB)
# These resources are conditionally created based on enable_alb variable
# Set enable_alb = true for AWS deployment, false for LocalStack
resource "aws_lb" "main" {
  count              = var.enable_alb ? 1 : 0
  name               = "${local.short_name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# Target Group
# Conditionally created - not supported in LocalStack Community Edition
resource "aws_lb_target_group" "main" {
  count    = var.enable_alb ? 1 : 0
  name     = "${local.short_name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-target-group"
  })
}

# ALB Listener
# Conditionally created - not supported in LocalStack Community Edition
resource "aws_lb_listener" "main" {
  count             = var.enable_alb ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main[0].arn
  }
}

# Auto Scaling Group
# Conditionally created - not supported in LocalStack Community Edition
resource "aws_autoscaling_group" "main" {
  count               = var.enable_asg ? 1 : 0
  name                = "${local.name_prefix}-asg"
  desired_capacity    = var.desired_capacity
  max_size            = var.max_size
  min_size            = var.min_size
  target_group_arns   = var.enable_alb ? [aws_lb_target_group.main[0].arn] : []
  vpc_zone_identifier = aws_subnet.private[*].id

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
}

# =============================================================================
# MONITORING AND SCALING MODULE
# =============================================================================

# Auto Scaling Policy - Scale Up
# Conditionally created - depends on ASG which is not supported in LocalStack
resource "aws_autoscaling_policy" "scale_up" {
  count                  = var.enable_asg ? 1 : 0
  name                   = "${local.name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main[0].name
}

# Auto Scaling Policy - Scale Down
# Conditionally created - depends on ASG which is not supported in LocalStack
resource "aws_autoscaling_policy" "scale_down" {
  count                  = var.enable_asg ? 1 : 0
  name                   = "${local.name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main[0].name
}

# CloudWatch Alarm - High CPU
# Disabled for LocalStack - CloudWatch Alarms and ASG not supported in Community Edition
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.enable_asg ? 1 : 0
  alarm_name          = "${local.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_high_threshold
  alarm_description   = "Scale up if CPU > ${var.cpu_high_threshold}% for 4 minutes"
  alarm_actions       = [aws_autoscaling_policy.scale_up[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = false
  }
}

# CloudWatch Alarm - Low CPU
# Disabled for LocalStack - CloudWatch Alarms and ASG not supported in Community Edition
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count               = var.enable_asg ? 1 : 0
  alarm_name          = "${local.name_prefix}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.cpu_low_threshold
  alarm_description   = "Scale down if CPU < ${var.cpu_low_threshold}% for 4 minutes"
  alarm_actions       = [aws_autoscaling_policy.scale_down[0].arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = false
  }
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = var.enable_alb ? aws_lb.main[0].dns_name : "ALB disabled for LocalStack"
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = var.enable_alb ? aws_lb.main[0].arn : "ALB disabled for LocalStack"
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = var.enable_asg ? aws_autoscaling_group.main[0].name : "ASG disabled for LocalStack"
}

output "nat_gateway_ips" {
  description = "NAT Gateway Elastic IPs"
  value       = aws_eip.nat[*].public_ip
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb = aws_security_group.alb.id
    ec2 = aws_security_group.ec2.id
  }
}

output "cost_estimation" {
  description = "Estimated monthly cost breakdown"
  value = {
    vpc             = 0.00
    subnets         = 0.00
    nat_gateways    = length(aws_nat_gateway.main) * 45.00
    alb             = 16.20
    ec2_instances   = var.desired_capacity * 8.47
    total_estimated = (length(aws_nat_gateway.main) * 45.00) + 16.20 + (var.desired_capacity * 8.47)
  }
}
