# tap_stack.tf - Enterprise-grade secure AWS infrastructure
# Region: us-west-2 (Oregon)
# Security-first approach with encryption, least privilege, and monitoring

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = "us-west-2"
}

# Environment suffix variable for resource naming isolation
variable "environment_suffix" {
  description = "Environment suffix to append to resource names for deployment isolation"
  type        = string
  default     = ""
}

# Data sources for current account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Customer-managed KMS key for encryption across services
resource "aws_kms_key" "main" {
  description             = "Main KMS key for enterprise application encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "enterprise-app-kms-key${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  target_key_id = aws_kms_key.main.key_id
}

# VPC Configuration with public and private subnets
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "enterprise-vpc${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Internet Gateway for public subnet connectivity
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "enterprise-igw${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "enterprise-nat-eip${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Public subnets across 2 AZs
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "enterprise-public-subnet-${count.index + 1}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
    Type = "Public"
  }
}

# Private subnets across 2 AZs
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "enterprise-private-subnet-${count.index + 1}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
    Type = "Private"
  }
}

# NAT Gateway for private subnet outbound access
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "enterprise-nat-gateway${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "enterprise-public-rt${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "enterprise-private-rt${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Network ACLs for additional layer of security
resource "aws_network_acl" "main" {
  vpc_id = aws_vpc.main.id

  # Ingress rules - Allow necessary traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 65535
  }

  # Egress rules - Allow necessary traffic
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 65535
  }

  tags = {
    Name = "enterprise-nacl${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# S3 bucket for CloudTrail logs with encryption and versioning
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "enterprise-cloudtrail-logs${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "CloudTrail Logs"
  }
}

# Enable versioning for CloudTrail bucket
resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for CloudTrail bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# Block public access for CloudTrail bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# S3 bucket for application logs with encryption and versioning
resource "aws_s3_bucket" "app_logs" {
  bucket = "enterprise-app-logs${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "Application Logs"
  }
}

# Enable versioning for app logs bucket
resource "aws_s3_bucket_versioning" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for app logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# Block public access for app logs bucket
resource "aws_s3_bucket_public_access_block" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for application logs with KMS encryption
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "Enterprise App Logs"
  }
}

# CloudTrail configuration for audit logging
resource "aws_cloudtrail" "main" {
  name           = "enterprise-cloudtrail${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.id

  # Enable logging for all regions
  is_multi_region_trail         = true
  include_global_service_events = true

  # Log all read/write events
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  # Enable log file validation for integrity
  enable_log_file_validation = true

  # Encrypt CloudTrail logs
  kms_key_id = aws_kms_key.main.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  tags = {
    Name = "Enterprise CloudTrail"
  }
}

# AWS Config configuration bucket
resource "aws_s3_bucket" "config" {
  bucket = "enterprise-config${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "AWS Config Bucket"
  }
}

# Enable versioning for Config bucket
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for Config bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# Block public access for Config bucket
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  name = "enterprise-config-role${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "Enterprise Config Role"
  }
}

# IAM policy for AWS Config
resource "aws_iam_role_policy" "config" {
  name = "enterprise-config-policy${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 bucket policy for AWS Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "enterprise-config-recorder${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "enterprise-config-delivery${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_s3_bucket_policy.config]
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config rule to monitor security group changes
resource "aws_config_config_rule" "security_group_ssh_check" {
  name = "security-group-ssh-check"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# IAM role for EC2 instances with least privilege
resource "aws_iam_role" "ec2" {
  name = "enterprise-ec2-role${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"

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

  tags = {
    Name = "Enterprise EC2 Role"
  }
}

# IAM policy for EC2 to write logs to S3 and CloudWatch
resource "aws_iam_role_policy" "ec2_logging" {
  name = "enterprise-ec2-logging-policy${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_logs.arn,
          "${aws_s3_bucket.app_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.app.arn,
          "${aws_cloudwatch_log_group.app.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:parameter/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# EC2 instance profile
resource "aws_iam_instance_profile" "ec2" {
  name = "enterprise-ec2-profile${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  role = aws_iam_role.ec2.name
}

# Security group for ALB (allows HTTPS from organization IPs)
resource "aws_security_group" "alb" {
  name        = "enterprise-alb-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # Ingress rule - HTTPS from organization IPs only
  ingress {
    description = "HTTPS from organization"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"] # Replace with your organization's IP range
  }

  # Minimal egress - only to VPC CIDR
  egress {
    description = "Allow traffic to VPC"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = {
    Name = "enterprise-alb-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Security group for EC2 instances (allows traffic from ALB only)
resource "aws_security_group" "ec2" {
  name        = "enterprise-ec2-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Ingress from ALB only
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Egress for updates and AWS service communication
  egress {
    description = "HTTPS to internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "enterprise-ec2-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Security group for RDS (allows traffic from EC2 only)
resource "aws_security_group" "rds" {
  name        = "enterprise-rds-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # Ingress from EC2 instances only
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # No egress rules needed for RDS
  egress {
    description = "Deny all egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["127.0.0.1/32"]
  }

  tags = {
    Name = "enterprise-rds-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# Security group for Lambda functions
resource "aws_security_group" "lambda" {
  name        = "enterprise-lambda-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  # Egress only for AWS service communication
  egress {
    description = "HTTPS to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "enterprise-lambda-sg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  }
}

# RDS subnet group for Multi-AZ deployment
resource "aws_db_subnet_group" "main" {
  name       = "enterprise-db-subnet-group${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "Enterprise DB subnet group"
  }
}

# Generate secure random password for RDS
resource "random_password" "rds" {
  length  = 32
  special = true
}

# Store RDS password in SSM Parameter Store
resource "aws_ssm_parameter" "rds_password" {
  name        = "/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}/rds/password"
  description = "RDS master password"
  type        = "SecureString"
  value       = random_password.rds.result
  key_id      = aws_kms_key.main.key_id

  tags = {
    Name = "RDS Password"
  }
}

# RDS instance with encryption and Multi-AZ
resource "aws_db_instance" "main" {
  identifier = "enterprise-db${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  # Storage configuration with encryption
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn
  storage_type          = "gp3"

  # Database configuration
  db_name  = "enterprisedb"
  username = "dbadmin"
  password = random_password.rds.result

  # Multi-AZ for high availability
  multi_az = true

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn

  # Allow deletion for QA pipeline - no Retain policy
  deletion_protection = false
  skip_final_snapshot = true

  tags = {
    Name = "Enterprise Database"
  }
}

# Launch template for EC2 instances with encrypted EBS
resource "aws_launch_template" "app" {
  name_prefix   = "enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-"
  image_id      = "ami-0c94855ba95c71c57" # Amazon Linux 2023 in us-west-2
  instance_type = "t3.medium"

  # Use encrypted EBS volume
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }

  # IAM instance profile
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  # Network configuration
  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Enable detailed monitoring
  monitoring {
    enabled = true
  }

  # Instance metadata security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  # User data script to install CloudWatch agent
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch agent
    cat <<'CONFIG' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "${aws_cloudwatch_log_group.app.name}",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      },
      "metrics": {
        "metrics_collected": {
          "mem": {
            "measurement": [
              "mem_used_percent"
            ]
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "resources": [
              "*"
            ]
          }
        }
      }
    }
    CONFIG
    
    # Start CloudWatch agent
    systemctl enable amazon-cloudwatch-agent
    systemctl start amazon-cloudwatch-agent
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "Enterprise App Server"
    }
  }
}

# Auto Scaling Group for EC2 instances
resource "aws_autoscaling_group" "app" {
  name                      = "enterprise-app-asg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  vpc_zone_identifier       = aws_subnet.private[*].id
  min_size                  = 2
  max_size                  = 6
  desired_capacity          = 2
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "Enterprise App Instance"
    propagate_at_launch = true
  }
}

# ACM Certificate for ALB
resource "aws_acm_certificate" "alb" {
  domain_name       = "app.example.com" # Replace with your domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "Enterprise ALB Certificate"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "enterprise-alb${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  # Allow deletion for QA pipeline - no Retain policy
  enable_deletion_protection = false

  # Enable access logs
  access_logs {
    bucket  = aws_s3_bucket.app_logs.bucket
    prefix  = "alb"
    enabled = true
  }

  # Enable HTTP/2
  enable_http2 = true

  # Drop invalid header fields
  drop_invalid_header_fields = true

  tags = {
    Name = "Enterprise ALB"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name     = "enterprise-app-tg${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
  }

  tags = {
    Name = "Enterprise App Target Group"
  }
}

# ALB Listener for HTTPS
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.alb.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Attach ASG to Target Group
resource "aws_autoscaling_attachment" "app" {
  autoscaling_group_name = aws_autoscaling_group.app.id
  lb_target_group_arn    = aws_lb_target_group.app.arn
}

# WAF Web ACL for protection against common attacks
resource "aws_wafv2_web_acl" "main" {
  name  = "enterprise-waf${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed SQL Database Rule Set
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "enterprise-waf${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "Enterprise WAF"
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Enterprise CloudFront OAI"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Enterprise Application CDN"
  default_root_object = "index.html"

  # Origin configuration pointing to ALB
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.main.id}"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Price class
  price_class = "PriceClass_100"

  # Geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL/TLS configuration
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # WAF association
  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = {
    Name = "Enterprise CloudFront Distribution"
  }
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda" {
  name = "enterprise-lambda-role${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "Enterprise Lambda Role"
  }
}

# IAM policy for Lambda VPC access and logging
resource "aws_iam_role_policy" "lambda_vpc" {
  name = "enterprise-lambda-vpc-policy${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:parameter/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# Sample Lambda function running in VPC
# Note: Lambda function is commented out as it requires a deployment package (zip file)
# which is not included in the repository. The IAM roles and policies are still
# created to demonstrate proper least-privilege security configuration.
#
# resource "aws_lambda_function" "processor" {
#   filename         = "lambda_function.zip"
#   function_name    = "enterprise-processor${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
#   role             = aws_iam_role.lambda.arn
#   handler          = "index.handler"
#   source_code_hash = filebase64sha256("lambda_function.zip")
#   runtime          = "python3.11"
#   timeout          = 60
#   memory_size      = 512
#
#   # VPC configuration for Lambda
#   vpc_config {
#     subnet_ids         = aws_subnet.private[*].id
#     security_group_ids = [aws_security_group.lambda.id]
#   }
#
#   # Environment variables from SSM
#   environment {
#     variables = {
#       DB_ENDPOINT = aws_db_instance.main.endpoint
#       SSM_PREFIX  = "/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
#     }
#   }
#
#   # Enable X-Ray tracing
#   tracing_config {
#     mode = "Active"
#   }
#
#   # Use KMS key for environment variable encryption
#   kms_key_arn = aws_kms_key.main.arn
#
#   tags = {
#     Name = "Enterprise Processor Lambda"
#   }
#
#   depends_on = [
#     aws_iam_role_policy.lambda_vpc,
#     aws_cloudwatch_log_group.lambda
#   ]
# }

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/enterprise-processor${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "Enterprise Lambda Logs"
  }
}

# SSM Parameter for application configuration
resource "aws_ssm_parameter" "app_config" {
  name        = "/enterprise-app${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}/config/api-key"
  description = "API key for external service"
  type        = "SecureString"
  value       = "your-secure-api-key" # Replace with actual value
  key_id      = aws_kms_key.main.key_id

  tags = {
    Name = "API Key Parameter"
  }
}

# SNS topic for alerts with encryption
resource "aws_sns_topic" "alerts" {
  name              = "enterprise-alerts${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  kms_master_key_id = aws_kms_key.main.id

  tags = {
    Name = "Enterprise Alerts Topic"
  }
}

# SNS topic policy enforcing HTTPS
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnforceHTTPS"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowAccountPublish"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:Publish",
          "SNS:Subscribe",
          "SNS:ListSubscriptionsByTopic",
          "SNS:GetTopicAttributes"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# CloudWatch Alarm for high CPU usage
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "enterprise-high-cpu${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Name = "High CPU Alarm"
  }
}

# Outputs for reference
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "kms_key_id" {
  description = "KMS Key ID for encryption"
  value       = aws_kms_key.main.id
}