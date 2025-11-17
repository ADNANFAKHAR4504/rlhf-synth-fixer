# E-Commerce Web Application Infrastructure

This solution provides a complete Terraform configuration for deploying a highly available e-commerce web application infrastructure in AWS. The infrastructure includes VPC networking, Application Load Balancer, Auto Scaling Group, RDS MySQL database, S3 with CloudFront, and comprehensive monitoring.

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
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
  default     = "ecommerce"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
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

variable "acm_certificate_arn" {
  description = "ARN of pre-validated ACM certificate in us-east-1"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

variable "db_engine_version" {
  description = "RDS MySQL engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "ecommercedb"
}

variable "cpu_scale_up_threshold" {
  description = "CPU percentage threshold for scaling up"
  type        = number
  default     = 70
}

variable "cpu_scale_down_threshold" {
  description = "CPU percentage threshold for scaling down"
  type        = number
  default     = 30
}
```

## File: lib/networking.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gw-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: lib/security_groups.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  description = "Allow HTTPS from anywhere"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ec2" {
  security_group_id = aws_security_group.alb.id

  referenced_security_group_id = aws_security_group.ec2.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
  description                  = "Allow HTTP to EC2 instances"
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ec2-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ec2_from_alb" {
  security_group_id = aws_security_group.ec2.id

  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 80
  to_port                      = 80
  ip_protocol                  = "tcp"
  description                  = "Allow HTTP from ALB"
}

resource "aws_vpc_security_group_egress_rule" "ec2_to_internet" {
  security_group_id = aws_security_group.ec2.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  description = "Allow HTTPS to internet"
}

resource "aws_vpc_security_group_egress_rule" "ec2_to_rds" {
  security_group_id = aws_security_group.ec2.id

  referenced_security_group_id = aws_security_group.rds.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  description                  = "Allow MySQL to RDS"
}

resource "aws_vpc_security_group_egress_rule" "ec2_to_s3" {
  security_group_id = aws_security_group.ec2.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
  description = "Allow HTTPS for S3 access"
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-${var.environment_suffix}-"
  description = "Security group for RDS MySQL"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2" {
  security_group_id = aws_security_group.rds.id

  referenced_security_group_id = aws_security_group.ec2.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
  description                  = "Allow MySQL from EC2"
}

resource "aws_vpc_security_group_egress_rule" "rds_deny_all" {
  security_group_id = aws_security_group.rds.id

  cidr_ipv4   = "127.0.0.1/32"
  ip_protocol = "-1"
  description = "Deny all egress"
}
```

## File: lib/iam.tf

```hcl
# EC2 IAM Role
resource "aws_iam_role" "ec2" {
  name_prefix = "ec2-role-${var.environment_suffix}-"

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

  tags = {
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# S3 Access Policy
resource "aws_iam_role_policy" "s3_access" {
  name_prefix = "s3-access-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Logs Policy
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name_prefix = "cloudwatch-logs-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      }
    ]
  })
}

# CloudWatch Metrics Policy
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name_prefix = "cloudwatch-metrics-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "ECommerce/Application"
          }
        }
      }
    ]
  })
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "ec2-profile-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name = "ec2-profile-${var.environment_suffix}"
  }
}
```

## File: lib/compute.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "alb-${var.environment_suffix}"
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name_prefix = "tg-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "target-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = {
    Name = "https-listener-${var.environment_suffix}"
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region      = var.aws_region
    bucket_name = aws_s3_bucket.static_assets.id
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "ec2-instance-${var.environment_suffix}"
    }
  }

  tags = {
    Name = "launch-template-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name_prefix         = "asg-${var.environment_suffix}-"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "asg-${var.environment_suffix}"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up-${var.environment_suffix}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_scale_up_threshold

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_description = "Scale up when CPU exceeds ${var.cpu_scale_up_threshold}%"
  alarm_actions     = [aws_autoscaling_policy.scale_up.arn]

  tags = {
    Name = "cpu-high-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "cpu-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_scale_down_threshold

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_description = "Scale down when CPU falls below ${var.cpu_scale_down_threshold}%"
  alarm_actions     = [aws_autoscaling_policy.scale_down.arn]

  tags = {
    Name = "cpu-low-alarm-${var.environment_suffix}"
  }
}
```

## File: lib/database.tf

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "rds-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "rds-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "rds-subnet-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name_prefix = "rds-params-${var.environment_suffix}-"
  family      = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = {
    Name = "rds-parameter-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier = "rds-${var.environment_suffix}"

  engine               = "mysql"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id           = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = null
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name = "rds-mysql-${var.environment_suffix}"
  }
}
```

## File: lib/storage.tf

```hcl
# S3 Bucket for Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket = "static-assets-${var.environment_suffix}"

  tags = {
    Name = "static-assets-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "oac-${var.environment_suffix}"
  description                       = "Origin Access Control for S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.environment_suffix}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static_assets.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "cloudfront-${var.environment_suffix}"
  }
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}
```

## File: lib/monitoring.tf

```hcl
# CloudWatch Alarm - ALB Unhealthy Hosts
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "alb-unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  alarm_description = "Alert when ALB has unhealthy targets"
  treat_missing_data = "notBreaching"

  tags = {
    Name = "alb-unhealthy-hosts-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_description = "Alert when RDS CPU exceeds 80%"

  tags = {
    Name = "rds-cpu-high-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - RDS Free Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "rds-storage-low-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB in bytes

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_description = "Alert when RDS free storage is below 10GB"

  tags = {
    Name = "rds-storage-low-${var.environment_suffix}"
  }
}

# CloudWatch Alarm - ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "alb-response-time-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.0

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_description = "Alert when ALB target response time exceeds 1 second"

  tags = {
    Name = "alb-response-time-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for Application Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/ecommerce-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "app-logs-${var.environment_suffix}"
  }
}
```

## File: lib/outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution domain name"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = aws_s3_bucket.static_assets.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}
```

## File: lib/user_data.sh

```bash
#!/bin/bash
set -e

# Update system packages
dnf update -y

# Install required packages
dnf install -y \
    amazon-cloudwatch-agent \
    aws-cli \
    docker \
    git \
    mysql

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/ecommerce-${region}",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/application.log",
            "log_group_name": "/aws/ec2/ecommerce-${region}",
            "log_stream_name": "{instance_id}/application"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "ECommerce/Application",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "disk_used_percent"}
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple health check endpoint
cat > /opt/app/health-server.py <<'PYTHON'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'status': 'healthy', 'service': 'ecommerce'}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Log to application log file
        with open('/var/log/application.log', 'a') as f:
            f.write(f"{self.address_string()} - [{self.log_date_time_string()}] {format%args}\n")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 80), HealthCheckHandler)
    print('Starting health check server on port 80...')
    server.serve_forever()
PYTHON

# Install Python (AL2023 comes with Python 3.9)
dnf install -y python3-pip

# Create systemd service for health check
cat > /etc/systemd/system/health-server.service <<EOF
[Unit]
Description=Health Check Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/health-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start the health check service
systemctl daemon-reload
systemctl start health-server
systemctl enable health-server

# Log successful initialization
echo "User data script completed successfully" >> /var/log/user-data.log
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this file to terraform.tfvars and fill in your values

aws_region         = "us-east-1"
environment        = "production"
project_name       = "ecommerce"
environment_suffix = "prod-abc123"  # REQUIRED: Unique suffix for resource naming

# Network Configuration
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# ACM Certificate (must be pre-validated in us-east-1)
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Compute Configuration
instance_type        = "t3.medium"
asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

# Database Configuration
db_engine_version     = "8.0.35"
db_instance_class     = "db.t3.medium"
db_allocated_storage  = 100
db_username           = "admin"
db_password           = "ChangeMe123!SecurePassword"  # Use AWS Secrets Manager in production
db_name               = "ecommercedb"

# Auto Scaling Configuration
cpu_scale_up_threshold   = 70
cpu_scale_down_threshold = 30
```

## File: lib/README.md

```markdown
# E-Commerce Web Application Infrastructure

This Terraform configuration deploys a highly available e-commerce web application infrastructure on AWS with the following components:

## Architecture Overview

- **VPC**: Custom VPC with 3 public and 3 private subnets across 3 availability zones
- **Application Load Balancer**: HTTPS-enabled ALB in public subnets for traffic distribution
- **Auto Scaling Group**: EC2 instances (Amazon Linux 2023, t3.medium) in private subnets with CPU-based scaling
- **RDS MySQL**: Multi-AZ MySQL 8.0 database with encryption at rest and automated backups
- **S3 + CloudFront**: S3 bucket for static assets with CloudFront CDN for global content delivery
- **Security Groups**: Least-privilege security groups controlling traffic flow
- **IAM Roles**: EC2 instance profiles with S3 and CloudWatch access
- **CloudWatch**: Alarms for ALB target health and RDS CPU utilization
- **NAT Gateways**: Outbound internet access for private instances

## Prerequisites

1. **Terraform**: Version 1.5 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **ACM Certificate**: Pre-validated SSL certificate in us-east-1
4. **AWS Account**: With necessary permissions to create resources

## Quick Start

### 1. Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and provide:
- `environment_suffix`: Unique suffix for resource naming (REQUIRED)
- `acm_certificate_arn`: Your pre-validated ACM certificate ARN (REQUIRED)
- `db_password`: Secure database password (REQUIRED)

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

When prompted, review the changes and type `yes` to proceed.

### 5. Access Outputs

After successful deployment:

```bash
terraform output alb_dns_name
terraform output cloudfront_distribution_url
terraform output rds_endpoint
```

## Architecture Details

### Network Configuration

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Availability Zones**: Uses first 3 available AZs in the region

### Security Groups

1. **ALB Security Group**:
   - Ingress: HTTPS (443) from 0.0.0.0/0
   - Egress: HTTP (80) to EC2 instances

2. **EC2 Security Group**:
   - Ingress: HTTP (80) from ALB
   - Egress: HTTPS (443) to internet, MySQL (3306) to RDS

3. **RDS Security Group**:
   - Ingress: MySQL (3306) from EC2 instances
   - Egress: Denied

### Auto Scaling Configuration

- **Scaling Policy**: CPU-based scaling at 70% threshold
- **Min Size**: 2 instances
- **Max Size**: 10 instances
- **Health Check**: ELB health check with 5-minute grace period
- **Instance Metadata**: IMDSv2 required for enhanced security

### Database Configuration

- **Engine**: MySQL 8.0.35
- **Instance Class**: db.t3.medium
- **Storage**: 100 GB GP3 with encryption
- **Multi-AZ**: Enabled for high availability
- **Backups**: 7-day retention with automated daily backups
- **Encryption**: AWS KMS encryption at rest

### Storage and CDN

- **S3 Bucket**: Versioning enabled, public access blocked
- **CloudFront**: Global CDN with HTTPS redirect
- **Origin Access Control**: Secure S3 access from CloudFront only

### Monitoring and Alarms

1. **ALB Unhealthy Hosts**: Alerts when targets are unhealthy
2. **RDS CPU High**: Alerts when CPU exceeds 80%
3. **RDS Storage Low**: Alerts when free storage < 10GB
4. **ALB Response Time**: Alerts when response time > 1 second
5. **ASG CPU High/Low**: Triggers auto-scaling actions

## Resource Naming Convention

All resources use the `environment_suffix` variable for unique naming:
- VPC: `vpc-${environment_suffix}`
- ALB: `alb-${environment_suffix}`
- ASG: `asg-${environment_suffix}`
- RDS: `rds-${environment_suffix}`
- S3: `static-assets-${environment_suffix}`

## Cost Optimization

The infrastructure is designed for cost efficiency:
- NAT Gateways: $0.045/hour × 3 = ~$97/month
- ALB: ~$22/month + data processing
- EC2 (t3.medium): 2-10 instances based on demand
- RDS (db.t3.medium): Multi-AZ ~$120/month
- CloudFront: Pay-per-use for data transfer

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: RDS is configured with `skip_final_snapshot = true` for easy cleanup.

## Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `environment_suffix` | Unique suffix for resource naming | - | Yes |
| `acm_certificate_arn` | ACM certificate ARN | - | Yes |
| `db_password` | Database master password | - | Yes |
| `aws_region` | AWS region | us-east-1 | No |
| `vpc_cidr` | VPC CIDR block | 10.0.0.0/16 | No |
| `instance_type` | EC2 instance type | t3.medium | No |
| `asg_min_size` | Min ASG size | 2 | No |
| `asg_max_size` | Max ASG size | 10 | No |
| `db_instance_class` | RDS instance class | db.t3.medium | No |

## Outputs

| Output | Description |
|--------|-------------|
| `alb_dns_name` | Application Load Balancer DNS name |
| `cloudfront_distribution_url` | CloudFront distribution URL |
| `rds_endpoint` | RDS MySQL endpoint |
| `vpc_id` | VPC ID |
| `s3_bucket_name` | S3 bucket name |

## Security Best Practices

1. **IMDSv2**: All EC2 instances require IMDSv2
2. **Encryption**: RDS uses KMS encryption, S3 uses AES256
3. **Least Privilege**: IAM policies use specific resource ARNs
4. **Network Isolation**: Private subnets for compute and database
5. **HTTPS Only**: ALB uses HTTPS, CloudFront redirects to HTTPS
6. **Secrets**: Use AWS Secrets Manager for production passwords

## Troubleshooting

### Issue: Terraform fails with "InvalidParameterValue"
- **Solution**: Verify ACM certificate is in us-east-1 and validated

### Issue: RDS instance creation fails
- **Solution**: Check db_password meets complexity requirements (8+ chars, mixed case, numbers)

### Issue: Health checks failing
- **Solution**: Verify security group rules and /health endpoint is responding

### Issue: Auto Scaling not working
- **Solution**: Check CloudWatch alarms and ASG policies are created

## Support

For issues or questions:
1. Check AWS CloudWatch logs: `/aws/ec2/ecommerce-${environment_suffix}`
2. Review Terraform state: `terraform show`
3. Verify resource health in AWS Console

## License

This infrastructure code is provided as-is for educational and production use.
```
