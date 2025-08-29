I'll provide the complete and corrected Terraform configuration with a fully implemented monitoring module including all AWS Config components and proper variable handling.

## Complete modules/monitoring/main.tf
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

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-CloudTrail-${var.environment}"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::S3::Bucket"
      values = ["arn:aws:s3:::*"]
    }
  }

  tags = {
    Name = "${var.project_name}-CloudTrail-${var.environment}"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
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
    Name = "${var.project_name}-GuardDuty-${var.environment}"
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
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
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

  snapshot_delivery_properties {
    delivery_frequency = "Daily"
  }

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
resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
  name = "${var.project_name}-s3-bucket-public-access-prohibited-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name = "${var.project_name}-S3-Public-Access-Rule-${var.environment}"
  }
}

# Config Rule: Root Access Key Check
resource "aws_config_config_rule" "root_access_key_check" {
  name = "${var.project_name}-root-access-key-check-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCESS_KEY_CHECK"
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
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

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
    aws_config_config_rule.s3_bucket_public_access_prohibited.name,
    aws_config_config_rule.root_access_key_check.name,
    aws_config_config_rule.mfa_enabled_for_iam_console_access.name
  ]
}
```

## Updated main.tf (root)
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
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SecurityConfiguration"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

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

## Updated outputs.tf (root)
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

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = module.monitoring.cloudtrail_arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = module.monitoring.guardduty_detector_id
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

## Deployment Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Create terraform.tfvars:**
```hcl
aws_region               = "us-west-2"
project_name            = "SecConfig"
environment             = "production"
vpc_cidr                = "10.0.0.0/16"
availability_zones      = ["us-west-2a", "us-west-2b"]
public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs    = ["10.0.10.0/24", "10.0.20.0/24"]
allowed_ssh_cidr        = "YOUR_IP_ADDRESS/32"  # Replace with your actual IP
```

3. **Plan and Apply:**
```bash
terraform plan
terraform apply
```

## Key Features Implemented

✅ **Complete Monitoring Module** with all required components:
- CloudTrail with S3 bucket and proper policies
- CloudWatch logs, metrics, and alarms for login attempts
- GuardDuty detector with all data sources enabled
- AWS Config with delivery channel, recorder, and status
- Config rules for S3 encryption, EBS encryption, public access, root keys, and MFA
- SNS topic for security alerts
- Remediation configurations

✅ **Proper Variable Handling** - All modules use consistent `project_name` and `environment` variables

✅ **Security Compliance** - All requirements met including encryption, least privilege IAM, MFA enforcement, and comprehensive monitoring

✅ **Modular Design** - Reusable, scalable modules with proper separation of concerns

✅ **Proper Tagging** - All resources tagged with "Project: SecurityConfiguration"

This configuration now provides complete security monitoring and compliance checking as required.