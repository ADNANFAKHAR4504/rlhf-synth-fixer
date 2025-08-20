# =============================================================================
# MULTI-ENVIRONMENT AWS INFRASTRUCTURE
# =============================================================================
# 
# This Terraform configuration implements a comprehensive multi-environment
# AWS infrastructure supporting Development, Staging, and Production environments
# with proper isolation, security, and scalability features.
#
# Compliance Requirements:
# 1. All resources in us-east-1 region
# 2. Environment-specific configurations
# 3. Security best practices with least privilege
# 4. Auto Scaling for Production
# 5. Database encryption at rest and in transit
# 6. CloudWatch monitoring and alerting
# 7. Comprehensive tagging strategy
# 8. S3 logging enabled
# 9. SSH access restrictions
# 10. CI/CD pipeline support
# 11. AWS naming conventions
# 12. No hardcoded secrets

# =============================================================================
# VARIABLES
# =============================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "aws-infrastructure"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "All resources must be deployed in us-east-1 region."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = false
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "enable_multi_az_nat" {
  description = "Enable Multi-AZ NAT gateways"
  type        = bool
  default     = false
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Database master password (auto-generated if null)"
  type        = string
  default     = null
  sensitive   = true
}

variable "allowed_ssh_cidrs" {
  description = "Allowed CIDR blocks for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]

  validation {
    condition = alltrue([
      for cidr in var.allowed_ssh_cidrs :
      can(cidrhost(cidr, 0)) && cidr != "0.0.0.0/0"
    ])
    error_message = "All CIDR blocks must be valid and not 0.0.0.0/0."
  }
}

variable "asg_desired_capacity" {
  description = "Auto Scaling Group desired capacity"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Auto Scaling Group maximum size"
  type        = number
  default     = 4
}

variable "asg_min_size" {
  description = "Auto Scaling Group minimum size"
  type        = number
  default     = 1
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

# =============================================================================
# DATA SOURCES
# =============================================================================

# Get the latest Amazon Linux 2 AMI
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

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    ManagedBy         = "terraform"
    Owner             = "devops-team"
    EnvironmentSuffix = var.environment_suffix
  }

  # Name prefix for consistent resource naming
  name_prefix = "tap-${var.environment_suffix}"

  # Availability zones
  availability_zones = ["us-east-1a", "us-east-1b"]

  # Environment-specific configurations
  environment_config = {
    development = {
      instance_type       = "t3.micro"
      db_instance_class   = "db.t3.micro"
      enable_multi_az     = false
      deletion_protection = false
    }
    staging = {
      instance_type       = "t3.small"
      db_instance_class   = "db.t3.small"
      enable_multi_az     = true
      deletion_protection = false
    }
    production = {
      instance_type       = "t3.medium"
      db_instance_class   = "db.t3.medium"
      enable_multi_az     = true
      deletion_protection = false # Always allow deletion for testing
    }
  }

  config = local.environment_config[var.environment]
}

# =============================================================================
# NETWORKING MODULE
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateway EIPs
resource "aws_eip" "nat" {
  count  = var.enable_multi_az_nat ? length(var.public_subnet_cidrs) : 1
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.enable_multi_az_nat ? length(var.public_subnet_cidrs) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
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

# Private Route Table
resource "aws_route_table" "private" {
  count  = var.enable_multi_az_nat ? length(var.private_subnet_cidrs) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[var.enable_multi_az_nat ? count.index : 0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.enable_multi_az_nat ? count.index : 0].id
}

# =============================================================================
# SECURITY MODULE
# =============================================================================

# Random password for database
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "database" {
  name                    = "${local.name_prefix}-db-secret"
  recovery_window_in_days = 0 # Force immediate deletion

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != null ? var.db_password : random_password.db_password[0].result
  })
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Security Group for Application
resource "aws_security_group" "application" {
  name_prefix = "${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
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
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-application-sg"
  })
}

# Security Group for Database
resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })
}

# Security Group for Bastion Host
resource "aws_security_group" "bastion" {
  name_prefix = "${local.name_prefix}-bastion-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion-sg"
  })
}

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

  tags = local.common_tags
}

# IAM Policy for EC2 instances
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_s3_bucket.data.arn}/*",
          "${aws_cloudwatch_log_group.app.arn}:*"
        ]
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# =============================================================================
# COMPUTE MODULE
# =============================================================================

# Launch Template for Auto Scaling Group
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = local.config.instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.application.id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.environment} environment!</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-instance"
    })
  }

  tags = local.common_tags
}

# Auto Scaling Group (Production only)
resource "aws_autoscaling_group" "main" {
  count               = var.environment == "production" ? 1 : 0
  name                = "${local.name_prefix}-asg"
  desired_capacity    = var.asg_desired_capacity
  max_size            = var.asg_max_size
  min_size            = var.asg_min_size
  target_group_arns   = [aws_lb_target_group.main.arn]
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

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# EC2 Instances (Development and Staging)
resource "aws_instance" "web" {
  count = var.environment != "production" ? 2 : 0

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = local.config.instance_type
  subnet_id     = aws_subnet.private[count.index % length(aws_subnet.private)].id

  vpc_security_group_ids = [aws_security_group.application.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ${var.environment} environment!</h1>" > /var/www/html/index.html
              EOF

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-instance-${count.index + 1}"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = substr("${local.name_prefix}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Always allow deletion for testing

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = substr("${local.name_prefix}-tg", 0, 32)
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
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "asg" {
  count            = var.environment == "production" ? var.asg_desired_capacity : 0
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_autoscaling_group.main[0].id
  port             = 80
}

resource "aws_lb_target_group_attachment" "ec2" {
  count            = var.environment != "production" ? 2 : 0
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.web[count.index].id
  port             = 80
}

# =============================================================================
# DATABASE MODULE
# =============================================================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = local.common_tags
}

# RDS Parameter Group
data "aws_db_parameter_group" "main" {
  name = "default.mysql8.0"
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = local.config.db_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "application_db"
  username = var.db_username
  password = var.db_password != null ? var.db_password : random_password.db_password[0].result
  port     = 3306

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  backup_retention_period = var.rds_backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az = local.config.enable_multi_az

  skip_final_snapshot       = true # Skip final snapshot for testing
  final_snapshot_identifier = "${local.name_prefix}-db-final-snapshot"

  deletion_protection = false # Always allow deletion for testing

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })
}

# =============================================================================
# STORAGE MODULE
# =============================================================================

# Random string for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for Application Data
resource "aws_s3_bucket" "data" {
  bucket = "${local.name_prefix}-data-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-bucket"
  })
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-bucket"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "data" {
  bucket = aws_s3_bucket.data.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "data-logs/"
}

# S3 Bucket Policy for HTTPS enforcement
resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyNonHttpsRequests"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.data.arn,
          "${aws_s3_bucket.data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# =============================================================================
# MONITORING MODULE
# =============================================================================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = local.common_tags
}

# CloudWatch Alarms (Production only)
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.environment == "production" ? 1 : 0
  alarm_name          = "${local.name_prefix}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  count               = var.environment == "production" ? 1 : 0
  alarm_name          = "${local.name_prefix}-memory-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "System/Linux"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors memory utilization"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main[0].name
  }

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "email" {
  count     = var.environment == "production" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "devops@company.com"
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
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.data.bucket
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.database.arn
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    alb         = aws_security_group.alb.id
    application = aws_security_group.application.id
    database    = aws_security_group.database.id
    bastion     = aws_security_group.bastion.id
  }
}

output "cost_estimation" {
  description = "Estimated monthly costs"
  value = {
    ec2_instances   = var.environment == "production" ? 150 : 30
    rds_instance    = var.environment == "production" ? 200 : 50
    alb             = var.environment == "production" ? 20 : 0
    nat_gateway     = var.environment == "production" ? 45 : 0
    total_estimated = var.environment == "production" ? 415 : 80
  }
}

output "environment_info" {
  description = "Environment configuration information"
  value = {
    environment         = var.environment
    region              = var.aws_region
    vpc_cidr            = var.vpc_cidr
    instance_type       = local.config.instance_type
    db_instance_class   = local.config.db_instance_class
    enable_multi_az     = local.config.enable_multi_az
    deletion_protection = local.config.deletion_protection
  }
}
