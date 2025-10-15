# main.tf

# ========================================
# Terraform Configuration
# ========================================
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# AWS Provider Configuration
provider "aws" {
  region = "us-east-1"
}

# ========================================
# Variables
# ========================================
variable "approved_ami_id" {
  description = "Approved AMI ID for EC2 instances"
  type        = string
  default     = "ami-0abcdef1234567890"
}

variable "corporate_cidr" {
  description = "Corporate IP range for SSH access"
  type        = string
  default     = "203.0.113.0/24"
}

# ========================================
# Data Sources
# ========================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ========================================
# KMS Keys
# ========================================
resource "aws_kms_key" "main_key" {
  description             = "Main KMS key for encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Environment = "Production"
  }
}

resource "aws_kms_alias" "main_key_alias" {
  name          = "alias/production-main-key"
  target_key_id = aws_kms_key.main_key.key_id
}

# ========================================
# IAM Configuration
# ========================================

# IAM User with minimal privileges
resource "aws_iam_user" "devops_user" {
  name = "devops-user"
  path = "/users/"

  tags = {
    Environment = "Production"
  }
}

# IAM Role for EC2 instances with S3 read-only access
resource "aws_iam_role" "ec2_access_role" {
  name = "ec2-s3-readonly-role"
  path = "/"

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
    Environment = "Production"
  }
}

# IAM Policy for EC2 S3 read-only access
resource "aws_iam_role_policy" "ec2_s3_readonly_policy" {
  name = "ec2-s3-readonly-policy"
  role = aws_iam_role.ec2_access_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.data_bucket.arn,
          "${aws_s3_bucket.data_bucket.arn}/*"
        ]
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_access_role.name

  tags = {
    Environment = "Production"
  }
}

# IAM Role for Lambda execution
resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda-execution-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = "Production"
  }
}

# IAM Policy for Lambda CloudWatch logging
resource "aws_iam_role_policy" "lambda_logging_policy" {
  name = "lambda-cloudwatch-logs-policy"
  role = aws_iam_role.lambda_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Sid    = "VPCNetworkingAccess"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name = "cloudtrail-cloudwatch-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = "Production"
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# ========================================
# S3 Bucket Configuration
# ========================================

# S3 bucket for general data storage
resource "aws_s3_bucket" "data_bucket" {
  bucket = "secure-production-data-bucket-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = "Production"
  }
}

resource "aws_s3_bucket_versioning" "data_bucket_versioning" {
  bucket = aws_s3_bucket.data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pab" {
  bucket = aws_s3_bucket.data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = "secure-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = "Production"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_bucket_versioning" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_encryption" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_pab" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ========================================
# VPC & Network Configuration
# ========================================

# Main VPC
resource "aws_vpc" "main_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "production-vpc"
    Environment = "Production"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main_igw" {
  vpc_id = aws_vpc.main_vpc.id

  tags = {
    Name        = "production-igw"
    Environment = "Production"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = {
    Name        = "production-nat-eip"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main_igw]
}

# Public Subnets
resource "aws_subnet" "public_subnet_a" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "production-public-subnet-a"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_subnet_b" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "production-public-subnet-b"
    Environment = "Production"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnet_a" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "production-private-subnet-a"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id            = aws_vpc.main_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "production-private-subnet-b"
    Environment = "Production"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main_nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_a.id

  tags = {
    Name        = "production-nat-gateway"
    Environment = "Production"
  }

  depends_on = [aws_internet_gateway.main_igw]
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_igw.id
  }

  tags = {
    Name        = "production-public-rt"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_nat_gw.id
  }

  tags = {
    Name        = "production-private-rt"
    Environment = "Production"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_rta_a" {
  subnet_id      = aws_subnet.public_subnet_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_b" {
  subnet_id      = aws_subnet.public_subnet_b.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "private_rta_a" {
  subnet_id      = aws_subnet.private_subnet_a.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_b" {
  subnet_id      = aws_subnet.private_subnet_b.id
  route_table_id = aws_route_table.private_rt.id
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log_group" {
  name              = "/aws/vpc/production-flowlogs"
  retention_in_days = 30

  tags = {
    Environment = "Production"
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = "Production"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "main_vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log_group.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main_vpc.id

  tags = {
    Name        = "production-vpc-flow-logs"
    Environment = "Production"
  }
}

# ========================================
# Security Groups
# ========================================

# Security Group for ALB (Public)
resource "aws_security_group" "sg_alb_https" {
  name        = "alb-public-https-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-sg-alb"
    Environment = "Production"
  }
}

# Security Group for EC2 instances (Private)
resource "aws_security_group" "sg_private_ec2" {
  name        = "private-ec2-sg"
  description = "Security group for EC2 instances in private subnet"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description = "SSH from corporate network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.corporate_cidr]
  }

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_alb_https.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-sg-ec2"
    Environment = "Production"
  }
}

# Security Group for RDS
resource "aws_security_group" "sg_rds" {
  name        = "rds-database-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main_vpc.id

  ingress {
    description     = "PostgreSQL from EC2 instances"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_private_ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-sg-rds"
    Environment = "Production"
  }
}

# Security Group for Lambda
resource "aws_security_group" "sg_lambda" {
  name        = "lambda-function-sg"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main_vpc.id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "production-sg-lambda"
    Environment = "Production"
  }
}

# ========================================
# EC2 Configuration
# ========================================

# Launch Template for EC2 instances
resource "aws_launch_template" "ec2_template" {
  name_prefix   = "production-ec2-template-"
  image_id      = var.approved_ami_id
  instance_type = "t3.micro"

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  vpc_security_group_ids = [aws_security_group.sg_private_ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Update system packages
    yum update -y
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    # Install SSM agent
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
    # Basic security hardening
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config
    systemctl restart sshd
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "production-ec2-instance"
      Environment = "Production"
    }
  }

  tags = {
    Environment = "Production"
  }
}

# EC2 Instance
resource "aws_instance" "main_ec2" {
  launch_template {
    id      = aws_launch_template.ec2_template.id
    version = "$Latest"
  }

  subnet_id = aws_subnet.private_subnet_a.id

  tags = {
    Name        = "production-main-ec2"
    Environment = "Production"
  }
}

# ========================================
# Application Load Balancer (ALB) with SSL
# ========================================

# ALB
resource "aws_lb" "main_alb" {
  name               = "production-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.sg_alb_https.id]
  subnets            = [aws_subnet.public_subnet_a.id, aws_subnet.public_subnet_b.id]

  enable_deletion_protection = false
  enable_http2               = true
  drop_invalid_header_fields = true

  tags = {
    Name        = "production-alb"
    Environment = "Production"
  }
}

# Target Group
resource "aws_lb_target_group" "main_tg" {
  name     = "production-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "production-target-group"
    Environment = "Production"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "main_tg_attachment" {
  target_group_arn = aws_lb_target_group.main_tg.arn
  target_id        = aws_instance.main_ec2.id
  port             = 80
}

# ACM Certificate - Self-signed for demonstration
resource "aws_acm_certificate" "ssl_cert" {
  domain_name       = "example.com"
  validation_method = "DNS"

  subject_alternative_names = ["*.example.com"]

  tags = {
    Name        = "production-ssl-certificate"
    Environment = "Production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.ssl_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_tg.arn
  }

  tags = {
    Environment = "Production"
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
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

  tags = {
    Environment = "Production"
  }
}

# ========================================
# RDS Configuration
# ========================================

# Random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
  # Ensure password meets RDS requirements
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Secrets Manager secret for RDS password
resource "aws_secretsmanager_secret" "rds_password" {
  name                    = "production-rds-master-password"
  description             = "Master password for production RDS PostgreSQL database"
  kms_key_id              = aws_kms_key.main_key.arn
  recovery_window_in_days = 7

  tags = {
    Name        = "production-rds-password"
    Environment = "Production"
  }
}

# Store the password in Secrets Manager
resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.rds_password.result
    engine   = "postgres"
    host     = aws_db_instance.main_rds.address
    port     = aws_db_instance.main_rds.port
    dbname   = "productiondb"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "production-rds-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]

  tags = {
    Name        = "production-rds-subnet-group"
    Environment = "Production"
  }
}

# RDS Instance
resource "aws_db_instance" "main_rds" {
  identifier     = "production-database"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main_key.arn

  db_name  = "productiondb"
  username = "dbadmin"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.sg_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az                  = true
  deletion_protection       = false
  skip_final_snapshot       = true
  final_snapshot_identifier = "production-db-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "production-rds-database"
    Environment = "Production"
  }
}

# ========================================
# Monitoring, Logging & Alerts
# ========================================

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/production"
  retention_in_days = 90

  tags = {
    Environment = "Production"
  }
}

# CloudTrail
resource "aws_cloudtrail" "main_trail" {
  name           = "production-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_bucket.id

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/"]
    }
  }

  enable_log_file_validation    = true
  is_multi_region_trail         = true
  include_global_service_events = true

  kms_key_id = aws_kms_key.main_key.arn

  tags = {
    Name        = "production-cloudtrail"
    Environment = "Production"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts_topic" {
  name              = "security-alerts-topic"
  kms_master_key_id = aws_kms_key.main_key.id

  tags = {
    Name        = "production-security-alerts"
    Environment = "Production"
  }
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts_topic.arn
  protocol  = "email"
  endpoint  = "security@example.com"
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_alarm" {
  alarm_name          = "production-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.security_alerts_topic.arn]

  dimensions = {
    InstanceId = aws_instance.main_ec2.id
  }

  tags = {
    Environment = "Production"
  }
}

# CloudWatch Alarm for Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "unauthorized-api-calls"
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_alarm" {
  alarm_name          = "production-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarms when an unauthorized API call is made"
  alarm_actions       = [aws_sns_topic.security_alerts_topic.arn]

  tags = {
    Environment = "Production"
  }

  depends_on = [aws_cloudwatch_log_metric_filter.unauthorized_api_calls]
}

# ========================================
# Lambda Configuration
# ========================================

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/production-lambda-function"
  retention_in_days = 14

  tags = {
    Environment = "Production"
  }
}

# Create Lambda deployment package using archive provider
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = <<-EOT
import json

def handler(event, context):
    """
    Simple Lambda function for demonstration purposes.
    This function is deployed in a VPC with minimal CloudWatch logging permissions.
    """
    print('Lambda function executed successfully')
    print(f'Event: {json.dumps(event)}')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Production Lambda!',
            'environment': 'Production'
        })
    }
EOT
    filename = "index.py"
  }
}

# Lambda Function
resource "aws_lambda_function" "main_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "production-lambda-function"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.9"
  timeout          = 30
  memory_size      = 128

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.sg_lambda.id]
  }

  environment {
    variables = {
      ENVIRONMENT = "Production"
      KMS_KEY_ID  = aws_kms_key.main_key.id
    }
  }

  kms_key_arn = aws_kms_key.main_key.arn

  tags = {
    Name        = "production-lambda"
    Environment = "Production"
  }

  depends_on = [aws_cloudwatch_log_group.lambda_log_group]
}

# ========================================
# Outputs
# ========================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main_vpc.id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main_alb.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main_rds.endpoint
  sensitive   = true
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_bucket.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main_lambda.function_name
}

output "rds_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the RDS master password"
  value       = aws_secretsmanager_secret.rds_password.arn
  sensitive   = true
}