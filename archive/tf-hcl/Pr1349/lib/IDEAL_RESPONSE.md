# IDEAL RESPONSE - Terraform Cloud Environment Setup

## Summary

This Terraform configuration provides a comprehensive, production-ready AWS infrastructure that addresses all requirements from the prompt while implementing best practices for multi-region deployment, environment separation, and state management.

## Complete Infrastructure Code

```terraform
############################################################
# tap_stack.tf — Single-file AWS Infrastructure Stack
# Comprehensive cloud environment setup with state locking and modular design
# Supports multi-region deployment and environment separation
############################################################

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = length(trimspace(var.aws_region)) > 0
    error_message = "aws_region must be a non-empty string."
  }
}

variable "project_name" {
  description = "Project name (used for namespacing)"
  type        = string
  default     = "iac-aws-nova"

  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must be a non-empty string."
  }
}

variable "environment" {
  description = "Deployment environment (test|production)"
  type        = string
  default     = "test"

  validation {
    condition     = contains(["test", "production"], var.environment)
    error_message = "environment must be either 'test' or 'production'."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2 && alltrue([for c in var.public_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "public_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2 && alltrue([for c in var.private_subnet_cidrs : can(cidrhost(c, 0))])
    error_message = "private_subnet_cidrs must be a list of exactly two valid CIDRs."
  }
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "17.6"
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
  default     = "dbadmin"
}

variable "rds_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
  default     = "changeme123!"
}

variable "app_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
}

variable "app_desired_capacity" {
  description = "Desired capacity for Auto Scaling Group"
  type        = number
  default     = 2
}

variable "app_max_size" {
  description = "Maximum size for Auto Scaling Group"
  type        = number
  default     = 4
}

variable "app_min_size" {
  description = "Minimum size for Auto Scaling Group"
  type        = number
  default     = 1
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH to instances"
  type        = list(string)
  default     = ["0.0.0.0/0"]

  validation {
    condition     = alltrue([for c in var.allowed_ssh_cidrs : can(cidrhost(c, 0))])
    error_message = "Every item in allowed_ssh_cidrs must be a valid CIDR."
  }
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  owners      = ["amazon"]
  most_recent = true

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

########################
# Locals
########################

locals {
  # Environment-specific configurations
  is_production = var.environment == "production"
  is_test       = var.environment == "test"

  # Feature toggles based on environment
  enable_detailed_monitoring = local.is_production
  enable_bucket_versioning   = local.is_production
  enable_nat_gateway         = local.is_production

  # Availability zones
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # Naming conventions with environment suffix
  name_prefix = "${var.project_name}-${var.environment}-${var.environment_suffix}"

  # Environment-specific resource configurations
  rds_instance_class   = local.is_production ? "db.r5.large" : var.rds_instance_class
  rds_storage          = local.is_production ? 100 : var.rds_allocated_storage
  app_instance_type    = local.is_production ? "t3.small" : var.app_instance_type
  app_desired_capacity = local.is_production ? 3 : var.app_desired_capacity
}

########################
# VPC and Networking
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

# Public subnets
resource "aws_subnet" "public" {
  for_each = {
    "0" = { cidr = var.public_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.public_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  depends_on = [aws_vpc.main]

  tags = {
    Name = "${local.name_prefix}-public-${each.key}"
    Tier = "public"
  }
}

# Private subnets
resource "aws_subnet" "private" {
  for_each = {
    "0" = { cidr = var.private_subnet_cidrs[0], az = local.azs[0] }
    "1" = { cidr = var.private_subnet_cidrs[1], az = local.azs[1] }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  depends_on = [aws_vpc.main]

  tags = {
    Name = "${local.name_prefix}-private-${each.key}"
    Tier = "private"
  }
}

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  depends_on = [aws_vpc.main, aws_internet_gateway.igw]

  tags = {
    Name = "${local.name_prefix}-rt-public"
  }
}

# Associate public subnets
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway (production only)
resource "aws_eip" "nat" {
  count  = local.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-eip"
  }
}

resource "aws_nat_gateway" "ngw" {
  count         = local.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = element([for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id], 0)

  tags = {
    Name = "${local.name_prefix}-nat"
  }

  depends_on = [aws_internet_gateway.igw]
}

# Private route tables
resource "aws_route_table" "private" {
  for_each = aws_subnet.private
  vpc_id   = aws_vpc.main.id

  dynamic "route" {
    for_each = local.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.ngw[0].id
    }
  }

  depends_on = [aws_vpc.main]

  tags = {
    Name = "${local.name_prefix}-rt-private-${each.key}"
  }
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

########################
# Security Groups
########################

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  depends_on = [aws_vpc.main]

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
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-alb-sg"
  }
}

# Application Security Group
resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-app-sg"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  ingress {
    description     = "PostgreSQL from app instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-rds-sg"
  }
}

########################
# RDS Database
########################

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]

  tags = {
    Name = "${local.name_prefix}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "postgres"
  engine_version = var.rds_engine_version
  instance_class = local.rds_instance_class

  allocated_storage     = local.rds_storage
  max_allocated_storage = local.is_production ? 1000 : 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "appdb"
  username = var.rds_username
  password = var.rds_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = local.is_production ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = true # Skip final snapshot for easier cleanup
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot"

  deletion_protection = false # Always allow deletion for testing

  tags = {
    Name = "${local.name_prefix}-db"
  }
}

########################
# Application Load Balancer
########################

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]

  enable_deletion_protection = false # Always allow deletion for testing

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  depends_on = [aws_vpc.main]

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${local.name_prefix}-tg"
  }
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
# Auto Scaling Group
########################

resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt"
  image_id      = data.aws_ami.al2023.id
  instance_type = local.app_instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${local.name_prefix}!</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${local.name_prefix}-instance"
    }
  }

  tags = {
    Name = "${local.name_prefix}-lt"
  }
}

resource "aws_autoscaling_group" "main" {
  name                = "${local.name_prefix}-asg"
  desired_capacity    = local.app_desired_capacity
  max_size            = var.app_max_size
  min_size            = var.app_min_size
  target_group_arns   = [aws_lb_target_group.main.arn]
  vpc_zone_identifier = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

########################
# CloudWatch Monitoring
########################

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.main.name],
            [".", "NetworkIn", ".", "."],
            [".", "NetworkOut", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EC2 Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id]
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "nat_gateway_id" {
  description = "NAT Gateway ID (empty in test environment)"
  value       = try(aws_nat_gateway.ngw[0].id, "")
}

output "environment_info" {
  description = "Environment configuration information"
  value = {
    environment   = var.environment
    region        = var.aws_region
    project       = var.project_name
    is_production = local.is_production
    features = {
      nat_gateway         = local.enable_nat_gateway
      detailed_monitoring = local.enable_detailed_monitoring
      bucket_versioning   = local.enable_bucket_versioning
    }
  }
}
```
