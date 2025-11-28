# tap_stack.tf - Production-Grade Multi-Region-Ready AWS Infrastructure
# Implements HA, encryption, monitoring, and enterprise security standards

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
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

# Local variables for common tags and configuration
locals {
  common_tags = {
    Environment = var.environment_suffix
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  vpc_cidr = var.vpc_cidr
  azs      = slice(data.aws_availability_zones.available.names, 0, 2)
}

# VPC Configuration - Production network isolation
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-vpc"
  })
}

# Internet Gateway for public subnet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-igw"
  })
}

# Public Subnets - Multi-AZ for high availability
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(local.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - Multi-AZ for RDS and internal resources
resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 100)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways - One per AZ for high availability
resource "aws_nat_gateway" "main" {
  count         = length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-nat-gateway-${count.index + 1}"
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
    Name = "${lower(var.project_name)}-public-rt"
  })
}

# Private Route Tables - One per AZ for fault isolation
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "${lower(var.project_name)}-alb-sg-"
  description = "Security group for application load balancer"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP inbound from anywhere (restricted in production)
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS inbound from anywhere
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances - Principle of least privilege
resource "aws_security_group" "ec2" {
  name_prefix = "${lower(var.project_name)}-ec2-sg-"
  description = "Security group for EC2 instances with restrictive rules"
  vpc_id      = aws_vpc.main.id

  # Allow traffic only from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic for updates and dependencies
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS - Restrictive database access
resource "aws_security_group" "rds" {
  name_prefix = "${lower(var.project_name)}-rds-sg-"
  description = "Security group for RDS with restricted access"
  vpc_id      = aws_vpc.main.id

  # Allow MySQL/Aurora access only from EC2 instances
  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # No egress rules needed for RDS
  egress {
    description = "Deny all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["127.0.0.1/32"]
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 Instances - Least privilege principle
resource "aws_iam_role" "ec2" {
  name_prefix = "${lower(var.project_name)}-ec2-role-"

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

# IAM Policy for EC2 - Restricted permissions
resource "aws_iam_role_policy" "ec2_policy" {
  name_prefix = "${lower(var.project_name)}-ec2-policy-"
  role        = aws_iam_role.ec2.id

  # Minimal permissions: CloudWatch metrics, S3 read-only for specific bucket
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${lower(var.project_name)}-ec2-profile-"
  role        = aws_iam_role.ec2.name

  tags = local.common_tags
}

# KMS Key for EBS Encryption
resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-ebs-kms-key"
  })
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${lower(var.project_name)}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# Launch Template with encrypted root volume
resource "aws_launch_template" "main" {
  name_prefix   = "${lower(var.project_name)}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  # Instance profile for IAM role
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  # Security group assignment
  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Encrypted root volume configuration
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ebs.arn
      delete_on_termination = true
    }
  }

  # Instance metadata service v2 for enhanced security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  # User data script for basic setup
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Install and start a simple web server for health checks
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>${title(var.project_name)} Server - Healthy</h1>" > /var/www/html/index.html
    
    # Configure CloudWatch agent
    amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${lower(var.project_name)}-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${lower(var.project_name)}-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-launch-template"
  })
}

# Application Load Balancer
# Application Load Balancer
resource "aws_lb" "main" {
  name_prefix        = "${substr(lower(var.project_name), 0, 5)}-"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-alb"
  })
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = "${substr(lower(var.project_name), 0, 5)}-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-tg"
  })
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

# Auto Scaling Group - Multi-AZ deployment
resource "aws_autoscaling_group" "main" {
  name_prefix               = "${lower(var.project_name)}-asg-"
  vpc_zone_identifier       = aws_subnet.public[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  # Launch template configuration
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Instance refresh for rolling updates
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  # Tags propagated to instances
  tag {
    key                 = "Environment"
    value               = var.environment_suffix
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = "${lower(var.project_name)}-asg-instance"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Target Tracking
resource "aws_autoscaling_policy" "cpu" {
  name                   = "${lower(var.project_name)}-cpu-scaling"
  autoscaling_group_name = aws_autoscaling_group.main.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}

# SNS Topic for Monitoring Alerts
resource "aws_sns_topic" "alerts" {
  name_prefix = "${lower(var.project_name)}-alerts-"

  # Enable encryption at rest
  kms_master_key_id = "alias/aws/sns"

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-alerts"
  })
}

# SNS Topic Subscription (example with generic email)
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "ops-team@example.com"
}

# CloudWatch Alarm for High CPU Usage
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${lower(var.project_name)}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-cpu-alarm"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${lower(var.project_name)}-db-subnet-"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-db-subnet-group"
  })
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name_prefix = "${lower(var.project_name)}-db-params-"
  family      = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "character_set_client"
    value = "utf8mb4"
  }

  # Enable slow query log for performance monitoring
  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-db-params"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-rds-kms-key"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${lower(var.project_name)}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# AWS RDS will automatically manage the master user password
# The secret will be created and managed by AWS RDS service

# RDS Multi-AZ Instance - High Availability with encryption
resource "aws_db_instance" "main" {
  identifier_prefix = "${lower(var.project_name)}-db-"

  # Database specifications
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"

  # Database configuration
  db_name                       = "${replace(lower(var.project_name), "-", "")}db"
  username                      = "admin"
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.rds.arn
  port                          = 3306

  # High availability configuration
  multi_az               = true
  availability_zone      = null # Let AWS choose for Multi-AZ
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Encryption configuration
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  # Protection settings
  deletion_protection = false
  skip_final_snapshot = true

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id       = aws_kms_key.rds.arn

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-database"
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${lower(var.project_name)}-rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Additional IAM policy for EC2 instances to access RDS secrets
resource "aws_iam_role_policy" "ec2_rds_secret_access" {
  name_prefix = "${lower(var.project_name)}-ec2-rds-secret-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_db_instance.main.master_user_secret[0].secret_arn
      }
    ]
  })
}

# S3 Bucket with encryption and security best practices
resource "aws_s3_bucket" "main" {
  bucket_prefix = "${lower(var.project_name)}-data-"

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-data-bucket"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "app" {
  name_prefix       = "/aws/${lower(var.project_name)}/"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-logs"
  })
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${lower(var.project_name)}-logs-kms-key"
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${lower(var.project_name)}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average" }],
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Application Metrics"
        }
      }
    ]
  })
}

# Outputs - Non-sensitive metadata only
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_secret_arn" {
  description = "ARN of the RDS master user secret managed by AWS"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
  sensitive   = true
}
