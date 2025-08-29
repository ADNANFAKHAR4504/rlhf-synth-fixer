## Root Configuration Files

### provider.tf
```hcl
# provider.tf

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
  region = var.aws_region
}
```

### tap_stack.tf
```hcl
# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  project_name         = var.project_name
  environment          = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  project_name = var.project_name
  environment  = var.environment
}

# Security Module
module "security" {
  source = "./modules/security"
  
  vpc_id           = module.vpc.vpc_id
  allowed_ssh_cidr = var.allowed_ssh_cidr
  project_name     = var.project_name
  environment      = var.environment
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  project_name = var.project_name
  environment  = var.environment
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
}
```
### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "SecConfig"
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
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"  # Replace with your IP
}
```

### outputs.tf
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
  description = "KMS key ID for encryption"
  value       = module.storage.kms_key_id
}

output "s3_bucket_name" {
  description = "Name of the encrypted S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = module.iam.terraform_user_arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = module.monitoring.config_recorder_name
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = module.monitoring.security_alerts_topic_arn
}

output "config_rules" {
  description = "List of AWS Config rule names"
  value       = module.monitoring.config_rules
}
```
## Modules
### modules/vpc/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-VPC-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-IGW-${var.environment}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-Public-Subnet-${count.index + 1}-${var.environment}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-Private-Subnet-${count.index + 1}-${var.environment}"
    Type = "Private"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-NAT-EIP-${count.index + 1}-${var.environment}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-NAT-Gateway-${count.index + 1}-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-Public-RT-${var.environment}"
  }
}

resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-Private-RT-${count.index + 1}-${var.environment}"
  }
}

# Route Table Associations
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

### modules/vpc/variables.tf
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
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

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/vpc/outputs.tf
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

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

### modules/storage/main.tf
```hcl
# Random string for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.project_name}-S3-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias
resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${lower(var.project_name)}-s3-${var.environment}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# S3 Bucket with Encryption
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "${lower(var.project_name)}-secure-bucket-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}-Secure-Bucket-${var.environment}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
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

# KMS Key for EBS Encryption
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.project_name}-EBS-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias for EBS
resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/${lower(var.project_name)}-ebs-${var.environment}"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}

# EBS Default Encryption
resource "aws_ebs_default_kms_key" "default" {
  key_arn = aws_kms_key.ebs_encryption.arn
}

resource "aws_ebs_encryption_by_default" "default" {
  enabled = true
}
```

### modules/storage/variables.tf
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/storage/outputs.tf
```hcl
output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "ebs_kms_key_id" {
  description = "ID of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs_encryption.key_id
}
```

### modules/security/main.tf
```hcl
# Security Group for SSH Access
resource "aws_security_group" "ssh_access" {
  name        = "${var.project_name}-SSH-Access-${var.environment}"
  description = "Security group for SSH access from specific IP"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from specific IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-SSH-SG-${var.environment}"
  }
}

# Security Group for Web Traffic
resource "aws_security_group" "web_access" {
  name        = "${var.project_name}-Web-Access-${var.environment}"
  description = "Security group for web traffic"
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
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-Web-SG-${var.environment}"
  }
}

# Network ACL for additional security
resource "aws_network_acl" "restrictive" {
  vpc_id = var.vpc_id

  # Allow HTTP inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow HTTPS inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow return traffic (ephemeral ports)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${var.project_name}-Restrictive-NACL-${var.environment}"
  }
}
```

### modules/security/variables.tf
```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/security/outputs.tf
```hcl
output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh_access.id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_access.id
}

output "network_acl_id" {
  description = "ID of the restrictive network ACL"
  value       = aws_network_acl.restrictive.id
}
```

### modules/monitoring/main.tf
```hcl
# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random string for unique bucket naming
resource "random_string" "cloudtrail_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_string" "config_suffix" {
  length  = 8
  special = false
  upper   = false
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${lower(var.project_name)}-cloudtrail-${var.environment}-${random_string.cloudtrail_suffix.result}"

  tags = {
    Name = "${var.project_name}-CloudTrail-Bucket-${var.environment}"
  }
}

# CloudTrail S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-CloudTrail-${var.environment}"
          }
        }
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-CloudTrail-${var.environment}"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for security logs
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = "/aws/security/login-attempts-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-Security-Logs-${var.environment}"
  }
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 90

  tags = {
    Name = "${var.project_name}-CloudTrail-Logs-${var.environment}"
  }
}

# IAM Role for CloudTrail CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "${var.project_name}-CloudTrail-Logs-Role-${var.environment}"

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
}

# IAM Policy for CloudTrail CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.project_name}-CloudTrail-Logs-Policy-${var.environment}"
  role = aws_iam_role.cloudtrail_logs_role.id

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
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
      }
    ]
  })
}

# CloudWatch Metric Filter for failed login attempts
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "${var.project_name}-FailedLogins-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_logs.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") || ($.sourceIPAddress != \"AWS Internal\") }"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "Security/Authentication"
    value     = "1"
  }
}

# CloudWatch Alarm for excessive login attempts
resource "aws_cloudwatch_metric_alarm" "excessive_login_attempts" {
  alarm_name          = "${var.project_name}-ExcessiveLoginAttempts-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedLoginAttempts"
  namespace           = "Security/Authentication"
  period              = "300"  # 5 minutes
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors failed login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-Login-Alarm-${var.environment}"
  }
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-SecurityAlerts-${var.environment}"

  tags = {
    Name = "${var.project_name}-Security-Alerts-${var.environment}"
  }
}

# AWS Config S3 Bucket
resource "aws_s3_bucket" "config" {
  bucket = "${lower(var.project_name)}-config-${var.environment}-${random_string.config_suffix.result}"

  tags = {
    Name = "${var.project_name}-Config-Bucket-${var.environment}"
  }
}

# AWS Config S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# AWS Config S3 Bucket Policy
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
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
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
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "${var.project_name}-Config-Role-${var.environment}"

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
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Additional IAM policy for Config to access S3
resource "aws_iam_role_policy" "config_s3" {
  name = "${var.project_name}-Config-S3-Policy-${var.environment}"
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
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-Config-DeliveryChannel-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config.bucket
  s3_key_prefix  = "config"

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-Config-Recorder-${var.environment}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config Configuration Recorder Status
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# Config Rule: S3 Bucket Server Side Encryption Enabled
resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  name = "${var.project_name}-s3-bucket-server-side-encryption-enabled-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-S3-Encryption-Rule-${var.environment}"
  }
}

# Config Rule: EBS Volume Encryption Enabled
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "${var.project_name}-encrypted-volumes-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-EBS-Encryption-Rule-${var.environment}"
  }
}

# Config Rule: S3 Bucket Public Access Prohibited
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-S3-Public-Read-Rule-${var.environment}"
  }
}

# Config Rule: Root Access Key Check
resource "aws_config_config_rule" "root_access_key_check" {
  name = "${var.project_name}-root-access-key-check-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_ROOT_ACCESS_KEY_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-Root-Access-Key-Rule-${var.environment}"
  }
}

# Config Rule: MFA Enabled for IAM Console Access
resource "aws_config_config_rule" "mfa_enabled_for_iam_console_access" {
  name = "${var.project_name}-mfa-enabled-for-iam-console-access-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-MFA-Console-Rule-${var.environment}"
  }
}

# Config Remediation Configuration for S3 Encryption
resource "aws_config_remediation_configuration" "s3_encryption_remediation" {
  config_rule_name = aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name

  resource_type    = "AWS::S3::Bucket"
  target_type      = "SSM_DOCUMENT"
  target_id        = "AWS-PublishSNSNotification"
  target_version   = "1"

  parameter {
    name           = "TopicArn"
    static_value   = aws_sns_topic.security_alerts.arn
  }

  parameter {
    name           = "Message"
    static_value   = "S3 bucket encryption compliance violation detected"
  }

  automatic                = false
  maximum_automatic_attempts = 1

  depends_on = [aws_config_config_rule.s3_bucket_server_side_encryption_enabled]
}
```

### modules/monitoring/variables.tf
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/monitoring/outputs.tf
```hcl
output "config_recorder_name" {
  description = "Name of the Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm for login attempts"
  value       = aws_cloudwatch_metric_alarm.excessive_login_attempts.alarm_name
}

output "config_rules" {
  description = "List of Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name,
    aws_config_config_rule.encrypted_volumes.name,
    aws_config_config_rule.s3_bucket_public_read_prohibited.name,
    aws_config_config_rule.root_access_key_check.name,
    aws_config_config_rule.mfa_enabled_for_iam_console_access.name
  ]
}
```

### modules/iam/main.tf
```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM Policy for S3 Read-Only Access
resource "aws_iam_policy" "s3_read_only" {
  name        = "${var.project_name}-S3ReadOnly-${var.environment}"
  description = "Read-only access to specific S3 services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${lower(var.project_name)}-*",
          "arn:aws:s3:::${lower(var.project_name)}-*/*"
        ]
      }
    ]
  })
}

# IAM Role for EC2 with S3 Read-Only Access
resource "aws_iam_role" "ec2_s3_readonly" {
  name = "${var.project_name}-EC2-S3ReadOnly-${var.environment}"

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
        }
      }
    ]
  })
}

# Attach S3 Read-Only Policy to Role
resource "aws_iam_role_policy_attachment" "ec2_s3_readonly" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_s3_readonly" {
  name = "${var.project_name}-EC2-S3ReadOnly-${var.environment}"
  role = aws_iam_role.ec2_s3_readonly.name
}

# IAM Policy for Terraform Operations
resource "aws_iam_policy" "terraform_policy" {
  name        = "${var.project_name}-TerraformPolicy-${var.environment}"
  description = "Policy for Terraform stack creation and management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "vpc:*",
          "iam:*",
          "s3:*",
          "kms:*",
          "cloudtrail:*",
          "cloudwatch:*",
          "logs:*",
          "guardduty:*",
          "config:*",
          "sns:*",
          "sts:GetCallerIdentity"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM User for Terraform
resource "aws_iam_user" "terraform_user" {
  name = "${var.project_name}-TerraformUser-${var.environment}"
  path = "/"

  tags = {
    Name        = "${var.project_name}-TerraformUser-${var.environment}"
    Description = "User for Terraform stack creation"
  }
}

# Attach Terraform Policy to User
resource "aws_iam_user_policy_attachment" "terraform_user_policy" {
  user       = aws_iam_user.terraform_user.name
  policy_arn = aws_iam_policy.terraform_policy.arn
}

# MFA Policy for Console Access
resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-MFAPolicy-${var.environment}"
  description = "Enforce MFA for console access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
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
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
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

# Attach MFA Policy to all roles that need console access
resource "aws_iam_role_policy_attachment" "ec2_mfa_policy" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}
```

### modules/iam/variables.tf
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/iam/outputs.tf
```hcl
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_s3_readonly.name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = aws_iam_user.terraform_user.arn
}

output "terraform_user_name" {
  description = "Name of the Terraform user"
  value       = aws_iam_user.terraform_user.name
}
```