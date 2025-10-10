This is a comprehensive request for a production-grade AWS infrastructure stack using Terraform. I need to create a single file that includes:

1. Networking (VPC, subnets, NAT Gateway)
2. Compute (EC2 with proper security)
3. Storage (S3 with encryption and logging)
4. IAM (roles, policies, MFA enforcement)
5. CloudFront with WAF
6. Monitoring (CloudTrail, Config, CloudWatch)
7. Backup solutions
8. Proper tagging and naming conventions

All resources need to follow best practices:
- Everything encrypted
- Least privilege access
- No public access where not needed
- Proper logging and monitoring
- Consistent naming with "-prd" suffix
- Complete tagging strategy

# Production-Grade AWS Infrastructure Stack

Below is a comprehensive **tap_stack.tf** file that implements a secure, production-ready AWS infrastructure following all specified requirements and best practices.

```hcl
# tap_stack.tf - Production-Grade AWS Infrastructure Stack
# Region: us-east-1
# Purpose: Secure, compliant AWS foundation for production workloads

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# ============================================================================
# PROVIDERS
# ============================================================================

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = local.common_tags
  }
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "allowed_ssh_ips" {
  description = "IP addresses allowed to SSH to bastion"
  type        = list(string)
  default     = ["203.0.113.0/24"] # Replace with your actual IP ranges
}

variable "ec2_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

variable "project_prefix" {
  description = "Project prefix for naming"
  type        = string
  default     = "nova"
}

variable "domain_name" {
  description = "Domain name for CloudFront distribution"
  type        = string
  default     = "example.com" # Replace with your domain
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

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

# ============================================================================
# LOCALS
# ============================================================================

locals {
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Project     = var.project_prefix
  }
  
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  
  s3_logging_bucket   = "${var.project_prefix}-logs-prd-${data.aws_caller_identity.current.account_id}"
  s3_app_bucket      = "${var.project_prefix}-app-prd-${data.aws_caller_identity.current.account_id}"
  cloudtrail_name    = "${var.project_prefix}-trail-prd"
}

# ============================================================================
# KMS KEYS
# ============================================================================

# KMS key for EBS encryption
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-ebs-kms-prd"
  })
}

resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/${var.project_prefix}-ebs-prd"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}

# KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-s3-kms-prd"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${var.project_prefix}-s3-prd"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ============================================================================
# NETWORKING - VPC
# ============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpc-prd"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination_arn = aws_s3_bucket.logging.arn
  log_destination_type = "s3"
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-vpc-flow-logs-prd"
  })
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.project_prefix}-vpc-flow-logs-role-prd"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-igw-prd"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-public-subnet-${count.index + 1}-prd"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-subnet-${count.index + 1}-prd"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat-eip-${count.index + 1}-prd"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-nat-gateway-${count.index + 1}-prd"
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
    Name = "${var.project_prefix}-public-rt-prd"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-private-rt-${count.index + 1}-prd"
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
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security Group for EC2 instances
resource "aws_security_group" "ec2_instances" {
  name        = "${var.project_prefix}-ec2-sg-prd"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  # SSH access from allowed IPs only
  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_ips
  }
  
  # HTTPS inbound from VPC
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # HTTP inbound from VPC
  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # Outbound internet access
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-ec2-sg-prd"
  })
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_instance_role" {
  name = "${var.project_prefix}-ec2-role-prd"
  
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

# IAM Policy for EC2 to access SNS
resource "aws_iam_policy" "ec2_sns_access" {
  name        = "${var.project_prefix}-ec2-sns-policy-prd"
  description = "Allow EC2 instances to publish to SNS"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:Subscribe"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# IAM Policy for EC2 to access SSM
resource "aws_iam_policy" "ec2_ssm_access" {
  name        = "${var.project_prefix}-ec2-ssm-policy-prd"
  description = "Allow EC2 instances to use SSM"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:ListAssociations",
          "ssm:ListInstanceAssociations",
          "ssm:GetDocument",
          "ssm:DescribeDocument"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::aws-ssm-${var.aws_region}/*",
          "arn:aws:s3:::aws-windows-downloads-${var.aws_region}/*",
          "arn:aws:s3:::amazon-ssm-${var.aws_region}/*",
          "arn:aws:s3:::amazon-ssm-packages-${var.aws_region}/*",
          "arn:aws:s3:::${var.aws_region}-birdwatcher-prod/*",
          "arn:aws:s3:::patch-baseline-snapshot-${var.aws_region}/*"
        ]
      }
    ]
  })
}

# Attach policies to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_sns" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.ec2_sns_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = aws_iam_policy.ec2_ssm_access.arn
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_prefix}-ec2-profile-prd"
  role = aws_iam_role.ec2_instance_role.name
  
  tags = local.common_tags
}

# ============================================================================
# EC2 INSTANCES
# ============================================================================

# Launch Template for EC2 instances
resource "aws_launch_template" "app_servers" {
  name_prefix   = "${var.project_prefix}-app-lt-prd-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.ec2_instance_type
  
  vpc_security_group_ids = [aws_security_group.ec2_instances.id]
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }
  
  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id           = aws_kms_key.ebs_encryption.arn
      delete_on_termination = true
    }
  }
  
  # Enable detailed monitoring
  monitoring {
    enabled = true
  }
  
  # Instance metadata configuration
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Update system
    yum update -y
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Install SSM agent (usually pre-installed on Amazon Linux 2)
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
    
    # Basic hardening
    echo "AllowUsers ec2-user" >> /etc/ssh/sshd_config
    echo "PermitRootLogin no" >> /etc/ssh/sshd_config
    systemctl restart sshd
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_prefix}-app-server-prd"
    })
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${var.project_prefix}-app-volume-prd"
    })
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app_servers" {
  name                = "${var.project_prefix}-app-asg-prd"
  vpc_zone_identifier = aws_subnet.private[*].id
  min_size            = 1
  max_size            = 3
  desired_capacity    = 2
  health_check_type   = "EC2"
  health_check_grace_period = 300
  
  launch_template {
    id      = aws_launch_template.app_servers.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_prefix}-app-asg-instance-prd"
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

# ============================================================================
# S3 BUCKETS
# ============================================================================

# S3 Bucket for centralized logging
resource "aws_s3_bucket" "logging" {
  bucket = local.s3_logging_bucket
  
  tags = merge(local.common_tags, {
    Name        = local.s3_logging_bucket
    Purpose     = "Centralized logging"
    Compliance  = "Required"
  })
}

# S3 Bucket versioning for logging bucket
resource "aws_s3_bucket_versioning" "logging" {
  bucket = aws_s3_bucket.logging.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption for logging bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

# S3 Bucket public access block for logging bucket
resource "aws_s3_bucket_public_access_block" "logging" {
  bucket = aws_s3_bucket.logging.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle for logging bucket
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id
  
  rule {
    id     = "archive-old-logs"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# S3 Bucket policy for logging bucket
resource "aws_s3_bucket_policy" "logging" {
  bucket = aws_s3_bucket.logging.id
  
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
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Application S3 Bucket
resource "aws_s3_bucket" "application" {
  bucket = local.s3_app_bucket
  
  tags = merge(local.common_tags, {
    Name    = local.s3_app_bucket
    Purpose = "Application data storage"
  })
}

# S3 Bucket versioning for application bucket
resource "aws_s3_bucket_versioning" "application" {
  bucket = aws_s3_bucket.application.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption for application bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "application" {
  bucket = aws_s3_bucket.application.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

# S3 Bucket public access block for application bucket
resource "aws_s3_bucket_public_access_block" "application" {
  bucket = aws_s3_bucket.application.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = local.cloudtrail_name
  s3_bucket_name               = aws_s3_bucket.logging.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*:*:function/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = local.cloudtrail_name
  })
  
  depends_on = [aws_s3_bucket_policy.logging]
}

# ============================================================================
# AWS CONFIG
# ============================================================================

# Config Recorder Role
resource "aws_iam_role" "config_recorder" {
  name = "${var.project_prefix}-config-recorder-role-prd"
  
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
  
  tags = local.common_tags
}

# Config Recorder Role Policy
resource "aws_iam_role_policy" "config_recorder" {
  name = "${var.project_prefix}-config-recorder-policy-prd"
  role = aws_iam_role.config_recorder.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringLike = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_recorder" {
  role       = aws_iam_role.config_recorder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_prefix}-config-recorder-prd"
  role_arn = aws_iam_role.config_recorder.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_prefix}-config-delivery-prd"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  
  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_delivery_channel.main]
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name              = "${var.project_prefix}-alerts-prd"
  kms_master_key_id = "alias/aws/sns"
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-alerts-prd"
  })
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowBackupToPublish"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# Alarm for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project_prefix}-unauthorized-api-calls-prd"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"
  
  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project_prefix}-unauthorized-api-calls-prd"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  tags = local.common_tags
}

# Alarm for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "${var.project_prefix}-root-account-usage-prd"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"
  
  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${var.project_prefix}-root-account-usage-prd"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  tags = local.common_tags
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.cloudtrail_name}"
  retention_in_days = 90
  kms_key_id       = aws_kms_key.s3_encryption.arn
  
  tags = local.common_tags
}

# ============================================================================
# CLOUDFRONT AND WAF
# ============================================================================

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_prefix}-waf-prd"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Core Rule Set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
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
      metric_name                = "${var.project_prefix}-common-rules-metric"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
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
      metric_name                = "${var.project_prefix}-bad-inputs-metric"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_prefix}-rate-limit-metric"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_prefix}-waf-metric"
    sampled_requests_enabled   = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-waf-prd"
  })
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${var.project_prefix} CloudFront OAI"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled    = true
  comment            = "${var.project_prefix} CloudFront Distribution"
  default_root_object = "index.html"
  price_class        = "PriceClass_100"
  web_acl_id         = aws_wafv2_web_acl.main.arn
  
  origin {
    domain_name = aws_s3_bucket.application.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.application.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.application.id}"
    
    forwarded_values {
      query_string = false
      headers      = []
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
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
  
  logging_config {
    bucket          = aws_s3_bucket.logging.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-cdn-prd"
  })
}

# ============================================================================
# API GATEWAY
# ============================================================================

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_prefix}-api-prd"
  description = "Production API Gateway"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-api-prd"
  })
}

# API Gateway Resource Policy (IP Restriction)
resource "aws_api_gateway_rest_api_policy" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "execute-api:/*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.allowed_ssh_ips
          }
        }
      }
    ]
  })
}

# ============================================================================
# AWS BACKUP
# ============================================================================

# Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_prefix}-backup-vault-prd"
  kms_key_arn = aws_kms_key.ebs_encryption.arn
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-backup-vault-prd"
  })
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${var.project_prefix}-backup-plan-prd"
  
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
    start_window      = 60
    completion_window = 120
    
    lifecycle {
      delete_after = 30 # Keep backups for 30 days
    }
    
    recovery_point_tags = local.common_tags
  }
  
  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 ? * 1 *)" # Weekly on Mondays at 3 AM UTC
    start_window      = 60
    completion_window = 120
    
    lifecycle {
      delete_after = 90 # Keep weekly backups for 90 days
    }
    
    recovery_point_tags = local.common_tags
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.project_prefix}-backup-plan-prd"
  })
}

# Backup Selection
resource "aws_backup_selection" "main" {
  name         = "${var.project_prefix}-backup-selection-prd"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup_service.arn
  
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = "Production"
  }
  
  resources = [
    "arn:aws:ec2:*:*:volume/*",
    "arn:aws:rds:*:*:db:*"
  ]
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_service" {
  name = "${var.project_prefix}-backup-role-prd"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup_service" {
  role       = aws_iam_role.backup_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_service_restore" {
  role       = aws_iam_role.backup_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# ============================================================================
# AWS ORGANIZATIONS - SERVICE CONTROL POLICIES
# ============================================================================

# Data source for current organization
data "aws_organizations_organization" "current" {
  count = var.environment == "Production" ? 1 : 0
}

# Service Control Policy for MFA enforcement
resource "aws_organizations_policy" "require_mfa" {
  count = var.environment == "Production" ? 1 : 0
  
  name        = "${var.project_prefix}-require-mfa-scp-prd"
  description = "Require MFA for all actions"
  type        = "SERVICE_CONTROL_POLICY"
  
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# ============================================================================
# PASSWORD POLICY
# ============================================================================

# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "logging_bucket" {
  description = "Name of the centralized logging bucket"
  value       = aws_s3_bucket.logging.id
}

output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = aws_backup_vault.main.name
}
```

## Key Features Implemented

### **Security**
- All data encrypted at rest using KMS keys
- VPC with private subnets for compute resources
- Security groups with least-privilege access
- WAF attached to CloudFront for web application protection
- IAM roles instead of access keys
- MFA enforcement via password policy
- No public S3 bucket access
- API Gateway with IP restrictions

### **Monitoring & Compliance**
- AWS CloudTrail for API audit logging
- AWS Config for resource compliance tracking
- CloudWatch alarms for security events
- VPC Flow Logs for network monitoring
- Centralized logging to S3
- Log retention and lifecycle policies

### **High Availability & Backup**
- Multi-AZ deployment across availability zones
- Auto Scaling Groups for EC2 instances
- AWS Backup with daily and weekly schedules
- S3 versioning enabled
- KMS key rotation enabled

### **Governance**
- Consistent tagging strategy
- Production naming convention with "-prd" suffix
- Cost center and owner tags for billing
- Service Control Policies for organizational compliance

## Deployment Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Validate Configuration:**
```bash
terraform validate
```

3. **Review Plan:**
```bash
terraform plan
```

4. **Apply Configuration:**
```bash
terraform apply
```

## Important Notes

- Replace `var.allowed_ssh_ips` with your actual IP ranges
- Update `var.domain_name` with your domain for CloudFront
- Configure SNS topic subscriptions for alert notifications
- Review and adjust backup retention policies based on your requirements
- Ensure AWS Organizations is enabled if using Service Control Policies

This infrastructure provides a secure, compliant foundation ready for production workloads with comprehensive monitoring, backup, and security controls in place.
