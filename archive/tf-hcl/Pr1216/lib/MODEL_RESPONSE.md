# 🛡️ AWS Secure Infrastructure Setup

I'll design a comprehensive, secure AWS infrastructure using Terraform that follows security best practices and compliance requirements. Here's the complete implementation:

## 📁 Project Structure

```
aws-secure-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tf
├── modules/
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── security/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

## 🔧 Core Configuration Files

### terraform.tf
```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Secure state management with encryption
  backend "s3" {
    bucket         = "prod-sec-terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "prod-sec-terraform-locks"
    
    # Enable versioning and server-side encryption
    versioning = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "secure-infrastructure"
      ManagedBy     = "terraform"
      SecurityLevel = "high"
      Compliance    = "required"
    }
  }
}
```

### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "sec"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "iam_users" {
  description = "List of IAM users to create"
  type = list(object({
    name = string
    role = string
  }))
  default = [
    {
      name = "dev-user"
      role = "developer"
    },
    {
      name = "ops-user"
      role = "operations"
    },
    {
      name = "audit-user"
      role = "auditor"
    }
  ]
}
```

### main.tf
```hcl
# Data sources
data "aws_caller_identity" "current" {}

# Random password for secure configurations
resource "random_password" "master_password" {
  length  = 32
  special = true
}

# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "${var.environment}-${var.project_name}-main-key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.environment}-${var.project_name}-main-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.project_name}-main-key"
  target_key_id = aws_kms_key.main.key_id
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  environment  = var.environment
  project_name = var.project_name
  iam_users    = var.iam_users
  kms_key_arn  = aws_kms_key.main.arn
}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  environment        = var.environment
  project_name       = var.project_name
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
}

# Security Module
module "security" {
  source = "./modules/security"
  
  environment  = var.environment
  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  kms_key_arn  = aws_kms_key.main.arn
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment  = var.environment
  project_name = var.project_name
  kms_key_arn  = aws_kms_key.main.arn
}
```

## 🔐 IAM Module

### modules/iam/main.tf
```hcl
# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers               = true
  require_uppercase_characters  = true
  require_symbols              = true
  allow_users_to_change_password = true
  max_password_age             = 90
  password_reuse_prevention    = 12
}

# Developer Role
resource "aws_iam_role" "developer" {
  name = "${var.environment}-${var.project_name}-developer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-${var.project_name}-developer-role"
  }
}

# Developer Policy - Least Privilege
resource "aws_iam_policy" "developer" {
  name        = "${var.environment}-${var.project_name}-developer-policy"
  description = "Developer access policy with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeSnapshots",
          "ec2:DescribeVolumes",
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:*:instance/*",
          "arn:aws:s3:::${var.environment}-${var.project_name}-*",
          "arn:aws:s3:::${var.environment}-${var.project_name}-*/*",
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.environment}-${var.project_name}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [var.kms_key_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "developer" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer.arn
}

# Operations Role
resource "aws_iam_role" "operations" {
  name = "${var.environment}-${var.project_name}-operations-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-${var.project_name}-operations-role"
  }
}

# Operations Policy
resource "aws_iam_policy" "operations" {
  name        = "${var.environment}-${var.project_name}-operations-policy"
  description = "Operations access policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "cloudwatch:*",
          "logs:*",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:*:*",
          "arn:aws:s3:::${var.environment}-${var.project_name}-*",
          "arn:aws:s3:::${var.environment}-${var.project_name}-*/*",
          "arn:aws:logs:${var.aws_region}:*:*",
          "arn:aws:ssm:${var.aws_region}:*:parameter/${var.environment}/${var.project_name}/*",
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.environment}/${var.project_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = [var.kms_key_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "operations" {
  role       = aws_iam_role.operations.name
  policy_arn = aws_iam_policy.operations.arn
}

# Auditor Role - Read-only access
resource "aws_iam_role" "auditor" {
  name = "${var.environment}-${var.project_name}-auditor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-${var.project_name}-auditor-role"
  }
}

resource "aws_iam_role_policy_attachment" "auditor_readonly" {
  role       = aws_iam_role.auditor.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# IAM Users with MFA requirement
resource "aws_iam_user" "users" {
  for_each = { for user in var.iam_users : user.name => user }
  
  name          = "${var.environment}-${var.project_name}-${each.value.name}"
  force_destroy = true

  tags = {
    Name = "${var.environment}-${var.project_name}-${each.value.name}"
    Role = each.value.role
  }
}

# User policies that require MFA
resource "aws_iam_user_policy" "mfa_requirement" {
  for_each = aws_iam_user.users
  
  name = "${each.value.name}-mfa-policy"
  user = each.value.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices",
          "iam:GetUser",
          "iam:GetLoginProfile"
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
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
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
}

# Assume role policies for users
resource "aws_iam_user_policy" "assume_role" {
  for_each = aws_iam_user.users
  
  name = "${each.value.name}-assume-role-policy"
  user = each.value.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = local.role_mappings[var.iam_users[index(var.iam_users.*.name, replace(each.value.name, "${var.environment}-${var.project_name}-", ""))].role]
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

# Local values for role mapping
locals {
  role_mappings = {
    developer  = aws_iam_role.developer.arn
    operations = aws_iam_role.operations.arn
    auditor    = aws_iam_role.auditor.arn
  }
}
```

### modules/iam/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "iam_users" {
  description = "List of IAM users to create"
  type = list(object({
    name = string
    role = string
  }))
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

data "aws_caller_identity" "current" {}
```

## 🌐 Networking Module

### modules/networking/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"
  
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.environment}-${var.project_name}-eip-nat-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.environment}-${var.project_name}-nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.environment}-${var.project_name}-public-rt"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.environment}-${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/${var.environment}-${var.project_name}-flow-logs"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-${var.project_name}-vpc-flow-logs"
  }
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-${var.project_name}-flow-log-role"

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
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.environment}-${var.project_name}-flow-log-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
```

### modules/networking/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}
```

### modules/networking/outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

## 🔒 Security Module

### modules/security/main.tf
```hcl
# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-${var.project_name}-web-"
  vpc_id      = var.vpc_id
  description = "Security group for web servers"

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.project_name}-web-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.environment}-${var.project_name}-db-"
  vpc_id      = var.vpc_id
  description = "Security group for database servers"

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.project_name}-db-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ssh" {
  name_prefix = "${var.environment}-${var.project_name}-ssh-"
  vpc_id      = var.vpc_id
  description = "Security group for SSH access"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only from VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.project_name}-ssh-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Bucket for secure storage
resource "aws_s3_bucket" "secure_storage" {
  bucket        = "${var.environment}-${var.project_name}-secure-storage-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name = "${var.environment}-${var.project_name}-secure-storage"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secure_storage" {
  bucket = aws_s3_bucket.secure_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_storage" {
  bucket = aws_s3_bucket.secure_storage.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secure_storage" {
  bucket = aws_s3_bucket.secure_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Logging
resource "aws_s3_bucket_logging" "secure_storage" {
  bucket = aws_s3_bucket.secure_storage.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

# S3 Access Logs Bucket
resource "aws_s3_bucket" "access_logs" {
  bucket        = "${var.environment}-${var.project_name}-access-logs-${random_id.logs_bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name = "${var.environment}-${var.project_name}-access-logs"
  }
}

resource "random_id" "logs_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Secrets Manager for sensitive data
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.environment}/${var.project_name}/app-secrets"
  description             = "Application secrets"
  kms_key_id             = var.kms_key_arn
  recovery_window_in_days = 7

  tags = {
    Name = "${var.environment}-${var.project_name}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = "change-me-in-production"
    api_key          = "change-me-in-production"
    jwt_secret       = "change-me-in-production"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# SSM Parameters for configuration
resource "aws_ssm_parameter" "app_config" {
  for_each = {
    "database_host" = "localhost"
    "database_port" = "3306"
    "app_env"      = var.environment
    "log_level"    = "INFO"
  }

  name  = "/${var.environment}/${var.project_name