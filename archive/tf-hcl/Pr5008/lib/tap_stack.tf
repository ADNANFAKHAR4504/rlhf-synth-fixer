# tap_stack.tf - Secure AWS Environment with Auto Scaling, RDS, and Monitoring
# 
# This Terraform configuration deploys a production-ready AWS environment with:
# - VPC with public and private subnets across multiple AZs
# - EC2 Auto Scaling Group with CloudWatch monitoring
# - RDS MySQL Multi-AZ with encryption using AWS Secrets Manager for password
# - S3 bucket with encryption and versioning
# - CloudWatch alarms and SNS notifications
# - IAM roles with least privilege access
#
# All resources are configured for us-west-2 region
# Provider configuration is in provider.tf

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "secure-app"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to support multiple deployments"
  type        = string
  default     = ""
  validation {
    condition     = can(regex("^$|^-[a-z0-9-]+$", var.environment_suffix))
    error_message = "The environment_suffix must be empty or start with a hyphen followed by lowercase letters, numbers, or hyphens."
  }
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "allowed_admin_cidr" {
  description = "CIDR blocks allowed for administrative access"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "db_username" {
  description = "Master username for RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "autoscaling_min_size" {
  description = "Minimum number of EC2 instances in ASG"
  type        = number
  default     = 1
}

variable "autoscaling_max_size" {
  description = "Maximum number of EC2 instances in ASG"
  type        = number
  default     = 3
}

variable "s3_bucket_name" {
  description = "Name for S3 bucket storing CloudFormation templates"
  type        = string
  default     = ""
}

# Local values for consistent tagging
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = "${var.project}-${var.environment}"
    ManagedBy   = "terraform"
  }

  # Name prefix for all resources including environment suffix
  name_prefix = "${var.project}-${var.environment}${var.environment_suffix}"

  # Generate unique S3 bucket name if not provided
  s3_bucket_name = var.s3_bucket_name != "" ? var.s3_bucket_name : "${var.project}-cf-templates-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Amazon Linux 2 AMI
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

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Exclude problematic characters for MySQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# KMS Key for encryption (RDS, S3, and Secrets Manager)
# Security: Enable automatic key rotation for compliance
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project}-${var.environment} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# AWS Secrets Manager for RDS password
# Security: Store database credentials securely instead of in code
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  description             = "RDS MySQL master password for ${var.project}-${var.environment}"
  kms_key_id              = aws_kms_key.main.id
  recovery_window_in_days = 0 # Set to 0 for immediate deletion in test environments

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "mysql"
    host     = "" # Will be populated after RDS creation
    port     = 3306
    dbname   = replace("${var.project}_${var.environment}${var.environment_suffix}", "-", "_")
  })

  lifecycle {
    ignore_changes = [secret_string] # Prevent updates after initial creation
  }
}

# VPC Configuration
# Security: Private subnets for RDS, public subnet for ALB/NAT Gateway
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway for public subnet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public subnet for web tier (spans first AZ)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-1"
    Type = "public"
  })
}

# Private subnets for RDS (Multi-AZ requires at least 2 subnets)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# Route table for public subnet
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

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Security Groups
# Security: Principle of least privilege - only allow required ports
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from anywhere (for demo - restrict in production)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  # Allow HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-sg"
  })
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # Security: Only allow MySQL port from web security group
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL from web servers only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# IAM Role for EC2 instances
# Security: Least privilege - only SSM, CloudWatch, and S3 read
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# Attach SSM policy for Session Manager access (no SSH keys needed)
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch Logs policy
resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name = "${local.name_prefix}-ec2-cloudwatch"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${local.name_prefix}*"
    }]
  })
}

# S3 read policy for CloudFormation templates
resource "aws_iam_role_policy" "ec2_s3_read" {
  name = "${local.name_prefix}-ec2-s3-read"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.cf_templates.arn,
        "${aws_s3_bucket.cf_templates.arn}/*"
      ]
    }]
  })
}

# Secrets Manager read policy for database credentials
resource "aws_iam_role_policy" "ec2_secrets_read" {
  name = "${local.name_prefix}-ec2-secrets-read"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ec2" {
  name              = "/aws/ec2/${local.name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/${local.name_prefix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

# EC2 Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "${local.name_prefix}-web-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  # User data to install CloudWatch agent and basic web server
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOC'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "${aws_cloudwatch_log_group.ec2.name}",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      },
      "metrics": {
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_active"
            ],
            "metrics_collection_interval": 60,
            "totalcpu": false
          }
        }
      }
    }
    EOC
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -s \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    
    # Start web server
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${local.name_prefix}</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-web-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-web-volume"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                      = "${local.name_prefix}-web-asg"
  vpc_zone_identifier       = [aws_subnet.public.id]
  target_group_arns         = [aws_lb_target_group.web.arn]
  min_size                  = var.autoscaling_min_size
  max_size                  = var.autoscaling_max_size
  desired_capacity          = var.autoscaling_min_size
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-web-asg"
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

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions = [
    aws_autoscaling_policy.scale_out.arn,
    aws_sns_topic.alerts.arn
  ]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${local.name_prefix}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_in.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }

  tags = local.common_tags
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${local.name_prefix}-scale-out"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${local.name_prefix}-scale-in"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.web.name
}

# RDS Instance
# Security: Multi-AZ for high availability, encrypted storage, automated backups
resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-mysql"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  db_name  = replace("${var.project}_${var.environment}${var.environment_suffix}", "-", "_")
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Security: Not publicly accessible
  publicly_accessible = false
  multi_az            = true

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Enable logging
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Skip final snapshot for easy cleanup (change for production)
  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-mysql"
  })
}

# RDS Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${local.name_prefix}-rds-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1073741824" # 1GB in bytes
  alarm_description   = "RDS instance is low on storage"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# S3 Bucket for CloudFormation Templates
resource "aws_s3_bucket" "cf_templates" {
  bucket = local.s3_bucket_name

  tags = merge(local.common_tags, {
    Name = local.s3_bucket_name
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "cf_templates" {
  bucket = aws_s3_bucket.cf_templates.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cf_templates" {
  bucket = aws_s3_bucket.cf_templates.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Block Public Access
resource "aws_s3_bucket_public_access_block" "cf_templates" {
  bucket = aws_s3_bucket.cf_templates.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Example: Elastic IP for a specific instance (commented out for ASG best practice)
# Note: In production with ASG, use Application Load Balancer instead of EIP
# resource "aws_eip" "web" {
#   domain = "vpc"
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-web-eip"
#   })
# }

# Application Load Balancer (recommended for production ASG)
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_lb" "web" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public.id, aws_subnet.private[0].id]

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "web" {
  name     = "${local.name_prefix}-tg"
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
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg"
  })
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [aws_subnet.public.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "ec2_asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.web.name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.web.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.web.arn
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.id
}

output "s3_bucket_name" {
  description = "S3 bucket name for CloudFormation templates"
  value       = aws_s3_bucket.cf_templates.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.cf_templates.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.db_password.name
}

output "cloudwatch_log_group_ec2" {
  description = "CloudWatch log group for EC2"
  value       = aws_cloudwatch_log_group.ec2.name
}

output "cloudwatch_log_group_rds" {
  description = "CloudWatch log group for RDS"
  value       = aws_cloudwatch_log_group.rds.name
}




