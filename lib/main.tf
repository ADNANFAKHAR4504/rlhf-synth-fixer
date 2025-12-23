# main.tf
# Multi-Account Security Framework with Centralized Key Management
# This configuration implements a zero-trust security architecture across AWS multi-account structure
# with centralized encryption key management and granular access controls compliant with PCI-DSS

#
# 1. AWS ORGANIZATIONS STRUCTURE
#    Create organization with 3 OUs: Security, Prod, and Dev
#

resource "aws_organizations_organization" "main" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com"
  ]

  enabled_policy_types = [
    "SERVICE_CONTROL_POLICY"
  ]

  feature_set = "ALL"
}

# Security OU
resource "aws_organizations_organizational_unit" "security" {
  name      = "Security-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}

# Production OU
resource "aws_organizations_organizational_unit" "production" {
  name      = "Production-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}

# Development OU
resource "aws_organizations_organizational_unit" "development" {
  name      = "Development-${var.environment_suffix}"
  parent_id = aws_organizations_organization.main.roots[0].id
}

#
# 2. CROSS-ACCOUNT IAM ROLES WITH MFA ENFORCEMENT
#    Deploy security audit roles with MFA for AssumeRole operations
#

# Security Audit Role - Read-only access across all accounts
resource "aws_iam_role" "security_audit" {
  name        = "SecurityAuditRole-${var.environment_suffix}"
  description = "Cross-account security audit role with MFA enforcement and read-only access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_organizations_organization.main.master_account_arn
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
    Name = "SecurityAuditRole-${var.environment_suffix}"
  }
}

# Attach AWS managed ReadOnlyAccess policy
resource "aws_iam_role_policy_attachment" "security_audit_readonly" {
  role       = aws_iam_role.security_audit.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Attach SecurityAudit managed policy
resource "aws_iam_role_policy_attachment" "security_audit_policy" {
  role       = aws_iam_role.security_audit.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

# Compliance Audit Role - Specific to compliance activities
resource "aws_iam_role" "compliance_audit" {
  name        = "ComplianceAuditRole-${var.environment_suffix}"
  description = "Cross-account compliance audit role with MFA enforcement"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_organizations_organization.main.master_account_arn
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
    Name = "ComplianceAuditRole-${var.environment_suffix}"
  }
}

# Custom policy for compliance-specific read access
resource "aws_iam_policy" "compliance_readonly" {
  name        = "ComplianceReadOnly-${var.environment_suffix}"
  description = "Read-only access for compliance auditing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "cloudtrail:Describe*",
          "cloudtrail:Get*",
          "cloudtrail:List*",
          "cloudtrail:LookupEvents",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:List*",
          "logs:FilterLogEvents",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketPolicy",
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "compliance_audit_custom" {
  role       = aws_iam_role.compliance_audit.name
  policy_arn = aws_iam_policy.compliance_readonly.arn
}

#
# 3. KMS MULTI-REGION KEYS WITH AUTOMATIC ROTATION
#    Implement centralized encryption key management with annual rotation
#

# Primary KMS key in us-east-1
resource "aws_kms_key" "primary" {
  description              = "Primary multi-region key for encryption-${var.environment_suffix}"
  deletion_window_in_days  = 7
  enable_key_rotation      = true
  multi_region             = true
  customer_master_key_spec = "SYMMETRIC_DEFAULT"

  tags = {
    Name   = "PrimaryKMSKey-${var.environment_suffix}"
    Region = "us-east-1"
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/primary-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key policy for primary key
resource "aws_kms_key_policy" "primary" {
  key_id = aws_kms_key.primary.id

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
        Sid    = "Allow use of the key for encryption"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "ebs.amazonaws.com",
            "rds.amazonaws.com",
            "logs.amazonaws.com",
            "cloudtrail.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          Service = [
            "s3.amazonaws.com",
            "ebs.amazonaws.com",
            "rds.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })
}

# Replica KMS key in eu-west-1
resource "aws_kms_replica_key" "secondary" {
  provider = aws.eu_west_1

  description             = "Secondary multi-region replica key-${var.environment_suffix}"
  deletion_window_in_days = 7
  primary_key_arn         = aws_kms_key.primary.arn

  # Tags removed due to LocalStack timeout issues with KMS replica key tagging
  # tags = {
  #   Name   = "SecondaryKMSKey-${var.environment_suffix}"
  #   Region = "eu-west-1"
  # }
}

resource "aws_kms_alias" "secondary" {
  provider = aws.eu_west_1

  name          = "alias/secondary-key-${var.environment_suffix}"
  target_key_id = aws_kms_replica_key.secondary.key_id
}

#
# 4. SERVICE CONTROL POLICIES (SCPs)
#    Enforce encryption for S3, EBS, and RDS across all accounts
#

# SCP: Enforce S3 encryption
resource "aws_organizations_policy" "enforce_s3_encryption" {
  name        = "EnforceS3Encryption-${var.environment_suffix}"
  description = "Require S3 buckets to use encryption"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedS3Uploads"
        Effect = "Deny"
        Action = [
          "s3:PutObject"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = ["AES256", "aws:kms"]
          }
        }
      },
      {
        Sid    = "RequireS3BucketEncryption"
        Effect = "Deny"
        Action = [
          "s3:CreateBucket"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = ["AES256", "aws:kms"]
          }
        }
      }
    ]
  })
}

# SCP: Enforce EBS encryption
resource "aws_organizations_policy" "enforce_ebs_encryption" {
  name        = "EnforceEBSEncryption-${var.environment_suffix}"
  description = "Require EBS volumes to be encrypted"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedEBSVolumes"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedSnapshots"
        Effect = "Deny"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateSnapshots"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      }
    ]
  })
}

# SCP: Enforce RDS encryption
resource "aws_organizations_policy" "enforce_rds_encryption" {
  name        = "EnforceRDSEncryption-${var.environment_suffix}"
  description = "Require RDS instances to be encrypted"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedRDSInstances"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:CreateDBCluster"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      }
    ]
  })
}

# SCP: Prevent disabling CloudWatch Logs
resource "aws_organizations_policy" "protect_cloudwatch_logs" {
  name        = "ProtectCloudWatchLogs-${var.environment_suffix}"
  description = "Prevent disabling of CloudWatch Logs"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyCloudWatchLogsDeletion"
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "logs:DeleteRetentionPolicy"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach SCPs to OUs
resource "aws_organizations_policy_attachment" "security_s3_encryption" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_s3_encryption" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_s3_encryption" {
  policy_id = aws_organizations_policy.enforce_s3_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_ebs_encryption" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_ebs_encryption" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_ebs_encryption" {
  policy_id = aws_organizations_policy.enforce_ebs_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_rds_encryption" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_rds_encryption" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_rds_encryption" {
  policy_id = aws_organizations_policy.enforce_rds_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "security_protect_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "production_protect_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "development_protect_logs" {
  policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
  target_id = aws_organizations_organizational_unit.development.id
}

#
# 5. IAM POLICIES FOR ROOT USER RESTRICTIONS AND TAGGING COMPLIANCE
#    Implement least-privilege access with no wildcard permissions
#

# Root user restriction policy
resource "aws_iam_policy" "restrict_root_user" {
  name        = "RestrictRootUser-${var.environment_suffix}"
  description = "Restrict root user actions in AWS account"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyRootUserActions"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      }
    ]
  })
}

# Tagging compliance policy
resource "aws_iam_policy" "enforce_tagging" {
  name        = "EnforceTagging-${var.environment_suffix}"
  description = "Enforce tagging compliance for all resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RequireEnvironmentTag"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume",
          "ec2:RunInstances",
          "rds:CreateDBInstance",
          "s3:CreateBucket",
          "lambda:CreateFunction"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Environment" = "true"
          }
        }
      },
      {
        Sid    = "RequireOwnerTag"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume",
          "ec2:RunInstances",
          "rds:CreateDBInstance",
          "s3:CreateBucket",
          "lambda:CreateFunction"
        ]
        Resource = "*"
        Condition = {
          "Null" = {
            "aws:RequestTag/Owner" = "true"
          }
        }
      }
    ]
  })
}

# Least privilege policy - Example for specific service access
resource "aws_iam_policy" "least_privilege_example" {
  name        = "LeastPrivilegeExample-${var.environment_suffix}"
  description = "Example least privilege policy with specific resource ARNs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSpecificS3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::specific-bucket-${var.environment_suffix}/*"
        ]
      },
      {
        Sid    = "AllowSpecificKMSKeyAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.primary.arn
        ]
      },
      {
        Sid    = "AllowReadOnlyGlobalActions"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "kms:ListKeys",
          "kms:ListAliases"
        ]
        Resource = "*"
      }
    ]
  })
}

#
# 6. CLOUDWATCH LOGS FOR IAM ACTIVITY WITH 90-DAY RETENTION
#    Set up centralized logging for security audit trails
#

# CloudWatch Log Group for IAM activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "IAMActivityLogs-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/organization-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.primary.arn

  tags = {
    Name = "CloudTrailLogs-${var.environment_suffix}"
  }
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name        = "CloudTrailCloudWatchRole-${var.environment_suffix}"
  description = "IAM role for CloudTrail to write logs to CloudWatch"

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

  tags = {
    Name = "CloudTrailCloudWatchRole-${var.environment_suffix}"
  }
}

# Policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "CloudTrailCloudWatchPolicy-${var.environment_suffix}"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
        ]
      }
    ]
  })
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "cloudtrail-logs-${var.environment_suffix}"

  tags = {
    Name = "CloudTrailLogsBucket-${var.environment_suffix}"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }
}

# S3 bucket policy for CloudTrail
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

# CloudTrail for organization-wide logging
resource "aws_cloudtrail" "organization" {
  name                          = "organization-trail-${var.environment_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.primary.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = {
    Name = "OrganizationTrail-${var.environment_suffix}"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail
  ]
}

#
# 7. AWS CONFIG RULES FOR SECURITY COMPLIANCE MONITORING
#    Enable continuous compliance monitoring
#

# S3 bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "aws-config-logs-${var.environment_suffix}"

  tags = {
    Name = "AWSConfigLogsBucket-${var.environment_suffix}"
  }
}

# S3 bucket encryption for Config
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }
}

# S3 bucket policy for AWS Config
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

# IAM role for AWS Config
resource "aws_iam_role" "config" {
  name        = "AWSConfigRole-${var.environment_suffix}"
  description = "IAM role for AWS Config service"

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

  tags = {
    Name = "AWSConfigRole-${var.environment_suffix}"
  }
}

# Attach AWS managed policy for Config
# Note: LocalStack does not include AWS managed policies, using inline policy instead
# resource "aws_iam_role_policy_attachment" "config" {
#   role       = aws_iam_role.config.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
# }

# Config policy with S3 access and Config service permissions
resource "aws_iam_role_policy" "config_s3" {
  name = "AWSConfigS3Policy-${var.environment_suffix}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "config:Put*",
          "config:Get*",
          "config:List*",
          "config:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Start AWS Config Recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [
    aws_config_delivery_channel.main
  ]
}

# AWS Config Rules

# Rule: S3 bucket encryption enabled
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "s3-bucket-encryption-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: EBS encryption enabled
resource "aws_config_config_rule" "ebs_encryption" {
  name = "ebs-encryption-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: RDS encryption enabled
resource "aws_config_config_rule" "rds_encryption" {
  name = "rds-encryption-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: IAM password policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "iam-password-policy-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: MFA enabled for IAM users
resource "aws_config_config_rule" "iam_mfa_enabled" {
  name = "iam-mfa-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: Root account MFA enabled
resource "aws_config_config_rule" "root_mfa_enabled" {
  name = "root-mfa-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: CloudTrail enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "cloudtrail-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Rule: CloudWatch log group encryption
resource "aws_config_config_rule" "cloudwatch_log_group_encryption" {
  name = "cloudwatch-log-group-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDWATCH_LOG_GROUP_ENCRYPTED"
  }

  depends_on = [
    aws_config_configuration_recorder.main
  ]
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
