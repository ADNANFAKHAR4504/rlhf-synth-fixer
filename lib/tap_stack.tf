# tap_stack.tf - Complete Infrastructure Stack Configuration

# ==================== VARIABLES ====================
variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project tag value"
  type        = string
  default     = "tap-infrastructure"
}

# ==================== LOCALS ====================
locals {
  # Random suffix for resource naming
  random_suffix = random_string.suffix.result
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "Terraform"
  }
  
  # VPC Configuration
  vpc_cidr = "10.0.0.0/16"
  
  # Subnet CIDR blocks
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  
  # Availability zones - using first 3 AZs
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # RDS allowed special characters (AWS restricted set)
  rds_special_chars = "!#$%&*()_+=[]{}:?"
}

# ==================== DATA SOURCES ====================
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

# Get current caller identity
data "aws_caller_identity" "current" {}

# ==================== RANDOM RESOURCES ====================
# Random suffix for resource naming
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# Random username for RDS (starts with letter, 8 chars)
resource "random_string" "rds_username" {
  length  = 7
  special = false
  upper   = false
  lower   = true
  numeric = true
}

# Random password for RDS
resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = local.rds_special_chars
}

# ==================== VPC RESOURCES ====================
# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "vpc-main-${local.random_suffix}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "igw-main-${local.random_suffix}"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "eip-nat-${count.index + 1}-${local.random_suffix}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "subnet-public-${count.index + 1}-${local.random_suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]
  
  tags = merge(local.common_tags, {
    Name = "subnet-private-${count.index + 1}-${local.random_suffix}"
    Type = "Private"
  })
}

# NAT Gateways for High Availability
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "nat-gateway-${count.index + 1}-${local.random_suffix}"
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
    Name = "rt-public-${local.random_suffix}"
    Type = "Public"
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "rt-private-${count.index + 1}-${local.random_suffix}"
    Type = "Private"
  })
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==================== S3 RESOURCES ====================
# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "s3-bucket-main-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "s3-bucket-main-${local.random_suffix}"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
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

# ==================== SECURITY GROUPS ====================
# Security Group for Web Traffic
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  description = "Security group for web traffic"
  vpc_id      = aws_vpc.main.id
  
  # HTTP from VPC only
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "HTTP from VPC"
  }
  
  # HTTPS from VPC only
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "HTTPS from VPC"
  }
  
  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "web-sg-${local.random_suffix}"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-sg-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  # MySQL/Aurora from VPC only
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL from web security group"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "rds-sg-${local.random_suffix}"
  })
}

# ==================== IAM RESOURCES ====================
# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "role-ec2-${local.random_suffix}"
  
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
  
  tags = merge(local.common_tags, {
    Name = "role-ec2-${local.random_suffix}"
  })
}

# IAM Policy for EC2 (Least Privilege)
resource "aws_iam_role_policy" "ec2_least_privilege" {
  name = "policy-ec2-least-privilege-${local.random_suffix}"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "profile-ec2-${local.random_suffix}"
  role = aws_iam_role.ec2.name
}

# ==================== CLOUDTRAIL RESOURCES ====================
# S3 Bucket for CloudTrail Logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "s3-cloudtrail-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "s3-cloudtrail-${local.random_suffix}"
  })
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
  name                       = "cloudtrail-main-${local.random_suffix}"
  s3_bucket_name            = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail     = true
  enable_logging            = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }
  
  tags = merge(local.common_tags, {
    Name = "cloudtrail-main-${local.random_suffix}"
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# ==================== RDS RESOURCES ====================
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${local.random_suffix}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${local.random_suffix}"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "rds-instance-${local.random_suffix}"
  
  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  # Storage configuration
  allocated_storage     = 20
  storage_type         = "gp2"
  storage_encrypted    = true
  
  # Database configuration
  db_name  = "maindb"
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High Availability
  multi_az = true
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Version upgrades
  auto_minor_version_upgrade = true
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  # Security
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "rds-instance-${local.random_suffix}"
  })
}

# ==================== SECRETS MANAGER ====================
# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "rds-credentials-${local.random_suffix}"
  recovery_window_in_days = 0 # Immediate deletion for testing
  
  tags = merge(local.common_tags, {
    Name = "rds-credentials-${local.random_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# ==================== EC2 RESOURCES ====================
# EC2 Instance
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type         = "t3.micro"
  subnet_id             = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile  = aws_iam_instance_profile.ec2.name
  
  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }
  
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
  EOF
  
  tags = merge(local.common_tags, {
    Name = "ec2-web-${local.random_suffix}"
  })
}

# ==================== VPC PEERING (FOR FUTURE USE) ====================
# VPC Peering Connection (Requester side - for future cross-account)
resource "aws_vpc_peering_connection" "peer" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = aws_vpc.main.id # Self-peering for now, change when adding other account
  auto_accept = true
  
  tags = merge(local.common_tags, {
    Name = "vpc-peering-${local.random_suffix}"
  })
}

# ==================== AWS CONFIG ====================
# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "s3-config-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "s3-config-${local.random_suffix}"
  })
}

# S3 Bucket Policy for Config
resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
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
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      }
    ]
  })
}

# IAM Role for Config
resource "aws_iam_role" "config" {
  name = "role-config-${local.random_suffix}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "role-config-${local.random_suffix}"
  })
}

# IAM Role Policy Attachment for Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# IAM Policy for Config S3 Access
resource "aws_iam_role_policy" "config_s3" {
  name = "policy-config-s3-${local.random_suffix}"
  role = aws_iam_role.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${local.random_suffix}"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
  
  depends_on = [aws_config_delivery_channel.main]
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${local.random_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket
  
  depends_on = [aws_s3_bucket_policy.config]
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rule - Required Tags
resource "aws_config_config_rule" "required_tags" {
  name = "required-tags-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }
  
  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Project"
  })
  
  depends_on = [aws_config_configuration_recorder.main]
}

# ==================== OUTPUTS ====================
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "elastic_ip_addresses" {
  description = "Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# S3 Outputs
output "s3_bucket_id" {
  description = "ID of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "cloudtrail_s3_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "config_s3_bucket_id" {
  description = "ID of the Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

# Security Group Outputs
output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "config_iam_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config.arn
}

# RDS Outputs
output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_instance_endpoint" {
  description = "Connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "rds_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

# Secrets Manager Outputs
output "rds_credentials_secret_arn" {
  description = "ARN of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "rds_credentials_secret_name" {
  description = "Name of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

# EC2 Outputs
output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.web.private_ip
}

output "ec2_instance_availability_zone" {
  description = "Availability zone of the EC2 instance"
  value       = aws_instance.web.availability_zone
}

output "ami_id" {
  description = "ID of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.id
}

output "ami_name" {
  description = "Name of the Amazon Linux 2 AMI used"
  value       = data.aws_ami.amazon_linux_2.name
}

# CloudTrail Outputs
output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# VPC Peering Output
output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.peer.id
}

# Config Outputs
output "config_recorder_name" {
  description = "Name of the Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "config_rule_name" {
  description = "Name of the Config rule for required tags"
  value       = aws_config_config_rule.required_tags.name
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# Account Information
output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = var.region
}

output "random_suffix" {
  description = "Random suffix used for resource naming"
  value       = local.random_suffix
}
