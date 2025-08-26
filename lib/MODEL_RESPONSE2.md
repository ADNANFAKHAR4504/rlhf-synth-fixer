You're right! The `aws_s3_bucket_encryption_configuration` resource was introduced in later versions of the AWS provider. Let me fix the Terraform configuration to use the correct S3 bucket encryption syntax that's compatible with older provider versions.

## Updated main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current region
data "aws_region" "current" {}

# KMS Key for encryption
resource "aws_kms_key" "security_key" {
  description             = "SecConfig KMS key for encryption"
  deletion_window_in_days = 7
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
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "SecConfig-KMS-Key"
    Project = "SecurityConfiguration"
  }
}

resource "aws_kms_alias" "security_key_alias" {
  name          = "alias/secconfig-key"
  target_key_id = aws_kms_key.security_key.key_id
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "SecConfig-VPC"
    Project = "SecurityConfiguration"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "SecConfig-IGW"
    Project = "SecurityConfiguration"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name    = "SecConfig-Public-Subnet-${count.index + 1}"
    Project = "SecurityConfiguration"
    Type    = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name    = "SecConfig-Private-Subnet-${count.index + 1}"
    Project = "SecurityConfiguration"
    Type    = "Private"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  vpc    = true

  tags = {
    Name    = "SecConfig-NAT-EIP-${count.index + 1}"
    Project = "SecurityConfiguration"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name    = "SecConfig-NAT-Gateway-${count.index + 1}"
    Project = "SecurityConfiguration"
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
    Name    = "SecConfig-Public-RT"
    Project = "SecurityConfiguration"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name    = "SecConfig-Private-RT-${count.index + 1}"
    Project = "SecurityConfiguration"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Network ACL
resource "aws_network_acl" "main" {
  vpc_id = aws_vpc.main.id

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

  # Allow ephemeral ports for return traffic
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
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  egress {
    protocol   = "udp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  egress {
    protocol   = "icmp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name    = "SecConfig-NACL"
    Project = "SecurityConfiguration"
  }
}

# Security Group for SSH access
resource "aws_security_group" "ssh_access" {
  name        = "SecConfig-SSH-Access"
  description = "Security group for SSH access from specific IP"
  vpc_id      = aws_vpc.main.id

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
    Name    = "SecConfig-SSH-SG"
    Project = "SecurityConfiguration"
  }
}

# Security Group for web traffic
resource "aws_security_group" "web_access" {
  name        = "SecConfig-Web-Access"
  description = "Security group for web traffic"
  vpc_id      = aws_vpc.main.id

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
    Name    = "SecConfig-Web-SG"
    Project = "SecurityConfiguration"
  }
}

# Random string for bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket with encryption
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "secconfig-secure-bucket-${random_string.bucket_suffix.result}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.security_key.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }

  versioning {
    enabled = true
  }

  tags = {
    Name    = "SecConfig-Secure-Bucket"
    Project = "SecurityConfiguration"
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 Bucket
resource "random_string" "cloudtrail_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket = "secconfig-cloudtrail-${random_string.cloudtrail_suffix.result}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.security_key.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }

  tags = {
    Name    = "SecConfig-CloudTrail-Bucket"
    Project = "SecurityConfiguration"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_bucket_pab" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

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
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/SecConfig-CloudTrail"
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
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/SecConfig-CloudTrail"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]

  name           = "SecConfig-CloudTrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_bucket.bucket
  s3_key_prefix  = "cloudtrail-logs"

  kms_key_id                = aws_kms_key.security_key.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name    = "SecConfig-CloudTrail"
    Project = "SecurityConfiguration"
  }
}

# CloudWatch Log Group for failed login attempts
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = "/aws/secconfig/security-logs"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.security_key.arn

  tags = {
    Name    = "SecConfig-Security-Logs"
    Project = "SecurityConfiguration"
  }
}

# CloudWatch Log Metric Filter for failed logins
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "SecConfig-Failed-Console-Logins"
  log_group_name = aws_cloudwatch_log_group.security_logs.name
  pattern        = "[version, account, time, id, ..., eventType=\"AwsConsoleSignIn\", ..., responseElements.ConsoleLogin=\"Failure\"]"

  metric_transformation {
    name      = "ConsoleLoginFailures"
    namespace = "SecConfig/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for failed login attempts
resource "aws_cloudwatch_metric_alarm" "failed_logins" {
  alarm_name          = "SecConfig-Failed-Logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleLoginFailures"
  namespace           = "SecConfig/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors failed console login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name    = "SecConfig-Failed-Logins-Alarm"
    Project = "SecurityConfiguration"
  }
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "SecConfig-Security-Alerts"
  kms_master_key_id = aws_kms_key.security_key.arn

  tags = {
    Name    = "SecConfig-Security-Alerts"
    Project = "SecurityConfiguration"
  }
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name    = "SecConfig-GuardDuty"
    Project = "SecurityConfiguration"
  }
}

# Config S3 Bucket
resource "random_string" "config_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "config_bucket" {
  bucket = "secconfig-aws-config-${random_string.config_suffix.result}"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.security_key.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }

  tags = {
    Name    = "SecConfig-Config-Bucket"
    Project = "SecurityConfiguration"
  }
}

resource "aws_s3_bucket_public_access_block" "config_bucket_pab" {
  bucket = aws_s3_bucket.config_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

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
        Resource = aws_s3_bucket.config_bucket.arn
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
        Resource = aws_s3_bucket.config_bucket.arn
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
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
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
resource "aws_iam_role" "config_role" {
  name = "SecConfig-ConfigRole"

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

  tags = {
    Name    = "SecConfig-Config-Role"
    Project = "SecurityConfiguration"
  }
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "SecConfig-Recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "SecConfig-Delivery-Channel"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket
  s3_key_prefix  = "config"
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-S3-Public-Read-Rule"
    Project = "SecurityConfiguration"
  }
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-Encrypted-Volumes-Rule"
    Project = "SecurityConfiguration"
  }
}

# IAM Policies and Roles

# S3 Read-Only Policy
resource "aws_iam_policy" "s3_readonly" {
  name        = "SecConfig-S3-ReadOnly"
  description = "Read-only access to S3"

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
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Name    = "SecConfig-S3-ReadOnly-Policy"
    Project = "SecurityConfiguration"
  }
}

# Terraform User Policy
resource "aws_iam_policy" "terraform_user_policy" {
  name        = "SecConfig-Terraform-Policy"
  description = "Policy for Terraform user with limited permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "iam:*",
          "kms:*",
          "cloudtrail:*",
          "cloudwatch:*",
          "config:*",
          "guardduty:*",
          "sns:*",
          "logs:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sts:AssumeRole"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "SecConfig-Terraform-Policy"
    Project = "SecurityConfiguration"
  }
}

# IAM Role with MFA requirement
resource "aws_iam_role" "mfa_required_role" {
  name = "SecConfig-MFA-Required-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
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

  tags = {
    Name    = "SecConfig-MFA-Role"
    Project = "SecurityConfiguration"
  }
}

resource "aws_iam_role_policy_attachment" "mfa_role_s3_readonly" {
  role       = aws_iam_role.mfa_required_role.name
  policy_arn = aws_iam_policy.s3_readonly.arn
}

# Terraform IAM User
resource "aws_iam_user" "terraform_user" {
  name = "SecConfig-Terraform-User"

  tags = {
    Name    = "SecConfig-Terraform-User"
    Project = "SecurityConfiguration"
  }
}

resource "aws_iam_user_policy_attachment" "terraform_user_policy_attachment" {
  user       = aws_iam_user.terraform_user.name
  policy_arn = aws_iam_policy.terraform_user_policy.arn
}

# EBS Volume with encryption (example)
resource "aws_ebs_volume" "encrypted_volume" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 20
  encrypted         = true
  kms_key_id        = aws_kms_key.security_key.arn

  tags = {
    Name    = "SecConfig-Encrypted-Volume"
    Project = "SecurityConfiguration"
  }
}
```

## Key Changes Made

### 1. **Fixed S3 Bucket Encryption**
- Replaced `aws_s3_bucket_encryption_configuration` with inline `server_side_encryption_configuration` blocks within the `aws_s3_bucket` resource
- This is compatible with AWS provider versions 4.x and earlier

### 2. **Fixed EIP Resource**
- Changed `domain = "vpc"` to `vpc = true` for compatibility with older provider versions

### 3. **Enhanced Network ACL**
- Added proper egress rules for TCP, UDP, and ICMP traffic
- Fixed the protocol specification for better compatibility

### 4. **Improved S3 Bucket Policies**
- Added proper condition statements with `AWS:SourceAccount` and `AWS:SourceArn` for better security
- Enhanced CloudTrail bucket policy with source ARN conditions

### 5. **Added CloudWatch Log Metric Filter**
- Created a proper log metric filter to capture failed console login attempts
- This feeds into the CloudWatch alarm for monitoring

### 6. **Provider Version Update**
- Changed to `~> 4.0` for better compatibility while still maintaining security features

## Deployment Instructions

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your specific values
   ```

3. **Validate Configuration**:
   ```bash
   terraform validate
   ```

4. **Plan Deployment**:
   ```bash
   terraform plan
   ```

5. **Apply Configuration**:
   ```bash
   terraform apply
   ```

This updated configuration should resolve all the resource type errors while maintaining all the security requirements and compliance features specified in your original request.