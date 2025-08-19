# Terraform Infrastructure for Production Web Application

## Solution Overview

This solution provides a highly available, secure, and scalable cloud infrastructure using Terraform for hosting a production web application in AWS us-west-2 region. The infrastructure meets all specified requirements including multi-AZ deployment, auto-scaling, comprehensive security controls, and S3 logging.

## Infrastructure Implementation

### provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

### tap_stack.tf
```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in auto-scaling group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in auto-scaling group"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in auto-scaling group"
  type        = number
  default     = 3
}

variable "scale_up_threshold" {
  description = "CPU utilization threshold for scale up"
  type        = number
  default     = 70
}

variable "scale_down_threshold" {
  description = "CPU utilization threshold for scale down"
  type        = number
  default     = 30
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

########################
# Data Sources
########################

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

########################
# VPC Configuration
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "vpc-production-${var.environment_suffix}"
    }
  )
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "igw-production-${var.environment_suffix}"
    }
  )
}

########################
# Subnets
########################

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "public-subnet-${count.index + 1}-production-${var.environment_suffix}"
      Type = "Public"
    }
  )
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "private-subnet-${count.index + 1}-production-${var.environment_suffix}"
      Type = "Private"
    }
  )
}

########################
# NAT Gateway
########################

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "nat-eip-${count.index + 1}-production-${var.environment_suffix}"
    }
  )
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "nat-gateway-${count.index + 1}-production-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

########################
# Route Tables
########################

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "public-rt-production-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "private-rt-${count.index + 1}-production-${var.environment_suffix}"
    }
  )
}

resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

########################
# Security Groups
########################

resource "aws_security_group" "alb" {
  name        = "alb-sg-production-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "alb-sg-production-${var.environment_suffix}"
    }
  )
}

resource "aws_security_group" "ec2" {
  name        = "ec2-sg-production-${var.environment_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "ec2-sg-production-${var.environment_suffix}"
    }
  )
}

########################
# S3 Buckets with Logging
########################

resource "aws_s3_bucket" "app_logs" {
  bucket        = "app-logs-production-${var.environment_suffix}"
  force_destroy = true

  tags = merge(
    var.common_tags,
    {
      Name = "app-logs-production-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket" "alb_logs" {
  bucket        = "alb-logs-production-${var.environment_suffix}"
  force_destroy = true

  tags = merge(
    var.common_tags,
    {
      Name = "alb-logs-production-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_logging" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  target_bucket = aws_s3_bucket.app_logs.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_logging" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  target_bucket = aws_s3_bucket.alb_logs.id
  target_prefix = "access-logs/"
}

resource "aws_s3_bucket_public_access_block" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

########################
# Application Load Balancer
########################

resource "aws_lb" "main" {
  name               = "alb-production-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = merge(
    var.common_tags,
    {
      Name = "alb-production-${var.environment_suffix}"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "tg-production-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "tg-production-${var.environment_suffix}"
    }
  )
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

########################
# Launch Template
########################

resource "aws_launch_template" "main" {
  name_prefix   = "lt-production-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Production Environment - Instance $(hostname -f)</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.common_tags,
      {
        Name = "ec2-production-${var.environment_suffix}"
      }
    )
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(
      var.common_tags,
      {
        Name = "ebs-production-${var.environment_suffix}"
      }
    )
  }
}

########################
# Auto Scaling Group
########################

resource "aws_autoscaling_group" "main" {
  name                      = "asg-production-${var.environment_suffix}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-instance-production-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Production"
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "Terraform"
    propagate_at_launch = true
  }
}

########################
# Auto Scaling Policies
########################

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up-production-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down-production-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

########################
# CloudWatch Alarms
########################

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "cpu-high-production-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.scale_up_threshold
  alarm_description   = "This metric monitors EC2 cpu utilization for scale up"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "cpu-low-production-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = var.scale_down_threshold
  alarm_description   = "This metric monitors EC2 cpu utilization for scale down"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}

########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "app_logs_bucket" {
  description = "Name of the application logs S3 bucket"
  value       = aws_s3_bucket.app_logs.bucket
}

output "alb_logs_bucket" {
  description = "Name of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
```

## Requirements Compliance

✅ **VPC across multiple availability zones**: 3 AZs in us-west-2  
✅ **Environment tagging**: All resources tagged with 'Environment: Production'  
✅ **S3 logging enabled**: All buckets have logging configured  
✅ **Terraform version**: Requires >= 1.4.0 (exceeds 1.1.0 requirement)  
✅ **High availability**: Multi-AZ deployment with auto-scaling  
✅ **Security groups**: Restrictive rules allowing only necessary ports  
✅ **us-west-2 region**: Configured as default  
✅ **Auto-scaling**: Based on CPU demand with CloudWatch integration  
✅ **Production naming**: Resources use '-production' suffix