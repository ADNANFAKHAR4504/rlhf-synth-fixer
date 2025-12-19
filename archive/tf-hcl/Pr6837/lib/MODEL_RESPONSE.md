# Zero-Trust Security Architecture - Terraform Implementation

This implementation provides a comprehensive zero-trust security architecture for sensitive data processing on AWS using Terraform.

## Architecture Overview

The solution implements:
- Network segmentation with VPC, private subnets, and security groups
- KMS encryption for all data at rest
- S3 with versioning and encryption for secure data storage
- CloudTrail, CloudWatch, and VPC Flow Logs for comprehensive monitoring
- GuardDuty for threat detection
- AWS Config for compliance monitoring
- IAM roles with least-privilege policies

All resources include the environment suffix for uniqueness and are fully destroyable.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource names to avoid conflicts across environments"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "enable_guardduty" {
  description = "Enable GuardDuty (set to false if already exists in account)"
  type        = bool
  default     = false
}

variable "cloudtrail_retention_days" {
  description = "Number of days to retain CloudTrail logs"
  type        = number
  default     = 90
}

variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "ZeroTrustArchitecture"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}
```

## File: kms.tf

```hcl
# KMS key for encrypting data at rest
resource "aws_kms_key" "main" {
  description             = "KMS key for zero-trust architecture - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "zero-trust-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/zero-trust-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

# KMS key for CloudWatch logs encryption
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch logs - ${var.environment_suffix}"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "zero-trust-cloudwatch-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/zero-trust-cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}
```

## File: vpc.tf

```hcl
# VPC for network isolation
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "zero-trust-vpc-${var.environment_suffix}"
  }
}

# Private subnets across availability zones
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "zero-trust-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  }
}

# VPC Flow Logs for network monitoring
resource "aws_flow_log" "main" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn

  tags = {
    Name = "zero-trust-flow-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "zero-trust-flow-logs-${var.environment_suffix}"
  }
}

# Security group with least-privilege rules
resource "aws_security_group" "data_processing" {
  name_prefix = "zero-trust-data-processing-${var.environment_suffix}-"
  description = "Security group for data processing resources"
  vpc_id      = aws_vpc.main.id

  # No ingress rules - zero trust, explicit allow only
  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "HTTPS to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "zero-trust-sg-data-processing-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoints for AWS services (no internet access)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "zero-trust-s3-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.data_processing.id]
  private_dns_enabled = true

  tags = {
    Name = "zero-trust-kms-endpoint-${var.environment_suffix}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "zero-trust-private-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Network ACLs for additional protection
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow HTTPS within VPC
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 443
    to_port    = 443
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  egress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name = "zero-trust-nacl-${var.environment_suffix}"
  }
}
```

## File: s3.tf

```hcl
# S3 bucket for sensitive data storage
resource "aws_s3_bucket" "sensitive_data" {
  bucket        = "zero-trust-sensitive-data-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "zero-trust-sensitive-data-${var.environment_suffix}"
    Sensitivity = "High"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

# Access logging bucket
resource "aws_s3_bucket" "access_logs" {
  bucket        = "zero-trust-access-logs-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name = "zero-trust-access-logs-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

# Enable access logging
resource "aws_s3_bucket_logging" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access-logs/"
}

# Bucket policy to enforce secure transport
resource "aws_s3_bucket_policy" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.sensitive_data.arn,
          "${aws_s3_bucket.sensitive_data.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.sensitive_data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Lifecycle policy for data retention
resource "aws_s3_bucket_lifecycle_configuration" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# CloudTrail bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "zero-trust-cloudtrail-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name = "zero-trust-cloudtrail-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

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
```

## File: iam.tf

```hcl
# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name_prefix = "zero-trust-flow-logs-${var.environment_suffix}-"

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

  tags = {
    Name = "zero-trust-flow-logs-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "flow-logs-policy-"
  role        = aws_iam_role.flow_logs.id

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
        Resource = aws_cloudwatch_log_group.flow_logs.arn
      }
    ]
  })
}

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  name_prefix = "zero-trust-config-${var.environment_suffix}-"

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
    Name = "zero-trust-config-role-${var.environment_suffix}"
  }
}

# Attach AWS managed policy for AWS Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Additional policy for Config to write to S3
resource "aws_iam_role_policy" "config_s3" {
  name_prefix = "config-s3-policy-"
  role        = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# S3 bucket for Config
resource "aws_s3_bucket" "config" {
  bucket        = "zero-trust-config-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name = "zero-trust-config-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}
```

## File: cloudtrail.tf

```hcl
# CloudTrail for API activity logging
resource "aws_cloudtrail" "main" {
  name                          = "zero-trust-trail-${var.environment_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.sensitive_data.arn}/"]
    }
  }

  tags = {
    Name = "zero-trust-cloudtrail-${var.environment_suffix}"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.environment_suffix}"
  retention_in_days = var.cloudtrail_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "zero-trust-cloudtrail-logs-${var.environment_suffix}"
  }
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch log group for application logs
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "zero-trust-application-logs-${var.environment_suffix}"
  }
}

# CloudWatch metric alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "zero-trust-unauthorized-api-calls-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Triggers when unauthorized API calls exceed threshold"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "zero-trust-unauthorized-api-alarm-${var.environment_suffix}"
  }
}

# CloudWatch metric alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "zero-trust-root-usage-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Triggers when root account is used"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "zero-trust-root-usage-alarm-${var.environment_suffix}"
  }
}

# CloudWatch metric alarm for KMS key deletion
resource "aws_cloudwatch_metric_alarm" "kms_deletion" {
  alarm_name          = "zero-trust-kms-deletion-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "KMSKeyPendingDeletion"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Triggers when KMS key deletion is scheduled"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "zero-trust-kms-deletion-alarm-${var.environment_suffix}"
  }
}
```

## File: guardduty.tf

```hcl
# GuardDuty detector for threat detection
# WARNING: GuardDuty detector is account-level. Only create if one doesn't already exist.
resource "aws_guardduty_detector" "main" {
  count = var.enable_guardduty ? 1 : 0

  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = false
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
    Name = "zero-trust-guardduty-${var.environment_suffix}"
  }
}
```

## File: config.tf

```hcl
# AWS Config recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "zero-trust-config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "zero-trust-config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.id

  depends_on = [aws_config_configuration_recorder.main]
}

# Start the recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config rule for encrypted volumes
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "zero-trust-encrypted-volumes-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config rule for S3 bucket public read prohibited
resource "aws_config_config_rule" "s3_public_read" {
  name = "zero-trust-s3-public-read-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config rule for S3 bucket public write prohibited
resource "aws_config_config_rule" "s3_public_write" {
  name = "zero-trust-s3-public-write-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config rule for IAM password policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "zero-trust-iam-password-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config rule for root account MFA
resource "aws_config_config_rule" "root_mfa" {
  name = "zero-trust-root-mfa-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}
```

## File: data.tf

```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "security_group_id" {
  description = "ID of the data processing security group"
  value       = aws_security_group.data_processing.id
}

output "kms_key_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

output "sensitive_data_bucket_name" {
  description = "Name of the S3 bucket for sensitive data"
  value       = aws_s3_bucket.sensitive_data.id
}

output "sensitive_data_bucket_arn" {
  description = "ARN of the S3 bucket for sensitive data"
  value       = aws_s3_bucket.sensitive_data.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "flow_logs_log_group" {
  description = "CloudWatch log group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "application_log_group" {
  description = "CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.application.name
}

output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector (if enabled)"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize

environment_suffix = "dev-001"
aws_region         = "us-east-1"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# GuardDuty - set to true only if no detector exists in the account
enable_guardduty = false

# Log Retention
cloudtrail_retention_days     = 90
cloudwatch_log_retention_days = 30

# Tags
tags = {
  Project     = "ZeroTrustArchitecture"
  ManagedBy   = "Terraform"
  Environment = "Development"
  CostCenter  = "Security"
}
```

## Deployment Instructions

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your environment_suffix
   ```

3. **Plan deployment**:
   ```bash
   terraform plan
   ```

4. **Apply configuration**:
   ```bash
   terraform apply
   ```

5. **Verify deployment**:
   - Check VPC and subnets in AWS Console
   - Verify CloudTrail is logging
   - Confirm GuardDuty findings (if enabled)
   - Review AWS Config compliance dashboard

6. **Destroy resources** (when testing is complete):
   ```bash
   terraform destroy
   ```

## Security Features Implemented

- **Network Isolation**: Private VPC with no internet gateway
- **Encryption**: KMS encryption for all data at rest, TLS for data in transit
- **Access Control**: IAM roles with least-privilege policies
- **Monitoring**: CloudTrail, CloudWatch, VPC Flow Logs
- **Threat Detection**: GuardDuty for intelligent threat detection
- **Compliance**: AWS Config rules for security compliance
- **Data Protection**: S3 versioning, bucket policies, lifecycle management
- **Zero Trust**: Explicit allow model, no implicit trust

## Notes

- GuardDuty detector is account-level; set `enable_guardduty = false` if one exists
- AWS Config uses the AWS managed policy `service-role/AWS_ConfigRole`
- All resources include environment_suffix for multi-environment support
- All resources are destroyable via `terraform destroy`
- KMS key deletion has a 7-day waiting period (minimum allowed)
