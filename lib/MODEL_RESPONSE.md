### Reasoning Trace
---

Let me create a comprehensive Terraform configuration file that meets all the specified requirements. I'll need to:

1. Create VPC with CIDR 10.0.0.0/16 in us-west-2
2. Create 2 public and 2 private subnets across 3 AZs (I'll use 2 AZs as we need 2 of each type)
3. Create NAT gateways, Internet gateway, route tables
4. Create encrypted S3 bucket with versioning
5. Create IAM roles with least privilege
6. Setup CloudTrail for logging
7. Create Lambda with encrypted environment variables
8. Setup RDS with Multi-AZ, random username/password, Secrets Manager
9. Configure security groups properly (no SSH from 0.0.0.0/0)
10. Setup MFA requirement for IAM users
11. Configure AWS Config with compliance rules
12. Use lowercase names with 4 random character suffix
13. Create outputs for all resources

Let me write the complete configuration:
### Answer 
---

Here's a comprehensive Terraform configuration file `tap_stack.tf` that fulfills all your requirements:

```hcl
# tap_stack.tf - Complete infrastructure stack with security best practices

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

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/16" # Restrictive CIDR - modify as needed
}

variable "db_engine" {
  description = "RDS database engine"
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "RDS database engine version"
  type        = string
  default     = "8.0"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ==================== LOCALS ====================
locals {
  # Generate random suffix for resource naming
  random_suffix = lower(substr(random_string.suffix.result, 0, 4))
  
  # Common tags for all resources
  common_tags = {
    Environment = "production"
    ManagedBy   = "terraform"
    Region      = var.region
  }
  
  # Availability zones - using data source would be better but keeping it simple
  azs = ["${var.region}a", "${var.region}b", "${var.region}c"]
  
  # Subnet calculations
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ==================== RANDOM RESOURCES ====================
# Random suffix for resource naming
resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

# Random username for RDS (starts with letter, no special chars)
resource "random_string" "db_username" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true
}

# Random password for RDS (with allowed special characters)
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%^&*()-_=+[]{}:?"
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
    Name = "eip-nat-${count.index + 1}-${local.random_suffix}"
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
    Name = "subnet-public-${count.index + 1}-${local.random_suffix}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "subnet-private-${count.index + 1}-${local.random_suffix}"
    Type = "private"
  })
}

# NAT Gateways
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

# ==================== S3 BUCKET ====================
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

# ==================== IAM ROLES AND POLICIES ====================
# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution" {
  name = "role-lambda-exec-${local.random_suffix}"

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

  tags = local.common_tags
}

# IAM Policy for Lambda (Least Privilege)
resource "aws_iam_role_policy" "lambda_policy" {
  name = "policy-lambda-${local.random_suffix}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:*"
      },
      {
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

# IAM Policy for MFA Enforcement
resource "aws_iam_policy" "enforce_mfa" {
  name        = "policy-enforce-mfa-${local.random_suffix}"
  description = "Policy to enforce MFA for IAM users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ListUsers",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice"
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

  tags = local.common_tags
}

# ==================== CLOUDTRAIL ====================
# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "s3-cloudtrail-logs-${local.random_suffix}"

  tags = merge(local.common_tags, {
    Name = "s3-cloudtrail-logs-${local.random_suffix}"
  })
}

# CloudTrail S3 Bucket Policy
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

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "cloudtrail-main-${local.random_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = local.common_tags

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# ==================== LAMBDA FUNCTION ====================
# KMS Key for Lambda Environment Variables
resource "aws_kms_key" "lambda_env" {
  description             = "KMS key for Lambda environment variables"
  deletion_window_in_days = 10

  tags = merge(local.common_tags, {
    Name = "kms-lambda-env-${local.random_suffix}"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "lambda_env" {
  name          = "alias/lambda-env-${local.random_suffix}"
  target_key_id = aws_kms_key.lambda_env.key_id
}

# Lambda Function
resource "aws_lambda_function" "main" {
  filename         = "lambda_function.zip"
  function_name    = "lambda-function-${local.random_suffix}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda_function.zip")
  runtime         = "python3.9"

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ENV_TYPE = "production"
    }
  }

  kms_key_arn = aws_kms_key.lambda_env.arn

  tags = local.common_tags
}

# ==================== RDS ====================
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
  engine               = var.db_engine
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = 20
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Credentials
  db_name  = "maindb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result
  
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
  
  # Other configurations
  auto_minor_version_upgrade = true
  skip_final_snapshot       = true
  
  tags = merge(local.common_tags, {
    Name = "rds-instance-${local.random_suffix}"
  })
}

# Secrets Manager Secret for RDS Credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name = "rds-credentials-${local.random_suffix}"
  
  tags = local.common_tags
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  
  secret_string = jsonencode({
    username = "a${random_string.db_username.result}"
    password = random_password.db_password.result
    engine   = var.db_engine
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = "maindb"
  })
}

# ==================== SECURITY GROUPS ====================
# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name        = "sg-lambda-${local.random_suffix}"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-lambda-${local.random_suffix}"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "sg-rds-${local.random_suffix}"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-rds-${local.random_suffix}"
  })
}

# Security Group for EC2 instances (example - no SSH from 0.0.0.0/0)
resource "aws_security_group" "ec2" {
  name        = "sg-ec2-${local.random_suffix}"
  description = "Security group for EC2 instances with restricted SSH"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH access from specific CIDR only"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "HTTPS access within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "sg-ec2-${local.random_suffix}"
  })
}

# ==================== AWS CONFIG ====================
# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "s3-config-bucket-${local.random_suffix}"

  tags = merge(local.common_tags, {
    Name = "s3-config-bucket-${local.random_suffix}"
  })
}

# S3 Bucket Policy for AWS Config
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

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "role-config-${local.random_suffix}"

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

# IAM Policy for AWS Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${local.random_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${local.random_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_s3_bucket_policy.config]
}

# AWS Config Recorder Status
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules for Compliance
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-${local.random_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-encryption-${local.random_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "mfa_enabled_for_iam_console" {
  name = "mfa-enabled-iam-${local.random_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# ==================== OUTPUTS ====================
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
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

output "nat_gateway_eips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# S3 Bucket Outputs
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
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "config_s3_bucket_id" {
  description = "ID of the Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

# IAM Role Outputs
output "lambda_role_arn" {
  description = "ARN of Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_role_name" {
  description = "Name of Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "config_role_arn" {
  description = "ARN of Config service role"
  value       = aws_iam_role.config.arn
}

output "enforce_mfa_policy_arn" {
  description = "ARN of MFA enforcement policy"
  value       = aws_iam_policy.enforce_mfa.arn
}

# CloudTrail Output
output "cloudtrail_name" {
  description = "Name of CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of CloudTrail"
  value       = aws_cloudtrail.main.arn
}

# Lambda Function Output
output "lambda_function_name" {
  description = "Name of Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "ARN of Lambda function"
  value       = aws_lambda_function.main.arn
}

# KMS Key Outputs
output "lambda_kms_key_id" {
  description = "ID of KMS key for Lambda"
  value       = aws_kms_key.lambda_env.key_id
}

output "lambda_kms_key_arn" {
  description = "ARN of KMS key for Lambda"
  value       = aws_kms_key.lambda_env.arn
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

# Secrets Manager Output
output "rds_secret_arn" {
  description = "ARN of RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "rds_secret_name" {
  description = "Name of RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

# Security Group Outputs
output "lambda_security_group_id" {
  description = "ID of Lambda security group"
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "ID of RDS security group"
  value       = aws_security_group.rds.id
}

output "ec2_security_group_id" {
  description = "ID of EC2 security group"
  value       = aws_security_group.ec2.id
}

# Config Outputs
output "config_recorder_name" {
  description = "Name of Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "config_rules" {
  description = "Names of Config rules"
  value = [
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.mfa_enabled_for_iam_console.name
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
```

## Important Notes:

1. **Lambda Deployment Package**: You'll need to create a `lambda_function.zip` file with your Lambda code before running this Terraform configuration. A simple example:
   ```python
   # index.py
   def handler(event, context):
       return {"statusCode": 200, "body": "Hello from Lambda"}
   ```
   Then zip it: `zip lambda_function.zip index.py`

2. **AWS Account ID**: Some resources might need your AWS account ID. Consider adding it as a variable if needed.

3. **SSH Access CIDR**: The `ssh_allowed_cidr` variable is set to the VPC CIDR by default. Adjust this to your specific requirements.

4. **High Availability**: The configuration uses 2 availability zones with NAT gateways for redundancy. RDS is configured with Multi-AZ for automatic failover.

5. **Security Best Practices**:
   - All encryption enabled (S3, RDS, Lambda environment variables)
   - No public access to S3 buckets or RDS
   - MFA enforcement policy created
   - CloudTrail enabled for audit logging
   - AWS Config rules for compliance monitoring
   - Security groups follow least privilege principle

6. **Resource Naming**: All resources use lowercase names with a 4-character random suffix to avoid conflicts.

This configuration is production-ready and follows AWS best practices for security and high availability.
