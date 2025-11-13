# ========== LOCALS AND DATA SOURCES ==========

locals {
  # Common tags for all resources
  common_tags = {
    Environment     = var.environment
    Project         = var.project_name
    Owner           = var.owner
    ManagedBy       = "terraform"
    ComplianceLevel = "high"
    DataClass       = "sensitive"
  }

  # GDPR-specific tags
  gdpr_tags = var.gdpr_enabled ? {
    GDPR          = "enabled"
    DataResidency = "eu-compliant"
  } : {}

  # HIPAA-specific tags
  hipaa_tags = var.hipaa_enabled ? {
    HIPAA         = "enabled"
    PHI           = "protected"
    EncryptionReq = "required"
  } : {}

  # Combined tags
  tags = merge(local.common_tags, local.gdpr_tags, local.hipaa_tags)
}

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ========== KMS ENCRYPTION KEYS ==========

# KMS key for S3 audit log encryption (GDPR/HIPAA requirement)
resource "aws_kms_key" "audit_logs" {
  description             = "KMS key for encrypting audit logs and compliance data"
  deletion_window_in_days = var.kms_key_deletion_window_days
  enable_key_rotation     = true
  multi_region            = false

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
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Config to use the key"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-audit-logs-key"
  })
}

resource "aws_kms_alias" "audit_logs" {
  name          = "alias/${var.project_name}-audit-logs"
  target_key_id = aws_kms_key.audit_logs.key_id
}

# KMS key for DynamoDB encryption
resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for encrypting DynamoDB compliance data"
  deletion_window_in_days = var.kms_key_deletion_window_days
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name = "${var.project_name}-dynamodb-key"
  })
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/${var.project_name}-dynamodb"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# KMS key for Lambda environment variables encryption
resource "aws_kms_key" "lambda" {
  description             = "KMS key for encrypting Lambda environment variables"
  deletion_window_in_days = var.kms_key_deletion_window_days
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name = "${var.project_name}-lambda-key"
  })
}

resource "aws_kms_alias" "lambda" {
  name          = "alias/${var.project_name}-lambda"
  target_key_id = aws_kms_key.lambda.key_id
}

# ========== S3 BUCKETS FOR AUDIT LOGS ==========

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.project_name}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.tags, {
    Name = "${var.project_name}-cloudtrail-logs"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_logs.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.audit_log_retention_days
    }
  }
}

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
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail_logs.arn,
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs]
}

# S3 bucket for AWS Config logs
resource "aws_s3_bucket" "config_logs" {
  bucket        = "${var.project_name}-config-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = merge(local.tags, {
    Name = "${var.project_name}-config-logs"
  })
}

resource "aws_s3_bucket_versioning" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_logs.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.audit_log_retention_days
    }
  }
}

resource "aws_s3_bucket_policy" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

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
        Resource = aws_s3_bucket.config_logs.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_logs.arn
      },
      {
        Sid    = "AWSConfigWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSConfigGetObject"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.config_logs.arn}/*"
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.config_logs.arn,
          "${aws_s3_bucket.config_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.config_logs]
}

# ========== CLOUDTRAIL ORGANIZATION TRAIL ==========

resource "aws_cloudtrail" "organization_trail" {
  name                          = "${var.project_name}-org-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = var.organization_id != "" ? true : false
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.audit_logs.arn

  # Advanced event selectors are more flexible and recommended
  advanced_event_selector {
    name = "Log all S3 data events"
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
    field_selector {
      field  = "resources.type"
      equals = ["AWS::S3::Object"]
    }
  }

  advanced_event_selector {
    name = "Log all Lambda invocations"
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
    field_selector {
      field  = "resources.type"
      equals = ["AWS::Lambda::Function"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-org-trail"
  })

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs,
    aws_kms_key.audit_logs
  ]
}

# CloudWatch Log Group for CloudTrail
# Note: Using AWS managed encryption instead of customer-managed KMS to avoid permission issues
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${var.project_name}-cloudtrail-logs"
  })
}

# IAM role for CloudTrail to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-cloudtrail-cloudwatch-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# ========== AWS CONFIG SETUP ==========

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  name = "${var.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-config-role"
  })
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "${var.project_name}-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config_logs.arn,
          "${aws_s3_bucket.config_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl"
        ]
        Resource = aws_s3_bucket.config_logs.arn
      }
    ]
  })
}

# AWS Config Recorder
# Note: AWS accounts have a limit of 1 configuration recorder per region
# Set var.create_config_recorder = false if one already exists
resource "aws_config_configuration_recorder" "main" {
  count    = var.create_config_recorder ? 1 : 0
  name     = "${var.project_name}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_iam_role_policy_attachment.config_policy]

  lifecycle {
    create_before_destroy = false
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  count          = var.create_config_recorder ? 1 : 0
  name           = "${var.project_name}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config_logs.id

  snapshot_delivery_properties {
    delivery_frequency = "Six_Hours"
  }

}

# Start Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.create_config_recorder ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
}

# ========== AWS CONFIG RULES FOR COMPLIANCE ==========

# Config Rule: Encrypted Volumes
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }


  tags = merge(local.tags, {
    Name = "encrypted-volumes-rule"
  })
}

# Config Rule: S3 Bucket Public Read Prohibited
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }


  tags = merge(local.tags, {
    Name = "s3-public-read-prohibited-rule"
  })
}

# Config Rule: S3 Bucket Public Write Prohibited
resource "aws_config_config_rule" "s3_bucket_public_write_prohibited" {
  name = "s3-bucket-public-write-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }


  tags = merge(local.tags, {
    Name = "s3-public-write-prohibited-rule"
  })
}

# Config Rule: S3 Bucket Server Side Encryption Enabled
resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  name = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }


  tags = merge(local.tags, {
    Name = "s3-encryption-enabled-rule"
  })
}

# Config Rule: S3 Bucket Versioning Enabled
resource "aws_config_config_rule" "s3_bucket_versioning_enabled" {
  name = "s3-bucket-versioning-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }


  tags = merge(local.tags, {
    Name = "s3-versioning-enabled-rule"
  })
}

# Config Rule: CloudTrail Enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }


  tags = merge(local.tags, {
    Name = "cloudtrail-enabled-rule"
  })
}

# Config Rule: RDS Storage Encrypted
resource "aws_config_config_rule" "rds_storage_encrypted" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }


  tags = merge(local.tags, {
    Name = "rds-storage-encrypted-rule"
  })
}

# Config Rule: IAM Password Policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "14"
    PasswordReusePrevention    = "24"
    MaxPasswordAge             = "90"
  })


  tags = merge(local.tags, {
    Name = "iam-password-policy-rule"
  })
}

# Config Rule: Root Account MFA Enabled
resource "aws_config_config_rule" "root_account_mfa_enabled" {
  name = "root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }


  tags = merge(local.tags, {
    Name = "root-mfa-enabled-rule"
  })
}

# Config Rule: VPC Flow Logs Enabled
resource "aws_config_config_rule" "vpc_flow_logs_enabled" {
  name = "vpc-flow-logs-enabled"

  source {
    owner             = "AWS"
    source_identifier = "VPC_FLOW_LOGS_ENABLED"
  }


  tags = merge(local.tags, {
    Name = "vpc-flow-logs-enabled-rule"
  })
}

# ========== CONFIG AGGREGATOR FOR MULTI-ACCOUNT ==========

# IAM role for Config Aggregator
resource "aws_iam_role" "config_aggregator" {
  name = "${var.project_name}-config-aggregator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-config-aggregator-role"
  })
}

resource "aws_iam_role_policy" "config_aggregator" {
  name = "${var.project_name}-config-aggregator-policy"
  role = aws_iam_role.config_aggregator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "config:PutConfigurationAggregator",
          "config:GetOrganizationConfigRuleDetailedStatus",
          "config:GetOrganizationConformancePackDetailedStatus",
          "config:DescribeConfigurationAggregators",
          "config:ListAggregateDiscoveredResources",
          "config:GetAggregateComplianceDetailsByConfigRule",
          "config:GetAggregateConfigRuleComplianceSummary"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "organizations:ListAccounts",
          "organizations:DescribeOrganization",
          "organizations:ListAWSServiceAccessForOrganization"
        ]
        Resource = "*"
      }
    ]
  })
}

# Config Aggregator for Organization
# Only create if organization_id is provided
resource "aws_config_configuration_aggregator" "organization" {
  count = var.organization_id != "" ? 1 : 0
  name  = "${var.project_name}-org-aggregator"

  organization_aggregation_source {
    all_regions = true
    role_arn    = aws_iam_role.config_aggregator.arn
  }

  depends_on = [aws_iam_role_policy.config_aggregator]

  tags = merge(local.tags, {
    Name = "${var.project_name}-org-aggregator"
  })
}

# Config Aggregator for single account (when no organization)
resource "aws_config_configuration_aggregator" "account" {
  count = var.organization_id == "" ? 1 : 0
  name  = "${var.project_name}-account-aggregator"

  account_aggregation_source {
    account_ids = [data.aws_caller_identity.current.account_id]
    all_regions = true
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-account-aggregator"
  })
}

# ========== SECURITY HUB SETUP ==========

# Enable Security Hub
# Note: Set var.create_security_hub=true only for accounts not already subscribed
resource "aws_securityhub_account" "main" {
  count                    = var.create_security_hub ? 1 : 0
  enable_default_standards = false
}

# Enable AWS Foundational Security Best Practices
# Note: Security Hub standards can take 15-20 minutes to fully initialize
# Comment out if experiencing timeouts - standards can be enabled manually in console
# resource "aws_securityhub_standards_subscription" "aws_foundational" {
#   count         = var.create_security_hub ? 1 : 0
#   standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/aws-foundational-security-best-practices/v/1.0.0"
#
#   depends_on = [aws_securityhub_account.main]
# }

# Enable CIS AWS Foundations Benchmark
# Note: May not be available in all regions or accounts
# resource "aws_securityhub_standards_subscription" "cis" {
#   count         = var.create_security_hub ? 1 : 0
#   standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/cis-aws-foundations-benchmark/v/1.2.0"
#
#   depends_on = [aws_securityhub_account.main]
# }

# Enable PCI-DSS
# Note: Can take long time to initialize
# resource "aws_securityhub_standards_subscription" "pci_dss" {
#   count         = var.create_security_hub ? 1 : 0
#   standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/pci-dss/v/3.2.1"
#
#   depends_on = [aws_securityhub_account.main]
# }

# Security Hub finding aggregator
# Note: Works with existing Security Hub subscription
resource "aws_securityhub_finding_aggregator" "main" {
  linking_mode = "ALL_REGIONS"
}

# ========== GUARDDUTY SETUP ==========

# Enable GuardDuty
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = var.guardduty_finding_publishing_frequency

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

  tags = merge(local.tags, {
    Name = "${var.project_name}-guardduty-detector"
  })
}

# GuardDuty organization configuration (for delegated admin)
# Only create if organization_id is provided
resource "aws_guardduty_organization_configuration" "main" {
  count                            = var.organization_id != "" ? 1 : 0
  detector_id                      = aws_guardduty_detector.main.id
  auto_enable_organization_members = "ALL"
}

# ========== SNS TOPICS FOR ALERTS ==========

# SNS topic for critical compliance violations
resource "aws_sns_topic" "critical_violations" {
  name              = "${var.project_name}-critical-violations"
  display_name      = "Critical Compliance Violations"
  kms_master_key_id = aws_kms_key.audit_logs.id

  tags = merge(local.tags, {
    Name     = "${var.project_name}-critical-violations"
    Severity = "critical"
  })
}

# SNS topic for security findings
resource "aws_sns_topic" "security_findings" {
  name              = "${var.project_name}-security-findings"
  display_name      = "Security Hub and GuardDuty Findings"
  kms_master_key_id = aws_kms_key.audit_logs.id

  tags = merge(local.tags, {
    Name     = "${var.project_name}-security-findings"
    Severity = "high"
  })
}

# SNS topic for compliance reports
resource "aws_sns_topic" "compliance_reports" {
  name              = "${var.project_name}-compliance-reports"
  display_name      = "Compliance Reports and Audit Notifications"
  kms_master_key_id = aws_kms_key.audit_logs.id

  tags = merge(local.tags, {
    Name = "${var.project_name}-compliance-reports"
  })
}

# SNS subscriptions (email endpoints)
resource "aws_sns_topic_subscription" "critical_violations_email" {
  topic_arn = aws_sns_topic.critical_violations.arn
  protocol  = "email"
  endpoint  = var.critical_alert_email
}

resource "aws_sns_topic_subscription" "security_findings_email" {
  topic_arn = aws_sns_topic.security_findings.arn
  protocol  = "email"
  endpoint  = var.security_email
}

resource "aws_sns_topic_subscription" "compliance_reports_email" {
  topic_arn = aws_sns_topic.compliance_reports.arn
  protocol  = "email"
  endpoint  = var.compliance_email
}

# ========== DYNAMODB TABLES FOR COMPLIANCE TRACKING ==========

# DynamoDB table for violation tracking
resource "aws_dynamodb_table" "violations" {
  name           = "${var.project_name}-violations"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "violation_id"
  range_key      = "timestamp"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "violation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "resource_type"
    type = "S"
  }

  attribute {
    name = "compliance_status"
    type = "S"
  }

  global_secondary_index {
    name            = "AccountIndex"
    hash_key        = "account_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "ResourceTypeIndex"
    hash_key        = "resource_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "ComplianceStatusIndex"
    hash_key        = "compliance_status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-violations"
  })
}

# DynamoDB table for remediation history
resource "aws_dynamodb_table" "remediation_history" {
  name           = "${var.project_name}-remediation-history"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "remediation_id"
  range_key      = "timestamp"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "remediation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "violation_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "ViolationIndex"
    hash_key        = "violation_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-remediation-history"
  })
}

# DynamoDB table for compliance state
resource "aws_dynamodb_table" "compliance_state" {
  name           = "${var.project_name}-compliance-state"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "account_id"
  range_key      = "resource_id"

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "resource_id"
    type = "S"
  }

  attribute {
    name = "compliance_type"
    type = "S"
  }

  global_secondary_index {
    name            = "ComplianceTypeIndex"
    hash_key        = "compliance_type"
    range_key       = "account_id"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.tags, {
    Name = "${var.project_name}-compliance-state"
  })
}

# ========== LAMBDA REMEDIATION FUNCTIONS ==========

# CloudWatch Log Groups for Lambda functions
# Note: Using AWS managed encryption to avoid KMS permission complexity
resource "aws_cloudwatch_log_group" "lambda_stop_non_compliant_instances" {
  name              = "/aws/lambda/${var.project_name}-stop-non-compliant-instances"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${var.project_name}-stop-instances-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_enable_s3_encryption" {
  name              = "/aws/lambda/${var.project_name}-enable-s3-encryption"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${var.project_name}-enable-encryption-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_enable_s3_versioning" {
  name              = "/aws/lambda/${var.project_name}-enable-s3-versioning"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${var.project_name}-enable-versioning-logs"
  })
}

resource "aws_cloudwatch_log_group" "lambda_block_s3_public_access" {
  name              = "/aws/lambda/${var.project_name}-block-s3-public-access"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "${var.project_name}-block-public-access-logs"
  })
}

# IAM role for remediation Lambda functions
resource "aws_iam_role" "lambda_remediation" {
  name = "${var.project_name}-lambda-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-lambda-remediation-role"
  })
}

# IAM policy for Lambda remediation functions
resource "aws_iam_role_policy" "lambda_remediation" {
  name = "${var.project_name}-lambda-remediation-policy"
  role = aws_iam_role.lambda_remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.lambda_stop_non_compliant_instances.arn}:*",
          "${aws_cloudwatch_log_group.lambda_enable_s3_encryption.arn}:*",
          "${aws_cloudwatch_log_group.lambda_enable_s3_versioning.arn}:*",
          "${aws_cloudwatch_log_group.lambda_block_s3_public_access.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketVersioning",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketVersioning",
          "s3:GetBucketPublicAccessBlock"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.violations.arn,
          aws_dynamodb_table.remediation_history.arn,
          aws_dynamodb_table.compliance_state.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.critical_violations.arn,
          aws_sns_topic.security_findings.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.lambda.arn,
          aws_kms_key.dynamodb.arn,
          aws_kms_key.audit_logs.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sts:AssumeRole"
        ]
        Resource = "arn:aws:iam::*:role/${var.project_name}-cross-account-remediation-role"
      }
    ]
  })
}

# Lambda function: Stop non-compliant EC2 instances
data "archive_file" "lambda_stop_instances" {
  type        = "zip"
  output_path = "${path.module}/lambda-stop-instances.zip"

  source {
    content = <<EOF
import json
import boto3
import os
import time
from datetime import datetime

ec2 = boto3.client('ec2')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

violations_table = dynamodb.Table(os.environ['VIOLATIONS_TABLE'])
remediation_table = dynamodb.Table(os.environ['REMEDIATION_TABLE'])

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Parse Config event
    config_item = json.loads(event['detail']['configurationItem'])
    instance_id = config_item['resourceId']
    account_id = config_item['awsAccountId']
    
    violation_id = f"{account_id}-{instance_id}-{int(time.time())}"
    remediation_id = f"REM-{violation_id}"
    
    try:
        # Stop the non-compliant instance
        response = ec2.stop_instances(InstanceIds=[instance_id])
        print(f"Stopped instance {instance_id}: {response}")
        
        # Record violation
        violations_table.put_item(
            Item={
                'violation_id': violation_id,
                'timestamp': int(time.time()),
                'account_id': account_id,
                'resource_type': 'EC2::Instance',
                'resource_id': instance_id,
                'compliance_status': 'NON_COMPLIANT',
                'violation_type': 'unencrypted_volume',
                'detected_at': datetime.utcnow().isoformat()
            }
        )
        
        # Record remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'COMPLETED',
                'action': 'stop_instance',
                'resource_id': instance_id,
                'completed_at': datetime.utcnow().isoformat()
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f'Instance {instance_id} stopped due to compliance violation',
            Message=f'EC2 instance {instance_id} in account {account_id} was stopped due to unencrypted EBS volumes.'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Instance stopped successfully',
                'instance_id': instance_id,
                'violation_id': violation_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Record failed remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'FAILED',
                'action': 'stop_instance',
                'resource_id': instance_id,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
        )
        
        raise e
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "stop_non_compliant_instances" {
  filename         = data.archive_file.lambda_stop_instances.output_path
  function_name    = "${var.project_name}-stop-non-compliant-instances"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  timeout          = var.remediation_lambda_timeout
  memory_size      = var.remediation_lambda_memory
  source_code_hash = data.archive_file.lambda_stop_instances.output_base64sha256
  kms_key_arn      = aws_kms_key.lambda.arn

  environment {
    variables = {
      VIOLATIONS_TABLE   = aws_dynamodb_table.violations.name
      REMEDIATION_TABLE  = aws_dynamodb_table.remediation_history.name
      SNS_TOPIC_ARN      = aws_sns_topic.critical_violations.arn
      AUTO_REMEDIATE     = tostring(var.auto_remediation_enabled)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_stop_non_compliant_instances,
    aws_iam_role_policy.lambda_remediation
  ]

  tags = merge(local.tags, {
    Name = "${var.project_name}-stop-instances"
  })
}

# Lambda function: Enable S3 encryption
data "archive_file" "lambda_enable_s3_encryption" {
  type        = "zip"
  output_path = "${path.module}/lambda-enable-s3-encryption.zip"

  source {
    content = <<EOF
import json
import boto3
import os
import time
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

violations_table = dynamodb.Table(os.environ['VIOLATIONS_TABLE'])
remediation_table = dynamodb.Table(os.environ['REMEDIATION_TABLE'])

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Parse Config event
    config_item = json.loads(event['detail']['configurationItem'])
    bucket_name = config_item['resourceName']
    account_id = config_item['awsAccountId']
    
    violation_id = f"{account_id}-{bucket_name}-{int(time.time())}"
    remediation_id = f"REM-{violation_id}"
    
    try:
        # Enable default encryption on S3 bucket
        s3.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                'Rules': [
                    {
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'AES256'
                        },
                        'BucketKeyEnabled': True
                    }
                ]
            }
        )
        print(f"Enabled encryption for bucket {bucket_name}")
        
        # Record violation
        violations_table.put_item(
            Item={
                'violation_id': violation_id,
                'timestamp': int(time.time()),
                'account_id': account_id,
                'resource_type': 'S3::Bucket',
                'resource_id': bucket_name,
                'compliance_status': 'NON_COMPLIANT',
                'violation_type': 'missing_encryption',
                'detected_at': datetime.utcnow().isoformat()
            }
        )
        
        # Record remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'COMPLETED',
                'action': 'enable_s3_encryption',
                'resource_id': bucket_name,
                'completed_at': datetime.utcnow().isoformat()
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f'S3 encryption enabled for {bucket_name}',
            Message=f'Default encryption was enabled for S3 bucket {bucket_name} in account {account_id}.'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 encryption enabled successfully',
                'bucket_name': bucket_name,
                'violation_id': violation_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Record failed remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'FAILED',
                'action': 'enable_s3_encryption',
                'resource_id': bucket_name,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
        )
        
        raise e
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "enable_s3_encryption" {
  filename         = data.archive_file.lambda_enable_s3_encryption.output_path
  function_name    = "${var.project_name}-enable-s3-encryption"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  timeout          = var.remediation_lambda_timeout
  memory_size      = var.remediation_lambda_memory
  source_code_hash = data.archive_file.lambda_enable_s3_encryption.output_base64sha256
  kms_key_arn      = aws_kms_key.lambda.arn

  environment {
    variables = {
      VIOLATIONS_TABLE   = aws_dynamodb_table.violations.name
      REMEDIATION_TABLE  = aws_dynamodb_table.remediation_history.name
      SNS_TOPIC_ARN      = aws_sns_topic.security_findings.arn
      AUTO_REMEDIATE     = tostring(var.auto_remediation_enabled)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_enable_s3_encryption,
    aws_iam_role_policy.lambda_remediation
  ]

  tags = merge(local.tags, {
    Name = "${var.project_name}-enable-s3-encryption"
  })
}

# Lambda function: Enable S3 versioning
data "archive_file" "lambda_enable_s3_versioning" {
  type        = "zip"
  output_path = "${path.module}/lambda-enable-s3-versioning.zip"

  source {
    content = <<EOF
import json
import boto3
import os
import time
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

violations_table = dynamodb.Table(os.environ['VIOLATIONS_TABLE'])
remediation_table = dynamodb.Table(os.environ['REMEDIATION_TABLE'])

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Parse Config event
    config_item = json.loads(event['detail']['configurationItem'])
    bucket_name = config_item['resourceName']
    account_id = config_item['awsAccountId']
    
    violation_id = f"{account_id}-{bucket_name}-{int(time.time())}"
    remediation_id = f"REM-{violation_id}"
    
    try:
        # Enable versioning on S3 bucket
        s3.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )
        print(f"Enabled versioning for bucket {bucket_name}")
        
        # Record violation
        violations_table.put_item(
            Item={
                'violation_id': violation_id,
                'timestamp': int(time.time()),
                'account_id': account_id,
                'resource_type': 'S3::Bucket',
                'resource_id': bucket_name,
                'compliance_status': 'NON_COMPLIANT',
                'violation_type': 'versioning_disabled',
                'detected_at': datetime.utcnow().isoformat()
            }
        )
        
        # Record remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'COMPLETED',
                'action': 'enable_s3_versioning',
                'resource_id': bucket_name,
                'completed_at': datetime.utcnow().isoformat()
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f'S3 versioning enabled for {bucket_name}',
            Message=f'Versioning was enabled for S3 bucket {bucket_name} in account {account_id}.'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 versioning enabled successfully',
                'bucket_name': bucket_name,
                'violation_id': violation_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Record failed remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'FAILED',
                'action': 'enable_s3_versioning',
                'resource_id': bucket_name,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
        )
        
        raise e
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "enable_s3_versioning" {
  filename         = data.archive_file.lambda_enable_s3_versioning.output_path
  function_name    = "${var.project_name}-enable-s3-versioning"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  timeout          = var.remediation_lambda_timeout
  memory_size      = var.remediation_lambda_memory
  source_code_hash = data.archive_file.lambda_enable_s3_versioning.output_base64sha256
  kms_key_arn      = aws_kms_key.lambda.arn

  environment {
    variables = {
      VIOLATIONS_TABLE   = aws_dynamodb_table.violations.name
      REMEDIATION_TABLE  = aws_dynamodb_table.remediation_history.name
      SNS_TOPIC_ARN      = aws_sns_topic.security_findings.arn
      AUTO_REMEDIATE     = tostring(var.auto_remediation_enabled)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_enable_s3_versioning,
    aws_iam_role_policy.lambda_remediation
  ]

  tags = merge(local.tags, {
    Name = "${var.project_name}-enable-s3-versioning"
  })
}

# Lambda function: Block S3 public access
data "archive_file" "lambda_block_s3_public_access" {
  type        = "zip"
  output_path = "${path.module}/lambda-block-s3-public-access.zip"

  source {
    content = <<EOF
import json
import boto3
import os
import time
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

violations_table = dynamodb.Table(os.environ['VIOLATIONS_TABLE'])
remediation_table = dynamodb.Table(os.environ['REMEDIATION_TABLE'])

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Parse Config event
    config_item = json.loads(event['detail']['configurationItem'])
    bucket_name = config_item['resourceName']
    account_id = config_item['awsAccountId']
    
    violation_id = f"{account_id}-{bucket_name}-{int(time.time())}"
    remediation_id = f"REM-{violation_id}"
    
    try:
        # Block public access on S3 bucket
        s3.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )
        print(f"Blocked public access for bucket {bucket_name}")
        
        # Record violation
        violations_table.put_item(
            Item={
                'violation_id': violation_id,
                'timestamp': int(time.time()),
                'account_id': account_id,
                'resource_type': 'S3::Bucket',
                'resource_id': bucket_name,
                'compliance_status': 'NON_COMPLIANT',
                'violation_type': 'public_access_allowed',
                'detected_at': datetime.utcnow().isoformat()
            }
        )
        
        # Record remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'COMPLETED',
                'action': 'block_s3_public_access',
                'resource_id': bucket_name,
                'completed_at': datetime.utcnow().isoformat()
            }
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f'Public access blocked for S3 bucket {bucket_name}',
            Message=f'Public access was blocked for S3 bucket {bucket_name} in account {account_id} due to compliance violation.'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 public access blocked successfully',
                'bucket_name': bucket_name,
                'violation_id': violation_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Record failed remediation
        remediation_table.put_item(
            Item={
                'remediation_id': remediation_id,
                'timestamp': int(time.time()),
                'violation_id': violation_id,
                'status': 'FAILED',
                'action': 'block_s3_public_access',
                'resource_id': bucket_name,
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
        )
        
        raise e
EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "block_s3_public_access" {
  filename         = data.archive_file.lambda_block_s3_public_access.output_path
  function_name    = "${var.project_name}-block-s3-public-access"
  role             = aws_iam_role.lambda_remediation.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  timeout          = var.remediation_lambda_timeout
  memory_size      = var.remediation_lambda_memory
  source_code_hash = data.archive_file.lambda_block_s3_public_access.output_base64sha256
  kms_key_arn      = aws_kms_key.lambda.arn

  environment {
    variables = {
      VIOLATIONS_TABLE   = aws_dynamodb_table.violations.name
      REMEDIATION_TABLE  = aws_dynamodb_table.remediation_history.name
      SNS_TOPIC_ARN      = aws_sns_topic.critical_violations.arn
      AUTO_REMEDIATE     = tostring(var.auto_remediation_enabled)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_block_s3_public_access,
    aws_iam_role_policy.lambda_remediation
  ]

  tags = merge(local.tags, {
    Name = "${var.project_name}-block-s3-public-access"
  })
}

# ========== EVENTBRIDGE RULES FOR COMPLIANCE AUTOMATION ==========

# EventBridge rule for non-compliant EC2 instances
resource "aws_cloudwatch_event_rule" "non_compliant_instances" {
  name        = "${var.project_name}-non-compliant-instances"
  description = "Trigger remediation for EC2 instances with unencrypted volumes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      configRuleName = [
        aws_config_config_rule.encrypted_volumes.name
      ]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
      resourceType = ["AWS::EC2::Instance"]
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-non-compliant-instances-rule"
  })
}

resource "aws_cloudwatch_event_target" "non_compliant_instances" {
  count     = var.auto_remediation_enabled ? 1 : 0
  rule      = aws_cloudwatch_event_rule.non_compliant_instances.name
  target_id = "RemediateNonCompliantInstances"
  arn       = aws_lambda_function.stop_non_compliant_instances.arn
}

resource "aws_lambda_permission" "allow_eventbridge_instances" {
  count         = var.auto_remediation_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stop_non_compliant_instances.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.non_compliant_instances.arn
}

# EventBridge rule for S3 encryption violations
resource "aws_cloudwatch_event_rule" "s3_encryption_violations" {
  name        = "${var.project_name}-s3-encryption-violations"
  description = "Trigger remediation for S3 buckets without encryption"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      configRuleName = [
        aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name
      ]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
      resourceType = ["AWS::S3::Bucket"]
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-s3-encryption-violations-rule"
  })
}

resource "aws_cloudwatch_event_target" "s3_encryption_violations" {
  count     = var.auto_remediation_enabled ? 1 : 0
  rule      = aws_cloudwatch_event_rule.s3_encryption_violations.name
  target_id = "RemediateS3Encryption"
  arn       = aws_lambda_function.enable_s3_encryption.arn
}

resource "aws_lambda_permission" "allow_eventbridge_s3_encryption" {
  count         = var.auto_remediation_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.enable_s3_encryption.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_encryption_violations.arn
}

# EventBridge rule for S3 versioning violations
resource "aws_cloudwatch_event_rule" "s3_versioning_violations" {
  name        = "${var.project_name}-s3-versioning-violations"
  description = "Trigger remediation for S3 buckets without versioning"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      configRuleName = [
        aws_config_config_rule.s3_bucket_versioning_enabled.name
      ]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
      resourceType = ["AWS::S3::Bucket"]
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-s3-versioning-violations-rule"
  })
}

resource "aws_cloudwatch_event_target" "s3_versioning_violations" {
  count     = var.auto_remediation_enabled ? 1 : 0
  rule      = aws_cloudwatch_event_rule.s3_versioning_violations.name
  target_id = "RemediateS3Versioning"
  arn       = aws_lambda_function.enable_s3_versioning.arn
}

resource "aws_lambda_permission" "allow_eventbridge_s3_versioning" {
  count         = var.auto_remediation_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.enable_s3_versioning.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_versioning_violations.arn
}

# EventBridge rule for S3 public access violations
resource "aws_cloudwatch_event_rule" "s3_public_access_violations" {
  name        = "${var.project_name}-s3-public-access-violations"
  description = "Trigger remediation for publicly accessible S3 buckets"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
      configRuleName = [
        aws_config_config_rule.s3_bucket_public_read_prohibited.name,
        aws_config_config_rule.s3_bucket_public_write_prohibited.name
      ]
      newEvaluationResult = {
        complianceType = ["NON_COMPLIANT"]
      }
      resourceType = ["AWS::S3::Bucket"]
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-s3-public-access-violations-rule"
  })
}

resource "aws_cloudwatch_event_target" "s3_public_access_violations" {
  count     = var.auto_remediation_enabled ? 1 : 0
  rule      = aws_cloudwatch_event_rule.s3_public_access_violations.name
  target_id = "RemediateS3PublicAccess"
  arn       = aws_lambda_function.block_s3_public_access.arn
}

resource "aws_lambda_permission" "allow_eventbridge_s3_public_access" {
  count         = var.auto_remediation_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.block_s3_public_access.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_public_access_violations.arn
}

# EventBridge rule for Security Hub findings
resource "aws_cloudwatch_event_rule" "security_hub_findings" {
  name        = "${var.project_name}-security-hub-findings"
  description = "Route Security Hub findings to SNS for notification"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL", "HIGH"]
        }
      }
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-security-hub-findings-rule"
  })
}

resource "aws_cloudwatch_event_target" "security_hub_findings" {
  rule      = aws_cloudwatch_event_rule.security_hub_findings.name
  target_id = "SecurityHubToSNS"
  arn       = aws_sns_topic.security_findings.arn
}

# EventBridge rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "${var.project_name}-guardduty-findings"
  description = "Route GuardDuty findings to SNS for notification"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
    }
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-guardduty-findings-rule"
  })
}

resource "aws_cloudwatch_event_target" "guardduty_findings" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "GuardDutyToSNS"
  arn       = aws_sns_topic.security_findings.arn
}

# SNS topic policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "security_findings" {
  arn = aws_sns_topic.security_findings.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_findings.arn
      }
    ]
  })
}

# ========== CLOUDWATCH DASHBOARDS ==========

resource "aws_cloudwatch_dashboard" "compliance_overview" {
  dashboard_name = "${var.project_name}-compliance-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Total Remediations" }],
            [".", "Errors", { stat = "Sum", label = "Remediation Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Remediation Activity"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Config", "ConfigurationItemsRecorded", { stat = "Sum" }]
          ]
          period = 3600
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Configuration Changes Tracked"
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.cloudtrail.name}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = data.aws_region.current.name
          title   = "Recent CloudTrail Events"
        }
      }
    ]
  })
}

# ========== IAM CROSS-ACCOUNT ROLES ==========

# Cross-account remediation role (for member accounts to assume)
resource "aws_iam_role" "cross_account_remediation" {
  name = "${var.project_name}-cross-account-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_remediation.arn
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-remediation"
          }
        }
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${var.project_name}-cross-account-remediation-role"
  })
}

resource "aws_iam_role_policy" "cross_account_remediation" {
  name = "${var.project_name}-cross-account-remediation-policy"
  role = aws_iam_role.cross_account_remediation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketVersioning",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketVersioning",
          "s3:GetBucketPublicAccessBlock"
        ]
        Resource = "arn:aws:s3:::*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:PutEvaluations"
        ]
        Resource = "*"
      }
    ]
  })
}

# ========== QUICKSIGHT RESOURCES ==========

# QuickSight data source for DynamoDB violations table
# Note: QuickSight must be manually initialized in the account first
# This resource will fail if QuickSight is not set up - comment out if not using QuickSight
# resource "aws_quicksight_data_source" "violations" {
#   data_source_id = "${var.project_name}-violations-datasource"
#   name           = "${var.project_name}-violations"
#   type           = "ATHENA"
#
#   parameters {
#     athena {
#       work_group = "primary"
#     }
#   }
#
#   permission {
#     principal = "arn:aws:quicksight:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:user/default/${var.quicksight_user_email}"
#     actions = [
#       "quicksight:DescribeDataSource",
#       "quicksight:DescribeDataSourcePermissions",
#       "quicksight:PassDataSource",
#       "quicksight:UpdateDataSource",
#       "quicksight:DeleteDataSource",
#       "quicksight:UpdateDataSourcePermissions"
#     ]
#   }
#
#   tags = merge(local.tags, {
#     Name = "${var.project_name}-violations-datasource"
#   })
# }

# ========== OUTPUTS ==========

output "cloudtrail_s3_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "config_s3_bucket" {
  description = "S3 bucket name for AWS Config logs"
  value       = aws_s3_bucket.config_logs.id
}

output "cloudtrail_trail_arn" {
  description = "ARN of the CloudTrail organization trail"
  value       = aws_cloudtrail.organization_trail.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = var.create_config_recorder ? aws_config_configuration_recorder.main[0].name : "existing-recorder-not-managed"
}

output "config_aggregator_arn" {
  description = "ARN of the Config aggregator"
  value       = var.organization_id != "" ? aws_config_configuration_aggregator.organization[0].arn : aws_config_configuration_aggregator.account[0].arn
}

output "security_hub_arn" {
  description = "ARN of the Security Hub account"
  value       = var.create_security_hub ? aws_securityhub_account.main[0].arn : "existing-security-hub-not-managed"
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "violations_table_name" {
  description = "Name of the DynamoDB violations tracking table"
  value       = aws_dynamodb_table.violations.name
}

output "remediation_history_table_name" {
  description = "Name of the DynamoDB remediation history table"
  value       = aws_dynamodb_table.remediation_history.name
}

output "compliance_state_table_name" {
  description = "Name of the DynamoDB compliance state table"
  value       = aws_dynamodb_table.compliance_state.name
}

output "critical_violations_topic_arn" {
  description = "ARN of the SNS topic for critical violations"
  value       = aws_sns_topic.critical_violations.arn
}

output "security_findings_topic_arn" {
  description = "ARN of the SNS topic for security findings"
  value       = aws_sns_topic.security_findings.arn
}

output "compliance_reports_topic_arn" {
  description = "ARN of the SNS topic for compliance reports"
  value       = aws_sns_topic.compliance_reports.arn
}

output "lambda_stop_instances_arn" {
  description = "ARN of the Lambda function for stopping non-compliant instances"
  value       = aws_lambda_function.stop_non_compliant_instances.arn
}

output "lambda_enable_s3_encryption_arn" {
  description = "ARN of the Lambda function for enabling S3 encryption"
  value       = aws_lambda_function.enable_s3_encryption.arn
}

output "lambda_enable_s3_versioning_arn" {
  description = "ARN of the Lambda function for enabling S3 versioning"
  value       = aws_lambda_function.enable_s3_versioning.arn
}

output "lambda_block_s3_public_access_arn" {
  description = "ARN of the Lambda function for blocking S3 public access"
  value       = aws_lambda_function.block_s3_public_access.arn
}

output "compliance_dashboard_url" {
  description = "URL to the CloudWatch compliance dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.compliance_overview.dashboard_name}"
}

output "security_hub_url" {
  description = "URL to the Security Hub console"
  value       = "https://console.aws.amazon.com/securityhub/home?region=${data.aws_region.current.name}#/summary"
}

output "config_compliance_url" {
  description = "URL to the AWS Config compliance dashboard"
  value       = "https://console.aws.amazon.com/config/home?region=${data.aws_region.current.name}#/dashboard"
}

output "kms_audit_logs_key_arn" {
  description = "ARN of the KMS key for audit logs encryption"
  value       = aws_kms_key.audit_logs.arn
}

output "kms_dynamodb_key_arn" {
  description = "ARN of the KMS key for DynamoDB encryption"
  value       = aws_kms_key.dynamodb.arn
}

output "kms_lambda_key_arn" {
  description = "ARN of the KMS key for Lambda encryption"
  value       = aws_kms_key.lambda.arn
}

output "cross_account_remediation_role_arn" {
  description = "ARN of the cross-account remediation role for member accounts"
  value       = aws_iam_role.cross_account_remediation.arn
}
