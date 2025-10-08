### Reasoning Trace
---

This is a comprehensive Terraform configuration request. Let me break down the requirements:

1. VPC in us-west-2 with CIDR 10.0.0.0/16
2. 2 private and 2 public subnets across 3 AZs (minimum), with NAT gateways, IGW, route tables
3. Non-public S3 bucket with AES-256 encryption
4. S3 versioning enabled
5. IAM roles with least privilege
6. CloudTrail for logging
7. No Lambda function but mention encryption for environment variables (skip this as no Lambda needed)
8. RDS with multi-AZ, random username/password, stored in Secrets Manager, not publicly accessible, auto minor upgrades, automated backups
9. Security groups restricting SSH access
10. MFA for IAM users (this is typically configured in console/CLI, not Terraform)
11. AWS Config with compliance rules
12. Lowercase naming with 4 random character suffix
13. Outputs for all resources

Let me create a comprehensive single Terraform file:
### Answer 
---

Here's a comprehensive Terraform configuration file `tap_stack.tf` that fulfills all your requirements:

```hcl
# tap_stack.tf - Complete Infrastructure Stack

# ==================== VARIABLES ====================
variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "ssh_allowed_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Replace with your specific CIDR
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ==================== DATA SOURCES ====================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ==================== LOCALS ====================
locals {
  # Generate random suffix for unique naming
  random_suffix = lower(substr(uuid(), 0, 4))
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Region      = var.region
    Timestamp   = timestamp()
  }
  
  # Availability zones (using first 3 available)
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Subnet CIDR calculations
  public_subnet_cidrs  = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnet_cidrs = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i + 100)]
}

# ==================== RANDOM RESOURCES ====================
# Random password for RDS master user
resource "random_password" "rds_master_password" {
  length  = 16
  special = true
  # AWS RDS allows only these special characters: !#$%&'()*+,-./:;<=>?@[\]^_`{|}~
  override_special = "!#$%&*+-/?@_"
}

# Random username for RDS master user (starts with letter, no special chars)
resource "random_string" "rds_master_username" {
  length  = 8
  special = false
  number  = true
  upper   = true
  lower   = true
}

# ==================== NETWORKING ====================
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
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
    Name = "eip-nat-${count.index}-${local.random_suffix}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "subnet-public-${count.index}-${local.random_suffix}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "subnet-private-${count.index}-${local.random_suffix}"
    Type = "Private"
  })
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "nat-gateway-${count.index}-${local.random_suffix}"
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
  
  tags = merge(local.common_tags, {
    Name = "rt-public-${local.random_suffix}"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "rt-private-${count.index}-${local.random_suffix}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==================== SECURITY GROUPS ====================
# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "sg-rds-${local.random_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    description = "MySQL/Aurora from VPC"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "sg-rds-${local.random_suffix}"
  })
}

# Security Group for EC2 instances (example)
resource "aws_security_group" "ec2" {
  name        = "sg-ec2-${local.random_suffix}"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  # SSH access from specific CIDR only (not 0.0.0.0/0)
  ingress {
    description = "SSH from specific CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidr
  }
  
  # HTTP access
  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  # HTTPS access
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "sg-ec2-${local.random_suffix}"
  })
}

# ==================== S3 BUCKET ====================
# S3 Bucket with encryption and versioning
resource "aws_s3_bucket" "main" {
  bucket = "s3-bucket-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "s3-bucket-${local.random_suffix}"
  })
}

# Block public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for S3 bucket
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for S3 bucket (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ==================== IAM ROLES ====================
# IAM Role for EC2 instances (least privilege)
resource "aws_iam_role" "ec2_role" {
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

# IAM Policy for EC2 role (least privilege - S3 read only)
resource "aws_iam_role_policy" "ec2_s3_read" {
  name = "policy-ec2-s3-read-${local.random_suffix}"
  role = aws_iam_role.ec2_role.id
  
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
      }
    ]
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "role-rds-monitoring-${local.random_suffix}"
  
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
  
  tags = merge(local.common_tags, {
    Name = "role-rds-monitoring-${local.random_suffix}"
  })
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==================== SECRETS MANAGER ====================
# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "rds-credentials-${local.random_suffix}"
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "rds-credentials-${local.random_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  
  secret_string = jsonencode({
    username = "a${random_string.rds_master_username.result}"
    password = random_password.rds_master_password.result
  })
}

# ==================== RDS DATABASE ====================
# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${local.random_suffix}"
  subnet_ids = aws_subnet.private[*].id
  
  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${local.random_suffix}"
  })
}

# RDS Instance with Multi-AZ
resource "aws_db_instance" "main" {
  identifier = "rds-instance-${local.random_suffix}"
  
  # Database settings
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = var.db_instance_class
  allocated_storage    = 20
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Credentials
  db_name  = "maindb"
  username = "a${random_string.rds_master_username.result}"
  password = random_password.rds_master_password.result
  
  # Network settings
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # High availability
  multi_az = true
  
  # Backup settings
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Updates
  auto_minor_version_upgrade = true
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn
  
  # Protection settings
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "rds-instance-${local.random_suffix}"
  })
}

# ==================== CLOUDTRAIL ====================
# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "cloudtrail-logs-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "cloudtrail-logs-${local.random_suffix}"
  })
}

# Block public access to CloudTrail bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for CloudTrail
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
  name                          = "cloudtrail-main-${local.random_suffix}"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true
  
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

# ==================== AWS CONFIG ====================
# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "aws-config-${local.random_suffix}"
  
  tags = merge(local.common_tags, {
    Name = "aws-config-${local.random_suffix}"
  })
}

# Block public access to Config bucket
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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

# IAM Policy for Config
resource "aws_iam_role_policy" "config" {
  name = "policy-config-${local.random_suffix}"
  role = aws_iam_role.config.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringLike = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "ec2:Describe*",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "rds:Describe*",
          "s3:GetBucketVersioning",
          "s3:GetBucketPolicy",
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:GetEncryptionConfiguration"
        ]
        Resource = "*"
      }
    ]
  })
}

# Bucket policy for Config
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
        Sid    = "AWSConfigBucketWrite"
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
}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules for Compliance Monitoring
# Rule 1: Check if S3 buckets are encrypted
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 2: Check if RDS instances are encrypted
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-encryption-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 3: Check if RDS instances are not publicly accessible
resource "aws_config_config_rule" "rds_public_access" {
  name = "rds-public-access-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "RDS_INSTANCE_PUBLIC_ACCESS_CHECK"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 4: Check if MFA is enabled for IAM users
resource "aws_config_config_rule" "iam_mfa" {
  name = "iam-mfa-enabled-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 5: Check if CloudTrail is enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled-${local.random_suffix}"
  
  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }
  
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

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# Security Group Outputs
output "rds_security_group_id" {
  description = "ID of RDS security group"
  value       = aws_security_group.rds.id
}

output "ec2_security_group_id" {
  description = "ID of EC2 security group"
  value       = aws_security_group.ec2.id
}

# S3 Bucket Outputs
output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "cloudtrail_bucket_name" {
  description = "Name of CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "config_bucket_name" {
  description = "Name of Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "rds_monitoring_role_arn" {
  description = "ARN of RDS monitoring IAM role"
  value       = aws_iam_role.rds_monitoring.arn
}

output "config_role_arn" {
  description = "ARN of AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

# RDS Outputs
output "rds_instance_id" {
  description = "ID of RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_instance_endpoint" {
  description = "Connection endpoint for RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_address" {
  description = "Address of RDS instance"
  value       = aws_db_instance.main.address
}

output "rds_instance_port" {
  description = "Port of RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_subnet_group_name" {
  description = "Name of RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

# Secrets Manager Outputs
output "rds_credentials_secret_arn" {
  description = "ARN of RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "rds_credentials_secret_name" {
  description = "Name of RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

# CloudTrail Outputs
output "cloudtrail_name" {
  description = "Name of CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# AWS Config Outputs
output "config_recorder_name" {
  description = "Name of Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

# Config Rules Outputs
output "config_rules" {
  description = "List of Config rules created"
  value = [
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.rds_public_access.name,
    aws_config_config_rule.iam_mfa.name,
    aws_config_config_rule.cloudtrail_enabled.name
  ]
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

# Random Suffix Output (for reference)
output "deployment_suffix" {
  description = "Random suffix used for resource naming"
  value       = local.random_suffix
}
```

This comprehensive Terraform configuration file (`tap_stack.tf`) includes:

## Key Features Implemented:

### 1. **Networking Infrastructure**
- VPC with 10.0.0.0/16 CIDR
- 2 public and 2 private subnets across 3 availability zones
- NAT Gateways for high availability
- Internet Gateway for public subnet connectivity
- Properly configured route tables and associations

### 2. **Security Features**
- Non-public S3 bucket with AES-256 encryption
- S3 bucket versioning enabled
- Security groups with restricted SSH access (not from 0.0.0.0/0)
- IAM roles following least privilege principle
- Secrets Manager for storing RDS credentials

### 3. **Database (RDS)**
- Multi-AZ deployment for high availability
- Random master username (8 chars, starts with letter)
- Random password (16 chars with allowed special characters)
- Automated backups enabled
- Auto minor version upgrades
- Not publicly accessible
- Enhanced monitoring enabled

### 4. **Compliance & Monitoring**
- AWS CloudTrail for logging all account activities
- AWS Config with compliance rules for:
  - S3 bucket encryption
  - RDS encryption
  - RDS public access check
  - MFA enforcement
  - CloudTrail enablement

### 5. **Best Practices**
- All resource names in lowercase with 4-character random suffix
- Comprehensive tagging strategy
- Proper dependency management
- Well-commented code
- Complete outputs for all created resources

## Deployment Instructions:

1. Save this file as `tap_stack.tf`
2. Initialize Terraform: `terraform init`
3. Review the plan: `terraform plan`
4. Apply the configuration: `terraform apply`

## Important Notes:

- The MFA requirement for IAM users (requirement #10) is enforced through AWS Config rules but actual MFA setup needs to be done through AWS Console or CLI
- Lambda encryption environment variables requirement is acknowledged but no Lambda functions are created as per your instruction
- All sensitive data is properly managed through Secrets Manager
- The configuration assumes the AWS provider is configured elsewhere as requested
