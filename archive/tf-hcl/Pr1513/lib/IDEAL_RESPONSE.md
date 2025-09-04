```hcl
# Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infra"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
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

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "idp_arn" {
  description = "Identity Provider ARN for SAML federation"
  type        = string
  default     = "arn:aws:iam::123456789012:saml-provider/my-saml-provider" # replace with actual ARN
}

variable "idp_url" {
  description = "Identity Provider URL"
  type        = string
  default     = "https://my-saml-provider.example.com/saml2/idp/metadata" # replace with actual URL
}

variable "idp_thumbprint" {
  description = "Identity Provider certificate thumbprint"
  type        = string
  default     = "1234567890abcdef1234567890abcdef12345678" # replace with actual thumbprint
}

variable "notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = "dev@example.com" # replace with actual email address
}

# Outputs

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

output "security_groups" {
  description = "Security group IDs"
  value       = module.security.security_groups
}

output "s3_buckets" {
  description = "S3 bucket information"
  value = {
    sensitive_data_bucket = module.storage.sensitive_data_bucket_name
    cloudtrail_bucket     = module.storage.cloudtrail_bucket_name
    config_bucket         = module.storage.config_bucket_name
  }
  sensitive = true
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.storage.kms_key_id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = module.monitoring.cloudtrail_arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = module.compliance.config_recorder_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = module.monitoring.sns_topic_arn
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment

  idp_arn        = var.idp_arn
  idp_url        = var.idp_url
  idp_thumbprint = var.idp_thumbprint

  depends_on = [module.vpc]
}

# Security Module (Security Groups)
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# Storage Module (S3 + KMS)
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment

  account_id = data.aws_caller_identity.current.account_id
}

# Monitoring Module (CloudTrail + SNS)
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  account_id           = data.aws_caller_identity.current.account_id
  cloudtrail_s3_bucket = module.storage.cloudtrail_bucket_name
  kms_key_id           = module.storage.kms_key_id

  notification_email = var.notification_email
}

# Compliance Module (AWS Config)
module "compliance" {
  source = "./modules/compliance"

  project_name = var.project_name
  environment  = var.environment

  account_id       = data.aws_caller_identity.current.account_id
  config_s3_bucket = module.storage.config_bucket_name
  sns_topic_arn    = module.monitoring.sns_topic_arn

  use_existing_config_recorder         = true
  use_existing_config_delivery_channel = true
  use_existing_guardduty_detector      = true
  use_existing_securityhub             = true

  depends_on = [module.storage, module.monitoring]
}

```

```hcl


# AWS Config Recorder (only create if not using existing)
resource "aws_config_configuration_recorder" "main" {
  count    = var.use_existing_config_recorder ? 0 : 1
  name     = "${var.project_name}-config-recorder-${var.environment}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

# Local value to reference the recorder name
locals {
  config_recorder_name = var.use_existing_config_recorder ? "prod-sec-config-recorder-main" : aws_config_configuration_recorder.main[0].name
}

# AWS Config Delivery Channel (only create if not using existing)
resource "aws_config_delivery_channel" "main" {
  count          = var.use_existing_config_delivery_channel ? 0 : 1
  name           = "${var.project_name}-config-delivery-${var.environment}"
  s3_bucket_name = var.config_s3_bucket
  sns_topic_arn  = var.sns_topic_arn

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Configuration Recorder Status (only manage if creating new recorder)
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.use_existing_config_recorder ? 0 : 1
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role-${var.environment}"

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

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-role-${var.environment}"
    Type = "iam-role"
  })
}

# IAM Policy for AWS Config
resource "aws_iam_role_policy" "config_policy" {
  name = "${var.project_name}-config-policy-${var.environment}"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:AbortMultipartUpload"
        ]
        Resource = [
          "arn:aws:s3:::${var.config_s3_bucket}",
          "arn:aws:s3:::${var.config_s3_bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# GuardDuty Detector (only create if not using existing)
resource "aws_guardduty_detector" "main" {
  count  = var.use_existing_guardduty_detector ? 0 : 1
  enable = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-guardduty-${var.environment}"
    Type = "security"
  })
}

# GuardDuty Finding Publishing Frequency (only create if not using existing detector)
resource "aws_guardduty_detector_feature" "main" {
  count       = var.use_existing_guardduty_detector ? 0 : 1
  detector_id = aws_guardduty_detector.main[0].id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# Security Hub (only create if not using existing)
resource "aws_securityhub_account" "main" {
  count                    = var.use_existing_securityhub ? 0 : 1
  enable_default_standards = true
  auto_enable_controls     = true
}

# Security Hub Standards (only create if not using existing Security Hub)
resource "aws_securityhub_standards_subscription" "cis_aws_foundations" {
  count         = var.use_existing_securityhub ? 0 : 1
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0"
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count         = var.use_existing_securityhub ? 0 : 1
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
}

# CloudWatch Log Group for Config
resource "aws_cloudwatch_log_group" "config" {
  name              = "/aws/config/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-logs-${var.environment}"
    Type = "compliance"
  })
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${var.project_name}-s3-bucket-encryption-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "${var.project_name}-rds-encryption-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  name = "${var.project_name}-iam-password-policy-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

resource "aws_config_config_rule" "root_account_mfa" {
  name = "${var.project_name}-root-account-mfa-${var.environment}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main]
}

# Config Aggregator (for multi-account setup)
resource "aws_config_configuration_aggregator" "organization" {
  count = var.enable_organization_aggregator ? 1 : 0
  name  = "${var.project_name}-config-aggregator-${var.environment}"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator_role[0].arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-aggregator-${var.environment}"
    Type = "compliance"
  })
}

# IAM Role for Config Aggregator
resource "aws_iam_role" "config_aggregator_role" {
  count = var.enable_organization_aggregator ? 1 : 0
  name  = "${var.project_name}-config-aggregator-role-${var.environment}"

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

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-config-aggregator-role-${var.environment}"
    Type = "iam-role"
  })
}

# IAM Policy for Config Aggregator
resource "aws_iam_role_policy_attachment" "config_aggregator_policy" {
  count      = var.enable_organization_aggregator ? 1 : 0
  role       = aws_iam_role.config_aggregator_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRoleForOrganizations"
}

# Data sources
data "aws_region" "current" {}

```
```hcl
output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = local.config_recorder_name
}

output "config_recorder_arn" {
  description = "AWS Config recorder ARN"
  value       = var.use_existing_config_recorder ? "arn:aws:config:us-east-1:${var.account_id}:configuration-recorder/${local.config_recorder_name}" : aws_config_configuration_recorder.main[0].id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = var.use_existing_guardduty_detector ? "existing-guardduty-detector" : aws_guardduty_detector.main[0].id
}

output "guardduty_detector_arn" {
  description = "GuardDuty detector ARN"
  value       = var.use_existing_guardduty_detector ? "arn:aws:guardduty:us-east-1:${var.account_id}:detector/existing" : aws_guardduty_detector.main[0].arn
}

output "securityhub_account_id" {
  description = "Security Hub account ID"
  value       = var.use_existing_securityhub ? var.account_id : aws_securityhub_account.main[0].id
}

output "config_role_arn" {
  description = "AWS Config IAM role ARN"
  value       = aws_iam_role.config_role.arn
}

output "config_log_group_name" {
  description = "CloudWatch log group name for AWS Config"
  value       = aws_cloudwatch_log_group.config.name
}

```
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "config_s3_bucket" {
  description = "S3 bucket name for AWS Config logs"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
}

variable "enable_organization_aggregator" {
  description = "Enable AWS Config organization aggregator"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "use_existing_config_recorder" {
  description = "Whether to use existing configuration recorder instead of creating new one"
  type        = bool
  default     = true
}

variable "use_existing_config_delivery_channel" {
  description = "Whether to use existing configuration delivery channel instead of creating new one"
  type        = bool
  default     = true
}

variable "use_existing_guardduty_detector" {
  description = "Whether to use existing GuardDuty detector instead of creating new one"
  type        = bool
  default     = true
}

variable "use_existing_securityhub" {
  description = "Whether to use existing Security Hub instead of creating new one"
  type        = bool
  default     = true
}

```
```hcl
# SAML Identity Provider (commented out - requires metadata file)
# resource "aws_iam_saml_provider" "main" {
#   name                   = "${var.project_name}-saml-provider-${var.environment}"
#   saml_metadata_document = file("${path.module}/saml-metadata.xml")
# }

# IAM Role for SAML Federation (commented out - requires SAML provider)
# resource "aws_iam_role" "saml_role" {
#   name = "${var.project_name}-saml-role-${var.environment}"
# 
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Federated = aws_iam_saml_provider.main.arn
#         }
#         Action = "sts:AssumeRoleWithSAML"
#         Condition = {
#           StringEquals = {
#             "SAML:aud" = "https://signin.aws.amazon.com/saml"
#           }
#         }
#       }
#     ]
#   })
# }

# IAM Policy requiring MFA
resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-mfa-policy-${var.environment}"
  description = "Policy requiring MFA for all actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
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

# Admin Role with MFA requirement
resource "aws_iam_role" "admin_role" {
  name = "${var.project_name}-admin-role-${var.environment}"

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
}

# Attach policies to admin role
resource "aws_iam_role_policy_attachment" "admin_policy" {
  role       = aws_iam_role.admin_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ReadOnly Role (commented out - requires SAML provider)
# resource "aws_iam_role" "readonly_role" {
#   name = "${var.project_name}-readonly-role-${var.environment}"
# 
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Federated = aws_iam_saml_provider.main.arn
#         }
#         Action = "sts:AssumeRoleWithSAML"
#         Condition = {
#           StringEquals = {
#             "SAML:aud" = "https://signin.aws.amazon.com/saml"
#           }
#         }
#       }
#     ]
#   })
# }
# 
# resource "aws_iam_role_policy_attachment" "readonly_policy" {
#   role       = aws_iam_role.readonly_role.name
#   policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
# }

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 12
}
```
```hcl
# output "saml_provider_arn" {
#   description = "ARN of the SAML provider"
#   value       = aws_iam_saml_provider.main.arn
# }

output "admin_role_arn" {
  description = "ARN of the admin role"
  value       = aws_iam_role.admin_role.arn
}

# output "readonly_role_arn" {
#   description = "ARN of the readonly role"
#   value       = aws_iam_role.readonly_role.arn
# }

# output "saml_role_arn" {
#   description = "ARN of the SAML role"
#   value       = aws_iam_role.saml_role.arn
# }
```
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "idp_arn" {
  description = "Identity Provider ARN"
  type        = string
}

variable "idp_url" {
  description = "Identity Provider URL"
  type        = string
}

variable "idp_thumbprint" {
  description = "Identity Provider thumbprint"
  type        = string
}
```
```hcl
# CloudTrail for API monitoring
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-cloudtrail-${var.environment}"
  s3_bucket_name                = var.cloudtrail_s3_bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${var.cloudtrail_s3_bucket}/"]
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  kms_key_id = var.kms_key_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudtrail-${var.environment}"
    Type = "monitoring"
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudtrail-logs-${var.environment}"
    Type = "monitoring"
  })
}

# IAM Role for CloudTrail to write to CloudWatch
resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  name = "${var.project_name}-cloudtrail-cloudwatch-role-${var.environment}"

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

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudtrail-cloudwatch-role-${var.environment}"
    Type = "iam-role"
  })
}

# IAM Policy for CloudTrail CloudWatch permissions
resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "${var.project_name}-cloudtrail-cloudwatch-policy-${var.environment}"
  role = aws_iam_role.cloudtrail_cloudwatch_role.id

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
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# SNS Topic for notifications
resource "aws_sns_topic" "main" {
  name = "${var.project_name}-notifications-${var.environment}"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-notifications-${var.environment}"
    Type = "monitoring"
  })
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.main.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarm for API errors
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-api-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.main.arn]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-errors-alarm-${var.environment}"
    Type = "monitoring"
  })
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  alarm_actions       = [aws_sns_topic.main.arn]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-errors-alarm-${var.environment}"
    Type = "monitoring"
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "5XXError", "ApiName", "${var.project_name}-${var.environment}"],
            [".", "4XXError", ".", "."],
            [".", "Count", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "API Gateway Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", "${var.project_name}-${var.environment}"],
            [".", "Invocations", ".", "."],
            [".", "Duration", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Lambda Metrics"
        }
      }
    ]
  })
}

# Data sources
data "aws_region" "current" {}
```
```hcl
output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = aws_sns_topic.main.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.main.name
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}
```
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "cloudtrail_s3_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "notification_email" {
  description = "Email address for SNS notifications"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```
```hcl
# Web Security Group (for ALB/public-facing resources)
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for web tier"

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
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for application tier"

  ingress {
    description     = "HTTP from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "HTTPS from web tier"
    from_port       = 8443
    to_port         = 8443
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for database tier"

  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Management Security Group (for bastion/admin access)
resource "aws_security_group" "management" {
  name_prefix = "${var.project_name}-mgmt-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for management/bastion hosts"

  ingress {
    description = "SSH from corporate network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr] # Restrict to VPC only
  }

  ingress {
    description = "RDP from corporate network"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr] # Restrict to VPC only
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-mgmt-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint Security Group
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpce-${var.environment}-"
  vpc_id      = var.vpc_id
  description = "Security group for VPC endpoints"

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "${var.project_name}-vpce-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```
```hcl
output "security_groups" {
  description = "Map of security group IDs"
  value = {
    web         = aws_security_group.web.id
    app         = aws_security_group.app.id
    database    = aws_security_group.database.id
    management  = aws_security_group.management.id
    vpc_endpoints = aws_security_group.vpc_endpoints.id
  }
}
```
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}
```
```hcl
# KMS Key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.account_id}:root"
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
      },
      {
        Sid    = "Allow Config to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
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
    Name = "${var.project_name}-kms-key-${var.environment}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# S3 Bucket for sensitive data
resource "aws_s3_bucket" "sensitive_data" {
  bucket = "${var.project_name}-sensitive-data-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-sensitive-data-${var.environment}"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-${var.environment}-${random_id.cloudtrail_suffix.hex}"

  tags = {
    Name = "${var.project_name}-cloudtrail-${var.environment}"
  }
}

resource "random_id" "cloudtrail_suffix" {
  byte_length = 4
}

# S3 Bucket encryption for CloudTrail
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket versioning for CloudTrail
resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block for CloudTrail
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket policy for CloudTrail
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

# S3 Bucket for AWS Config logs
resource "aws_s3_bucket" "config" {
  bucket = "${var.project_name}-config-${var.environment}-${random_id.config_suffix.hex}"

  tags = {
    Name = "${var.project_name}-config-${var.environment}"
  }
}

resource "random_id" "config_suffix" {
  byte_length = 4
}

# S3 Bucket encryption for Config
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket versioning for Config
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket public access block for Config
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket policy for AWS Config
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
          }
        }
      }
    ]
  })
}
```
```hcl
output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.arn
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "sensitive_data_bucket_name" {
  description = "S3 bucket name for sensitive data"
  value       = aws_s3_bucket.sensitive_data.bucket
}

output "sensitive_data_bucket_arn" {
  description = "S3 bucket ARN for sensitive data"
  value       = aws_s3_bucket.sensitive_data.arn
}

output "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_bucket_arn" {
  description = "S3 bucket ARN for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "config_bucket_name" {
  description = "S3 bucket name for AWS Config logs"
  value       = aws_s3_bucket.config.bucket
}

output "config_bucket_arn" {
  description = "S3 bucket ARN for AWS Config logs"
  value       = aws_s3_bucket.config.arn
}
```
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
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
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
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
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-eip-nat-${count.index + 1}-${var.environment}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}-${var.environment}"
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
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${var.environment}"
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

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name_prefix       = "/aws/vpc/flowlogs/${var.project_name}-${var.environment}-"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-vpc-flow-logs-${var.environment}"
  }
}

resource "aws_iam_role" "flow_log" {
  name = "${var.project_name}-flow-log-role-${var.environment}"

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
  name = "${var.project_name}-flow-log-policy-${var.environment}"
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
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}
```