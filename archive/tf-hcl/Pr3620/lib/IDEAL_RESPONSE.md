```hcl
# tap_stack.tf - Complete Infrastructure Stack Configuration

# ==========================================
# VARIABLES
# ==========================================

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-2"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0" # Restrict this in production
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_engine" {
  description = "RDS engine type"
  type        = string
  default     = "mysql"
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

# ==========================================
# DATA SOURCES
# ==========================================

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

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ==========================================
# LOCALS
# ==========================================

locals {
  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Subnet CIDR calculations
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Stack       = "tap-stack"
  }
}

# ==========================================
# RANDOM RESOURCES FOR RDS CREDENTIALS
# ==========================================

# Random string for RDS master username (8 chars, starts with letter)
resource "random_string" "rds_username" {
  length  = 7
  special = false
  number  = false
  upper   = false
}

# Random password for RDS (16 chars with special characters)
resource "random_password" "rds_password" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
}

# ==========================================
# VPC AND NETWORKING
# ==========================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "tap-vpc-${var.region}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    {
      Name = "tap-igw-${var.region}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    {
      Name = "tap-public-subnet-${count.index + 1}-${local.azs[count.index]}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "tap-private-subnet-${count.index + 1}-${local.azs[count.index]}"
      Type = "private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(
    local.common_tags,
    {
      Name = "tap-nat-eip-${count.index + 1}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    {
      Name = "tap-nat-gateway-${count.index + 1}-${local.azs[count.index]}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-public-rt"
    }
  )
}

# Route Tables for Private Subnets (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-private-rt-${count.index + 1}"
    }
  )
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==========================================
# SECURITY GROUPS
# ==========================================

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "tap-ec2-sg-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  # SSH access from specified CIDR
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH access"
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-ec2-security-group"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "tap-rds-sg-"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # MySQL/Aurora access from EC2 security group
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "MySQL access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-rds-security-group"
    }
  )
}

# ==========================================
# IAM ROLES AND POLICIES
# ==========================================

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "tap-ec2-cloudwatch-role"

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

# IAM Policy for CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "tap-ec2-cloudwatch-logs-policy"
  description = "Policy to allow EC2 instances to write to CloudWatch Logs"

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
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = local.common_tags
}

# Attach CloudWatch Logs policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tap-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}

# ==========================================
# KMS KEY FOR S3 ENCRYPTION
# ==========================================

resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "tap-s3-kms-key"
    }
  )
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/tap-s3-encryption"
  target_key_id = aws_kms_key.s3_key.key_id
}

# ==========================================
# S3 BUCKET
# ==========================================

resource "aws_s3_bucket" "main" {
  bucket = "tap-secure-bucket-${data.aws_caller_identity.current.account_id}-${var.region}"

  tags = merge(
    local.common_tags,
    {
      Name = "tap-secure-bucket"
    }
  )
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
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

# ==========================================
# EC2 INSTANCES
# ==========================================

# EC2 Instances in Public Subnets
resource "aws_instance" "public" {
  count                  = 3
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public[count.index].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  monitoring             = true # Enable detailed monitoring

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-ec2-public-${count.index + 1}"
      Type = "public"
    }
  )
}

# EC2 Instances in Private Subnets
resource "aws_instance" "private" {
  count                  = 3
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.private[count.index].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  monitoring             = true # Enable detailed monitoring

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-ec2-private-${count.index + 1}"
      Type = "private"
    }
  )
}

# ==========================================
# RDS DATABASE
# ==========================================

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "tap-rds-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "tap-rds-subnet-group"
    }
  )
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "tap-rds-instance"

  engine         = var.rds_engine
  engine_version = var.rds_engine_version
  instance_class = var.rds_instance_class

  allocated_storage     = var.rds_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "tapdb"
  username = "a${random_string.rds_username.result}"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = true
  publicly_accessible    = false
  auto_minor_version_upgrade = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "tap-rds-instance"
    }
  )
}

# ==========================================
# SECRETS MANAGER
# ==========================================

# Secret for RDS credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "tap-rds-credentials-${var.region}"
  description             = "RDS master credentials"
  recovery_window_in_days = 0 # For immediate deletion in dev/test

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username.result}"
    password = random_password.rds_password.result
    engine   = var.rds_engine
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# ==========================================
# DYNAMODB TABLE
# ==========================================

resource "aws_dynamodb_table" "main" {
  name           = "tap-dynamodb-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "timestamp"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "tap-dynamodb-table"
    }
  )
}

# DynamoDB Auto Scaling Role
resource "aws_iam_role" "dynamodb_autoscaling_role" {
  name = "tap-dynamodb-autoscaling-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "application-autoscaling.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach DynamoDB scaling policy
resource "aws_iam_role_policy_attachment" "dynamodb_autoscaling" {
  role       = aws_iam_role.dynamodb_autoscaling_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/DynamoDBAutoscaleRole"
}

# ==========================================
# CLOUDWATCH ALARMS
# ==========================================

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "tap-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# ==========================================
# OUTPUTS
# ==========================================

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

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.s3_key.arn
}

output "public_ec2_instance_ids" {
  description = "IDs of the public EC2 instances"
  value       = aws_instance.public[*].id
}

output "private_ec2_instance_ids" {
  description = "IDs of the private EC2 instances"
  value       = aws_instance.private[*].id
}

output "public_ec2_instance_private_ips" {
  description = "Private IPs of the public EC2 instances"
  value       = aws_instance.public[*].private_ip
}

output "private_ec2_instance_private_ips" {
  description = "Private IPs of the private EC2 instances"
  value       = aws_instance.private[*].private_ip
}

output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux_2.id
}

output "ami_name" {
  description = "AMI name used for EC2 instances"
  value       = data.aws_ami.amazon_linux_2.name
}

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "rds_subnet_group_name" {
  description = "Name of the RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

output "dynamodb_autoscaling_role_arn" {
  description = "ARN of the DynamoDB autoscaling IAM role"
  value       = aws_iam_role.dynamodb_autoscaling_role.arn
}

output "cloudwatch_alarm_rds_cpu_name" {
  description = "Name of the CloudWatch alarm for RDS CPU"
  value       = aws_cloudwatch_metric_alarm.rds_cpu.alarm_name
}

output "cloudwatch_alarm_rds_cpu_arn" {
  description = "ARN of the CloudWatch alarm for RDS CPU"
  value       = aws_cloudwatch_metric_alarm.rds_cpu.arn
}

output "availability_zones" {
  description = "Availability zones used in the deployment"
  value       = local.azs
}

output "region" {
  description = "AWS region of deployment"
  value       = var.region
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
```

#provider.tf

```hcl
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
  region = var.region
}
```
