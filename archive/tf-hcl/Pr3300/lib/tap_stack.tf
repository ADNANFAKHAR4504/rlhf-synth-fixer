# tap_stack.tf - Complete infrastructure stack with security requirements

# ===========================
# Variables
# ===========================
variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
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

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment  = "Production"
    ownership    = "self"
    departmental = "businessunit"
  }
}

# ===========================
# Data Sources
# ===========================
# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
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

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ===========================
# Locals
# ===========================
locals {
  # Naming convention
  name_prefix = "tap-stack"
  
  # AZ selection
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  
  # Resource names
  vpc_name                = "${local.name_prefix}-vpc"
  igw_name                = "${local.name_prefix}-igw"
  nat_name                = "${local.name_prefix}-nat"
  ec2_name                = "${local.name_prefix}-instance"
  asg_name                = "${local.name_prefix}-asg"
  s3_bucket_name          = "${local.name_prefix}-secure-bucket-${data.aws_caller_identity.current.account_id}"
  rds_name                = "${local.name_prefix}-mysql"
  cloudtrail_name         = "${local.name_prefix}-trail"
  guardduty_name          = "${local.name_prefix}-guardduty"
  waf_name                = "${local.name_prefix}-waf"
  kms_key_name            = "${local.name_prefix}-kms"
  flow_log_group_name     = "/aws/vpc/${local.vpc_name}/flow-logs"
  
  # All tags
  all_tags = merge(var.common_tags, {
    ManagedBy = "Terraform"
  })
}

# ===========================
# KMS Key for Encryption
# ===========================
resource "aws_kms_key" "main" {
  description             = "KMS key for ${local.name_prefix} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "key-default-1"
    Statement = [
      # Allow account root full control (owner)
      {
        Sid      = "AllowAccountRootFullControl"
        Effect   = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },

      # Allow CloudWatch Logs service to use the key for encrypt/decrypt/generate data key
      {
        Sid = "AllowCloudWatchLogsServiceUse"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "logs.${var.region}.amazonaws.com"
          }
        }
      },

      # Allow IAM principals in account to use the key for encrypt/decrypt if needed
      {
        Sid = "AllowUseByAccountIAM"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.all_tags, {
    Name = local.kms_key_name
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.kms_key_name}"
  target_key_id = aws_kms_key.main.key_id
}

# ===========================
# VPC Resources
# ===========================
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.all_tags, {
    Name = local.vpc_name
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.all_tags, {
    Name = local.igw_name
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"
  
  tags = merge(local.all_tags, {
    Name = "${local.nat_name}-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.public_subnet_cidrs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.all_tags, {
    Name = "${local.nat_name}-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = local.flow_log_group_name
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  
  tags = local.all_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-role"
  
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
  
  tags = local.all_tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${local.name_prefix}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

# ===========================
# Security Groups
# ===========================
# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  # SSH access from VPC CIDR only
  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-ec2-sg"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS MySQL instance"
  vpc_id      = aws_vpc.main.id
  
  # MySQL access from private subnets only
  ingress {
    description = "MySQL from private subnets"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.private_subnet_cidrs
  }
  
  # No egress rules for RDS
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# ===========================
# EC2 Launch Template
# ===========================
# IAM Role for EC2
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
  
  tags = local.all_tags
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  # Encrypted EBS root volume
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.main.arn
      delete_on_termination = true
    }
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.all_tags, {
      Name = local.ec2_name
    })
  }
  
  tag_specifications {
    resource_type = "volume"
    tags = merge(local.all_tags, {
      Name = "${local.ec2_name}-volume"
    })
  }
}

# ===========================
# Auto Scaling Group
# ===========================
resource "aws_autoscaling_group" "main" {
  name                = local.asg_name
  vpc_zone_identifier = aws_subnet.private[*].id
  min_size            = 1
  max_size            = 3
  desired_capacity    = 1
  health_check_type   = "EC2"
  health_check_grace_period = 300
  
  launch_template {
    id      = aws_launch_template.main.id
    version = aws_launch_template.main.latest_version
  }
 
  tag {
    key                 = "Name"
    value               = "${local.asg_name}-instance"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = local.all_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# ===========================
# S3 Bucket
# ===========================
resource "aws_s3_bucket" "main" {
  bucket = local.s3_bucket_name
  
  tags = merge(local.all_tags, {
    Name = local.s3_bucket_name
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
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

# S3 Bucket Lifecycle Policy
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "move-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    transition {
      days          = 120   # must be >= 30 + 90
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# S3 Bucket SSL Only Policy
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
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

# ===========================
# RDS MySQL
# ===========================
# Random username for RDS
resource "random_string" "rds_username" {
  length  = 8
  special = false
  numeric = false
  upper   = true
  lower   = true
}

# Random password for RDS
resource "random_password" "rds_password" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*()-_=+[]{}:?"
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier = local.rds_name
  
  # Engine configuration
  engine                    = "mysql"
  engine_version            = "8.0.43"
  auto_minor_version_upgrade = true
  
  # Instance configuration
  instance_class        = "db.t3.micro"
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn
  
  # Database configuration
  db_name  = "tapdb"
  username = random_string.rds_username.result
  password = random_password.rds_password.result
  port     = 3306
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High availability
  multi_az = true
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Performance and monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  # Disable deletion protection as requested
  deletion_protection = false
  skip_final_snapshot = true
  
  tags = merge(local.all_tags, {
    Name = local.rds_name
  })
}

# ===========================
# CloudTrail
# ===========================
# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.cloudtrail_name}-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.all_tags, {
    Name = "${local.cloudtrail_name}-logs"
  })
}

# CloudTrail S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

# CloudTrail S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
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
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = local.cloudtrail_name
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_log_file_validation    = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }
  
  tags = merge(local.all_tags, {
    Name = local.cloudtrail_name
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ===========================
# GuardDuty
# ===========================
resource "aws_guardduty_detector" "main" {
  enable = true
  
  datasources {
    s3_logs {
      enable = true
    }
  }
  
  tags = merge(local.all_tags, {
    Name = local.guardduty_name
  })
}

# ===========================
# AWS Config
# ===========================
# IAM Role for Config
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"
  
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
  
  tags = local.all_tags
}

# IAM Policy for Config
resource "aws_iam_role_policy" "config" {
  name = "${local.name_prefix}-config-policy"
  role = aws_iam_role.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutBucket*",
          "s3:GetBucket*",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

# IAM Policy Attachment for Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSConfigRole"
}

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-bucket-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(local.all_tags, {
    Name = "${local.name_prefix}-config-bucket"
  })
}

# Config S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Config S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Config S3 Bucket Policy
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

# Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.id

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [
    aws_s3_bucket.config,
    aws_iam_role.config
  ]
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules
# Rule 1: Check for encrypted volumes
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${local.name_prefix}-encrypted-volumes"
  
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 2: Check for root MFA
resource "aws_config_config_rule" "root_mfa" {
  name = "${local.name_prefix}-root-account-mfa-enabled"
  
  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 3: Check S3 bucket encryption
resource "aws_config_config_rule" "s3_encryption" {
  name = "${local.name_prefix}-s3-bucket-server-side-encryption-enabled"
  
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# ===========================
# AWS WAF
# ===========================
resource "aws_wafv2_web_acl" "main" {
  name  = local.waf_name
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
      metric_name                = "${local.waf_name}-common-rule-metric"
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
      metric_name                = "${local.waf_name}-bad-inputs-metric"
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
      metric_name                = "${local.waf_name}-sqli-metric"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = local.waf_name
    sampled_requests_enabled   = true
  }
  
  tags = merge(local.all_tags, {
    Name = local.waf_name
  })
}

# ===========================
# AWS Shield Standard
# ===========================
# Note: AWS Shield Standard is automatically enabled for all AWS accounts
# Shield Advanced requires manual subscription and is not available via Terraform

# ===========================
# IAM MFA Policy
# ===========================
# Note: IAM user MFA enforcement is typically done through console
# This policy can be attached to users/groups to enforce MFA
resource "aws_iam_policy" "mfa_enforcement" {
  name        = "${local.name_prefix}-mfa-enforcement-policy"
  description = "Policy to enforce MFA for IAM users"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnAccessKeys"
        Effect = "Allow"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnSigningCertificates"
        Effect = "Allow"
        Action = [
          "iam:DeleteSigningCertificate",
          "iam:ListSigningCertificates",
          "iam:UpdateSigningCertificate",
          "iam:UploadSigningCertificate"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnSSHPublicKeys"
        Effect = "Allow"
        Action = [
          "iam:DeleteSSHPublicKey",
          "iam:GetSSHPublicKey",
          "iam:ListSSHPublicKeys",
          "iam:UpdateSSHPublicKey",
          "iam:UploadSSHPublicKey"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnGitCredentials"
        Effect = "Allow"
        Action = [
          "iam:CreateServiceSpecificCredential",
          "iam:DeleteServiceSpecificCredential",
          "iam:ListServiceSpecificCredentials",
          "iam:ResetServiceSpecificCredential",
          "iam:UpdateServiceSpecificCredential"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnVirtualMFADevice"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice"
        ]
        Resource = "arn:aws:iam::*:mfa/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnUserMFA"
        Effect = "Allow"
        Action = [
          "iam:DeactivateMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
  
  tags = local.all_tags
}

# ===========================
# Outputs
# ===========================
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "launch_template_id" {
  description = "ID of the EC2 launch template"
  value       = aws_launch_template.main.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_s3_bucket_id" {
  description = "S3 bucket ID for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.id
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_s3_bucket_id" {
  description = "S3 bucket ID for Config"
  value       = aws_s3_bucket.config.id
}

output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "vpc_flow_logs_id" {
  description = "ID of the VPC Flow Logs"
  value       = aws_flow_log.main.id
}

output "vpc_flow_logs_group_name" {
  description = "CloudWatch Log Group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "mfa_enforcement_policy_arn" {
  description = "ARN of the MFA enforcement IAM policy"
  value       = aws_iam_policy.mfa_enforcement.arn
}
