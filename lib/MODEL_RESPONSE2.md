# Fully Modularized Secure AWS Infrastructure Terraform Configuration

I'll create a completely modularized Terraform configuration where all resources are properly organized into modules. This ensures better reusability, maintainability, and adherence to Terraform best practices.

## Directory Structure
```
terraform-secure-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
└── modules/
    ├── kms/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── vpc/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── iam/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── s3/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── monitoring/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Root Configuration Files

### `main.tf`

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
      version = "~> 3.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SecurityConfiguration"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedBy   = "SecConfig-Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Module - Must be created first for encryption
module "kms" {
  source = "./modules/kms"
  
  key_description = var.kms_key_description
  key_usage       = var.kms_key_usage
  
  tags = {
    Project = "SecurityConfiguration"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  
  tags = {
    Project = "SecurityConfiguration"
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  terraform_user_name = var.terraform_user_name
  
  tags = {
    Project = "SecurityConfiguration"
  }
}

# Security Module
module "security" {
  source = "./modules/security"
  
  vpc_id         = module.vpc.vpc_id
  allowed_ssh_ip = var.allowed_ssh_ip
  kms_key_arn    = module.kms.key_arn
  
  tags = {
    Project = "SecurityConfiguration"
  }
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  kms_key_arn = module.kms.key_arn
  
  tags = {
    Project = "SecurityConfiguration"
  }
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  kms_key_arn = module.kms.key_arn
  
  tags = {
    Project = "SecurityConfiguration"
  }
}
```

### `variables.tf`

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnet CIDRs must be provided for high availability."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "At least 2 private subnet CIDRs must be provided for high availability."
  }
}

variable "allowed_ssh_ip" {
  description = "IP address allowed for SSH access (CIDR format)"
  type        = string
  validation {
    condition     = can(cidrhost(var.allowed_ssh_ip, 0))
    error_message = "Must be a valid IP address in CIDR notation (e.g., 203.0.113.0/32)."
  }
}

variable "terraform_user_name" {
  description = "Name for Terraform IAM user"
  type        = string
  default     = "SecConfig-Terraform-User"
}

variable "kms_key_description" {
  description = "Description for KMS key"
  type        = string
  default     = "SecConfig KMS key for encryption"
}

variable "kms_key_usage" {
  description = "Usage for KMS key"
  type        = string
  default     = "ENCRYPT_DECRYPT"
}
```

### `outputs.tf`

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = module.kms.key_arn
}

output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = module.s3.main_bucket_name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform IAM user"
  value       = module.iam.terraform_user_arn
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = module.security.ssh_security_group_id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = module.monitoring.cloudtrail_name
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = module.monitoring.guardduty_detector_id
}
```

### `terraform.tfvars.example`

```hcl
aws_region               = "us-west-2"
environment             = "production"
vpc_cidr                = "10.0.0.0/16"
public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs    = ["10.0.10.0/24", "10.0.20.0/24"]
allowed_ssh_ip          = "203.0.113.0/32"  # Replace with your IP
terraform_user_name     = "SecConfig-Terraform-User"
kms_key_description     = "SecConfig KMS key for encryption"
```

## Module Configurations

### `modules/kms/main.tf`

```hcl
data "aws_caller_identity" "current" {}

resource "aws_kms_key" "main" {
  description             = var.key_description
  deletion_window_in_days = 7
  key_usage               = var.key_usage
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Config Service"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "SecConfig-KMS-Key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/secconfig-key"
  target_key_id = aws_kms_key.main.key_id
}
```

### `modules/kms/variables.tf`

```hcl
variable "key_description" {
  description = "Description for the KMS key"
  type        = string
  default     = "SecConfig KMS key for encryption"
}

variable "key_usage" {
  description = "Usage for the KMS key"
  type        = string
  default     = "ENCRYPT_DECRYPT"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/kms/outputs.tf`

```hcl
output "key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "key_alias" {
  description = "Alias of the KMS key"
  value       = aws_kms_alias.main.name
}
```

### `modules/vpc/main.tf`

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "SecConfig-VPC"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "SecConfig-IGW"
  })
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "SecConfig-Public-Subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "SecConfig-Private-Subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "SecConfig-EIP-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "SecConfig-NAT-Gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "SecConfig-Public-RT"
  })
}

resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "SecConfig-Private-RT-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### `modules/vpc/variables.tf`

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/vpc/outputs.tf`

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
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

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

### `modules/iam/main.tf`

```hcl
# Terraform user with limited permissions for infrastructure creation
resource "aws_iam_user" "terraform_user" {
  name = var.terraform_user_name
  path = "/"

  tags = merge(var.tags, {
    Name = var.terraform_user_name
  })
}

# Policy for Terraform user - strictly limited to infrastructure creation
resource "aws_iam_policy" "terraform_policy" {
  name        = "SecConfig-Terraform-Policy"
  description = "Strictly limited policy for Terraform infrastructure operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TerraformInfrastructureManagement"
        Effect = "Allow"
        Action = [
          # EC2 and VPC permissions
          "ec2:*",
          "vpc:*",
          # S3 permissions
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucket*",
          "s3:ListBucket*",
          "s3:PutBucket*",
          "s3:DeleteBucket*",
          "s3:GetObject*",
          "s3:PutObject*",
          "s3:DeleteObject*",
          # IAM permissions (limited)
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:ListRoles",
          "iam:PassRole",
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:GetPolicy",
          "iam:ListPolicies",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:CreateInstanceProfile",
          "iam:DeleteInstanceProfile",
          "iam:GetInstanceProfile",
          "iam:AddRoleToInstanceProfile",
          "iam:RemoveRoleFromInstanceProfile",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:GetUser",
          "iam:ListUsers",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:TagRole",
          "iam:TagUser",
          "iam:TagPolicy",
          # KMS permissions
          "kms:CreateKey",
          "kms:DeleteKey",
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:PutKeyPolicy",
          "kms:CreateAlias",
          "kms:DeleteAlias",
          "kms:ListAliases",
          "kms:TagResource",
          "kms:UntagResource",
          "kms:EnableKeyRotation",
          "kms:GetKeyRotationStatus",
          # CloudTrail permissions
          "cloudtrail:CreateTrail",
          "cloudtrail:DeleteTrail",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:StartLogging",
          "cloudtrail:StopLogging",
          "cloudtrail:PutEventSelectors",
          "cloudtrail:GetEventSelectors",
          # CloudWatch permissions
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DescribeAlarms",
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:DescribeLogGroups",
          "logs:PutRetentionPolicy",
          "logs:TagLogGroup",
          # GuardDuty permissions
          "guardduty:CreateDetector",
          "guardduty:DeleteDetector",
          "guardduty:GetDetector",
          "guardduty:UpdateDetector",
          "guardduty:TagResource",
          # Config permissions
          "config:PutConfigurationRecorder",
          "config:DeleteConfigurationRecorder",
          "config:DescribeConfigurationRecorders",
          "config:PutDeliveryChannel",
          "config:DeleteDeliveryChannel",
          "config:DescribeDeliveryChannels",
          "config:PutConfigRule",
          "config:DeleteConfigRule",
          "config:DescribeConfigRules",
          "config:StartConfigurationRecorder",
          "config:StopConfigurationRecorder",
          # SNS permissions
          "sns:CreateTopic",
          "sns:DeleteTopic",
          "sns:GetTopicAttributes",
          "sns:SetTopicAttributes",
          "sns:TagResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "RequiredReadOnlyPermissions"
        Effect = "Allow"
        Action = [
          "sts:GetCallerIdentity",
          "sts:GetAccountSummary",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeRegions"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_user_policy_attachment" "terraform_user_policy" {
  user       = aws_iam_user.terraform_user.name
  policy_arn = aws_iam_policy.terraform_policy.arn
}

# S3 Read-only role with MFA requirement
resource "aws_iam_role" "s3_readonly_role" {
  name = "SecConfig-S3-ReadOnly-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      },
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
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "SecConfig-S3-ReadOnly-Role"
  })
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "SecConfig-S3-ReadOnly-Policy"
  description = "Read-only access to S3 with least privilege"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          "arn:aws:s3:::secconfig-*",
          "arn:aws:s3:::secconfig-*/*"
        ]
      },
      {
        Sid    = "S3ListBucketsLimited"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "s3:prefix" = "secconfig-*"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "s3_readonly_attachment" {
  role       = aws_iam_role.s3_readonly_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "s3_readonly_profile" {
  name = "SecConfig-S3-ReadOnly-Profile"
  role = aws_iam_role.s3_readonly_role.name

  tags = var.tags
}

# Console access role with MFA requirement
resource "aws_iam_role" "console_access_role" {
  name = "SecConfig-Console-Access-Role"

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
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "SecConfig-Console-Access-Role"
  })
}

resource "aws_iam_policy" "console_readonly_policy" {
  name        = "SecConfig-Console-ReadOnly-Policy"
  description = "Read-only console access with MFA requirement"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "s3:Get*",
          "s3:List*",
          "iam:Get*",
          "iam:List*",
          "cloudtrail:Get*",
          "cloudtrail:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "cloudwatch:Describe*",
          "guardduty:Get*",
          "guardduty:List*",
          "config:Get*",
          "config:Describe*",
          "config:List*",
          "kms:Get*",
          "kms:List*",
          "kms:Describe*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "console_readonly_attachment" {
  role       = aws_iam_role.console_access_role.name
  policy_arn = aws_iam_policy.console_readonly_policy.arn
}
```

### `modules/iam/variables.tf`

```hcl
variable "terraform_user_name" {
  description = "Name for Terraform IAM user"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/iam/outputs.tf`

```hcl
output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = aws_iam_user.terraform_user.arn
}

output "terraform_user_name" {
  description = "Name of the Terraform user"
  value       = aws_iam_user.terraform_user.name
}

output "s3_readonly_role_arn" {
  description = "ARN of the S3 read-only role"
  value       = aws_iam_role.s3_readonly_role.arn
}

output "s3_readonly_instance_profile_name" {
  description = "Name of the S3 read-only instance profile"
  value       = aws_iam_instance_profile.s3_readonly_profile.name
}

output "console_access_role_arn" {
  description = "ARN of the console access role"
  value       = aws_iam_role.console_access_role.arn
}
```

### `modules/security/main.tf`

```hcl
# Security Group for SSH access from specific IP
resource "aws_security_group" "ssh_access" {
  name        = "SecConfig-SSH-Access"
  description = "Security group for SSH access from specific IP address"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from specific IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_ip]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "SecConfig-SSH-SG"
  })
}

# Security Group for Web traffic
resource "aws_security_group" "web_access" {
  name        = "SecConfig-Web-Access"
  description = "Security group for HTTP/HTTPS access"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "SecConfig-Web-SG"
  })
}

# Network ACL - Restrictive rules allowing only HTTP/HTTPS inbound
resource "aws_network_acl" "restrictive" {
  vpc_id = var.vpc_id

  # Allow HTTP inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 100