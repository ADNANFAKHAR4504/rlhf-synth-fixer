
I'll create a comprehensive Terraform script for an online education platform web application, following all the requirements. Let me break this down systematically:

1. First, I'll organize the variable declarations.
2. Then, I'll create the networking components (VPC, subnets, etc.)
3. Next, I'll set up security groups and IAM roles
4. Then the databases (RDS MySQL and ElastiCache Redis)
5. Followed by the application components (ALB, ASG, EC2 instances)
6. Finally, monitoring and security configurations

Let's begin:

```terraform
# Variables
variable "aws_region" {
  description = "AWS region (referenced from provider.tf)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "education-platform-team"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "online-education-platform"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for the application servers"
  type        = string
  default     = "t3.medium"
}

variable "ec2_key_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "education-platform-key"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "education_db"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = "arn:aws:acm:us-east-1:123456789012:certificate/abcdef12-3456-7890-abcd-ef1234567890"
}

variable "min_instances" {
  description = "Minimum number of EC2 instances in the ASG"
  type        = number
  default     = 2
}

variable "max_instances" {
  description = "Maximum number of EC2 instances in the ASG"
  type        = number
  default     = 10
}

# Data sources
data "aws_ami" "amazon_linux" {
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

data "aws_caller_identity" "current" {}

# Common tags for all resources
locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

###################
# Networking
###################

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-vpc"
    }
  )
}

# Public subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-subnet-${count.index + 1}"
      Tier = "Public"
    }
  )
}

# Private application subnets
resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = element(var.availability_zones, count.index)
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-app-subnet-${count.index + 1}"
      Tier = "Private-App"
    }
  )
}

# Private database subnets
resource "aws_subnet" "private_db" {
  count             = length(var.private_db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = element(var.availability_zones, count.index)
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-db-subnet-${count.index + 1}"
      Tier = "Private-DB"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-igw"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-eip-${count.index + 1}"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-gateway-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-route-table"
    }
  )
}

# Route table for private app subnets
resource "aws_route_table" "private_app" {
  count  = length(var.private_app_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-app-route-table-${count.index + 1}"
    }
  )
}

# Route table for private DB subnets
resource "aws_route_table" "private_db" {
  count  = length(var.private_db_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-db-route-table-${count.index + 1}"
    }
  )
}

# Associate route tables with public subnets
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate route tables with private app subnets
resource "aws_route_table_association" "private_app" {
  count          = length(var.private_app_subnet_cidrs)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Associate route tables with private DB subnets
resource "aws_route_table_association" "private_db" {
  count          = length(var.private_db_subnet_cidrs)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db[count.index].id
}

###################
# Security Groups
###################

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-alb-sg"
    }
  )
}

# Application Security Group
resource "aws_security_group" "app" {
  name        = "${var.project}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP access from ALB"
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS access from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-app-sg"
    }
  )
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.project}-db-sg"
  description = "Security group for database instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "MySQL access from application servers"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-db-sg"
    }
  )
}

# ElastiCache Security Group
resource "aws_security_group" "elasticache" {
  name        = "${var.project}-elasticache-sg"
  description = "Security group for ElastiCache instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Redis access from application servers"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-elasticache-sg"
    }
  )
}

###################
# IAM Roles and Policies
###################

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# IAM policy for EC2 instances
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.project}-ec2-policy"
  description = "Policy for EC2 instances to access required services"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Effect = "Allow",
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/*"
      }
    ]
  })
  
  tags = local.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

###################
# KMS Key for Encryption
###################

resource "aws_kms_key" "main" {
  description             = "${var.project} encryption key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-key"
  target_key_id = aws_kms_key.main.key_id
}

###################
# RDS MySQL
###################

resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  subnet_ids  = aws_subnet.private_db[*].id
  description = "Database subnet group for ${var.project}"
  
  tags = local.common_tags
}

resource "aws_db_parameter_group" "main" {
  name        = "${var.project}-db-param-group"
  family      = "mysql8.0"
  description = "Parameter group for ${var.project} RDS instances"
  
  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }
  
  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }
  
  tags = local.common_tags
}

resource "aws_db_instance" "main" {
  allocated_storage          = 20
  max_allocated_storage      = 100
  storage_type               = "gp2"
  engine                     = "mysql"
  engine_version             = "8.0"
  instance_class             = var.db_instance_class
  identifier                 = "${var.project}-db"
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = var.db_password
  db_subnet_group_name       = aws_db_subnet_group.main.name
  parameter_group_name       = aws_db_parameter_group.main.name
  multi_az                   = true
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.main.arn
  backup_retention_period    = var.db_backup_retention_period
  backup_window              = "03:00-04:00"
  maintenance_window         = "mon:04:00-mon:05:00"
  vpc_security_group_ids     = [aws_security_group.db.id]
  skip_final_snapshot        = false
  final_snapshot_identifier  = "${var.project}-db-final-snapshot"
  deletion_protection        = true
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  
  tags = local.common_tags
}

###################
# ElastiCache Redis
###################

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-elasticache-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id
  
  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project}-elasticache-param-group"
  family = "redis6.x"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project}-redis"
  description                = "Redis for session management"
  node_type                  = var.elasticache_node_type
  num_cache_clusters         = 2
  port                       = 6379
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.elasticache.id]
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = local.common_tags
}

###################
# Application Load Balancer
###################

resource "aws_lb" "main" {
  name               = "${var.project}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  
  access_logs {
    bucket  = aws_s3_bucket.lb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }
  
  tags = local.common_tags
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "lb_logs" {
  bucket = "${var.project}-alb-logs"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_lifecycle_configuration" "lb_logs" {
  bucket = aws_s3_bucket.lb_logs.id

  rule {
    id     = "log_lifecycle"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lb_logs" {
  bucket = aws_s3_bucket.lb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "lb_logs" {
  bucket = aws_s3_bucket.lb_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::elb-account-id:root"  # Replace with actual ELB account ID for your region
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.lb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      }
    ]
  })
}

# Target group for ALB
resource "aws_lb_target_group" "main" {
  name     = "${var.project}-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    matcher             = "200"
  }
  
  tags = local.common_tags
}

# HTTPS listener for ALB
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  
  tags = local.common_tags
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  
  tags = local.common_tags
}

###################
# WAF Configuration
###################

resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project}-web-acl"
  description = "Web ACL for ${var.project} ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-web-acl-metric"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

###################
# Auto Scaling Group
###################

resource "aws_launch_template" "main" {
  name_prefix   = "${var.project}-launch-template-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.ec2_instance_type
  key_name      = var.ec2_key_name
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
  }
  
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }
  
  monitoring {
    enabled = true
  }
  
  tag_specifications {
    resource_type = "instance"
    
    tags = merge(
      local.common_tags,
      {
        Name = "${var.project}-app-instance"
      }
    )
  }
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    
    # Install required packages
    yum update -y
    yum install -y amazon-cloudwatch-agent aws-xray-daemon
    
    # Start CloudWatch Agent
    systemctl start amazon-cloudwatch-agent
    systemctl enable amazon-cloudwatch-agent
    
    # Start X-Ray daemon
    systemctl start xray
    systemctl enable xray
    
    # Install application dependencies
    # (This would be customized based on your application requirements)
  EOF
  )
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.project}-asg"
  max_size                  = var.max_instances
  min_size                  = var.min_instances
  desired_capacity          = var.min_instances
  health_check_grace_period = 300
  health_check_type         = "ELB"
  vpc_zone_identifier       = aws_subnet.private_app[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }
  
  dynamic "tag" {
    for_each = merge(
      local.common_tags,
      {
        Name = "${var.project}-app-instance"
      }
    )
    
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Scaling policies

# CPU scaling policy
resource "aws_autoscaling_policy" "cpu_scale_up" {
  name                   = "${var.project}-cpu-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Scale up if CPU > 70% for 2 minutes"
  alarm_actions       = [aws_autoscaling_policy.cpu_scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

resource "aws_autoscaling_policy" "cpu_scale_down" {
  name                   = "${var.project}-cpu-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Scale down if CPU < 30% for 2 minutes"
  alarm_actions       = [aws_autoscaling_policy.cpu_scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# Memory scaling policy (custom metric from CloudWatch Agent)
resource "aws_autoscaling_policy" "memory_scale_up" {
  name                   = "${var.project}-memory-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${var.project}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "mem_used_percent"
  namespace           = "CWAgent"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Scale up if Memory > 70% for 2 minutes"
  alarm_actions       = [aws_autoscaling_policy.memory_scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# Target tracking scaling policy for request count
resource "aws_autoscaling_policy" "request_count_tracking" {
  name                      = "${var.project}-request-count-tracking"
  policy_type               = "TargetTrackingScaling"
  autoscaling_group_name    = aws_autoscaling_group.main.name
  estimated_instance_warmup = 300
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.main.arn_suffix}"
    }
    target_value = 1000
  }
}

###################
# GuardDuty
###################

resource "aws_guardduty_detector" "main" {
  enable = true
  
  finding_publishing_frequency = "FIFTEEN_MINUTES"
  
  tags = local.common_tags
}

###################
# CloudWatch Dashboard and Alarms
###################

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-dashboard"
  
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
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.main.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
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
            ["CWAgent", "mem_used_percent", "AutoScalingGroupName", aws_autoscaling_group.main.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Memory Usage"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Request Count"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Response Time"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS CPU Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${aws_elasticache_replication_group.main.id}-001"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ElastiCache CPU Utilization"
        }
      }
    ]
  })
}

# High latency alarm
resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.project}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "High latency on target response time"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# 5xx errors alarm
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${var.project}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High 5xx error rate on ALB"
  
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# SNS Topic for alarms
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  
  tags = local.common_tags
}

###################
# Outputs
###################

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "public_subnets" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "private_app_subnets" {
  value       = aws_subnet.private_app[*].id
  description = "List of private app subnet IDs"
}

output "private_db_subnets" {
  value       = aws_subnet.private_db[*].id
  description = "List of private DB subnet IDs"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "The DNS name of the load balancer"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "The endpoint of the RDS instance"
  sensitive   = true
}

output "elasticache_endpoint" {
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  description = "The endpoint of the ElastiCache Redis cluster"
}

output "asg_name" {
  value       = aws_autoscaling_group.main.name
  description = "The name of the Auto Scaling Group"
}

output "dashboard_url" {
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
  description = "URL to the CloudWatch dashboard"
}
```

This Terraform script is quite comprehensive and includes all the necessary components for an online education platform web application with the following features:

1. **VPC with public and private subnets across multiple AZs**
2. **Secure networking with Internet Gateway and NAT Gateways**
3. **RDS MySQL database with Multi-AZ deployment and encryption**
4. **ElastiCache Redis cluster for session persistence**
5. **Application Load Balancer with HTTPS-only configuration and WAF integration**
6. **Auto Scaling Groups with EC2 instances and appropriate scaling policies**
7. **IAM roles with least privilege access**
8. **Security Groups with restricted access**
9. **CloudWatch monitoring, dashboards, and alarms**
10. **GuardDuty for threat detection**
11. **Comprehensive logging and metrics**
12. **KMS encryption for data at rest**

The configuration adheres to AWS best practices for security, scalability, performance, and cost optimization:

- **Security**: Implements private subnets, security groups with least privilege, IAM roles with fine-grained permissions, encryption at rest and in transit, and WAF for web application security.
- **Scalability**: Uses Auto Scaling Groups with appropriate scaling policies based on CPU, memory, and request count.
- **Performance**: Multi-AZ deployments, ElastiCache for session caching, and target tracking scaling for optimal performance.
- **Cost optimization**: Right-sized instances (t3.medium as specified), auto-scaling to match demand, and lifecycle configurations for S3 bucket logs to automatically delete old data.

Additionally, all resources are properly tagged with Environment, Owner, and Project tags as requested.

I believe this configuration meets all the requirements specified in the prompt and should be deployable with minimal modifications.
### Answer 
---

# Online Education Platform Terraform Infrastructure

I've created a comprehensive Terraform script for an online education platform that can handle 20,000 daily students with unpredictable traffic spikes. This infrastructure follows AWS best practices for security, scalability, performance, and cost optimization.

```terraform
# tap_stack.tf

###################
# Variables
###################

variable "aws_region" {
  description = "AWS region (referenced from provider.tf)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "education-platform-team"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "online-education-platform"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for the application servers"
  type        = string
  default     = "t3.medium"
}

variable "ec2_key_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "education-platform-key"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "education_db"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "elasticache_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = "arn:aws:acm:us-east-1:123456789012:certificate/abcdef12-3456-7890-abcd-ef1234567890"
}

variable "min_instances" {
  description = "Minimum number of EC2 instances in the ASG"
  type        = number
  default     = 2
}

variable "max_instances" {
  description = "Maximum number of EC2 instances in the ASG"
  type        = number
  default     = 10
}

###################
# Data Sources
###################

data "aws_ami" "amazon_linux" {
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

data "aws_caller_identity" "current" {}

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

###################
# VPC & Networking
###################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-vpc"
    }
  )
}

# Public subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-subnet-${count.index + 1}"
      Tier = "Public"
    }
  )
}

# Private application subnets
resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = element(var.availability_zones, count.index)
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-app-subnet-${count.index + 1}"
      Tier = "Private-App"
    }
  )
}

# Private database subnets
resource "aws_subnet" "private_db" {
  count             = length(var.private_db_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = element(var.availability_zones, count.index)
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-db-subnet-${count.index + 1}"
      Tier = "Private-DB"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-igw"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-eip-${count.index + 1}"
    }
  )
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-gateway-${count.index + 1}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-route-table"
    }
  )
}

# Route table for private app subnets
resource "aws_route_table" "private_app" {
  count  = length(var.private_app_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-app-route-table-${count.index + 1}"
    }
  )
}

# Route table for private DB subnets
resource "aws_route_table" "private_db" {
  count  = length(var.private_db_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-db-route-table-${count.index + 1}"
    }
  )
}

# Route table associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_app" {
  count          = length(var.private_app_subnet_cidrs)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

resource "aws_route_table_association" "private_db" {
  count          = length(var.private_db_subnet_cidrs)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db[count.index].id
}

###################
# Security Groups
###################

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-alb-sg"
    }
  )
}

# Application Security Group
resource "aws_security_group" "app" {
  name        = "${var.project}-app-sg"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTP access from ALB"
  }
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS access from ALB"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-app-sg"
    }
  )
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.project}-db-sg"
  description = "Security group for database instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "MySQL access from application servers"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-db-sg"
    }
  )
}

# ElastiCache Security Group
resource "aws_security_group" "elasticache" {
  name        = "${var.project}-elasticache-sg"
  description = "Security group for ElastiCache instances"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Redis access from application servers"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-elasticache-sg"
    }
  )
}

###################
# IAM Roles and Policies
###################

resource "aws_iam_role" "ec2_role" {
  name = "${var.project}-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.project}-ec2-policy"
  description = "Policy for EC2 instances to access required services"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ],
        Effect = "Allow",
        Resource = "*"
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ],
        Effect = "Allow",
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/*"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

###################
# KMS Key for Encryption
###################

resource "aws_kms_key" "main" {
  description             = "${var.project} encryption key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-key"
  target_key_id = aws_kms_key.main.key_id
}

###################
# RDS MySQL
###################

resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  subnet_ids  = aws_subnet.private_db[*].id
  description = "Database subnet group for ${var.project}"
  
  tags = local.common_tags
}

resource "aws_db_parameter_group" "main" {
  name        = "${var.project}-db-param-group"
  family      = "mysql8.0"
  description = "Parameter group for ${var.project} RDS instances"
  
  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }
  
  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }
  
  tags = local.common_tags
}

resource "aws_db_instance" "main" {
  allocated_storage          = 20
  max_allocated_storage      = 100
  storage_type               = "gp2"
  engine                     = "mysql"
  engine_version             = "8.0"
  instance_class             = var.db_instance_class
  identifier                 = "${var.project}-db"
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = var.db_password
  db_subnet_group_name       = aws_db_subnet_group.main.name
  parameter_group_name       = aws_db_parameter_group.main.name
  multi_az                   = true
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.main.arn
  backup_retention_period    = var.db_backup_retention_period
  backup_window              = "03:00-04:00"
  maintenance_window         = "