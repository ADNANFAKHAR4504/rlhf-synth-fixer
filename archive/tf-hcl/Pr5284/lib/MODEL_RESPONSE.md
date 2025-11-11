I'll help you build a comprehensive zero-trust AWS infrastructure setup for PCI-DSS compliance. This is a complete Terraform module that implements all the security controls you've outlined.

## 1. iam.tf - IAM Roles, Policies, and Permission Boundaries

```hcl
# iam.tf - IAM roles, policies, and permission boundaries

# Data source for AWS Organizations
data "aws_organizations_organization" "current" {}

# Data source for current caller identity
data "aws_caller_identity" "current" {}

# Password policy for the account
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_uppercase_characters   = true
  require_lowercase_characters   = true
  require_numbers               = true
  require_symbols               = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 24
  hard_expiry                   = false
}

# Permission boundary for developers
resource "aws_iam_policy" "developer_permission_boundary" {
  name        = "${local.name_prefix}-developer-permission-boundary"
  description = "Permission boundary for developer roles to prevent privilege escalation"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListUsers",
          "iam:ListRoles"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnAccessKeys"
        Effect = "Allow"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/$${aws:username}"
      },
      {
        Sid    = "DenyAdminActions"
        Effect = "Deny"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicy",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyPermissionBoundaryDeletion"
        Effect = "Deny"
        Action = [
          "iam:DeleteRolePermissionsBoundary",
          "iam:DeleteUserPermissionsBoundary"
        ]
        Resource = "*"
      }
    ]
  })
}

# Trust policy for assuming roles with MFA
data "aws_iam_policy_document" "assume_role_with_mfa" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    
    actions = ["sts:AssumeRole"]
    
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
    
    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"] # MFA must be used within last hour
    }
  }
}

# Developer role
resource "aws_iam_role" "developer" {
  name                 = "${local.name_prefix}-developer-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  permissions_boundary = aws_iam_policy.developer_permission_boundary.arn
  max_session_duration = 14400 # 4 hours

  tags = local.mandatory_tags
}

# Developer policy
resource "aws_iam_policy" "developer_policy" {
  name        = "${local.name_prefix}-developer-policy"
  description = "Policy for developer role with restricted permissions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2ReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:List*",
          "ec2:Get*"
        ]
        Resource = "*"
      },
      {
        Sid    = "EC2ManageOwnInstances"
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
            "ec2:ResourceTag/Owner" = "$${aws:username}"
          }
        }
      },
      {
        Sid    = "S3ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Resource = "*"
      },
      {
        Sid    = "S3DevBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${local.name_prefix}-dev-*",
          "arn:aws:s3:::${local.name_prefix}-dev-*/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "RequireEncryption"
        Effect = "Deny"
        Action = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/${local.name_prefix}-*"
      }
    ]
  })
}

# Attach policy to developer role
resource "aws_iam_role_policy_attachment" "developer_policy" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer_policy.arn
}

# Operations role
resource "aws_iam_role" "operations" {
  name                 = "${local.name_prefix}-operations-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 28800 # 8 hours

  tags = local.mandatory_tags
}

# Operations policy
resource "aws_iam_policy" "operations_policy" {
  name        = "${local.name_prefix}-operations-policy"
  description = "Policy for operations role with production access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Management"
        Effect = "Allow"
        Action = [
          "ec2:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
          StringNotEquals = {
            "ec2:InstanceType" = var.prohibited_instance_types
          }
        }
      },
      {
        Sid    = "RDSManagement"
        Effect = "Allow"
        Action = [
          "rds:Describe*",
          "rds:List*",
          "rds:CreateDBSnapshot",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:ModifyDBInstance",
          "rds:RebootDBInstance"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid    = "S3Management"
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "private"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedUploads"
        Effect = "Deny"
        Action = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchFullAccess"
        Effect = "Allow"
        Action = [
          "cloudwatch:*",
          "logs:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "SystemsManagerAccess"
        Effect = "Allow"
        Action = [
          "ssm:*",
          "ssmmessages:*",
          "ec2messages:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSUsage"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey",
          "kms:ListKeys",
          "kms:ListAliases"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.allowed_regions[0]}.amazonaws.com",
              "s3.${var.allowed_regions[1]}.amazonaws.com",
              "rds.${var.allowed_regions[0]}.amazonaws.com",
              "rds.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Attach policy to operations role
resource "aws_iam_role_policy_attachment" "operations_policy" {
  role       = aws_iam_role.operations.name
  policy_arn = aws_iam_policy.operations_policy.arn
}

# Security team role
resource "aws_iam_role" "security" {
  name                 = "${local.name_prefix}-security-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags
}

# Security team policy
resource "aws_iam_policy" "security_policy" {
  name        = "${local.name_prefix}-security-policy"
  description = "Policy for security team with audit and compliance capabilities"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecurityAuditAccess"
        Effect = "Allow"
        Action = [
          "access-analyzer:*",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetEventSelectors",
          "cloudtrail:ListTags",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:GenerateCredentialReport",
          "iam:GetCredentialReport",
          "iam:List*",
          "iam:GetAccountAuthorizationDetails",
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:GetLoginProfile",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:GetUser",
          "iam:GetUserPolicy",
          "inspector:*",
          "securityhub:*",
          "ssm:GetComplianceSummary",
          "ssm:ListComplianceItems",
          "ssm:ListAssociations",
          "ssm:DescribeInstanceInformation",
          "trustedadvisor:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSKeyManagement"
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:CreateKey",
          "kms:DescribeKey",
          "kms:EnableKeyRotation",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:ListKeys",
          "kms:ListAliases",
          "kms:ListGrants",
          "kms:ListKeyPolicies",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "ConfigRuleManagement"
        Effect = "Allow"
        Action = [
          "config:PutConfigRule",
          "config:DeleteConfigRule",
          "config:PutConfigurationRecorder",
          "config:PutDeliveryChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to security role
resource "aws_iam_role_policy_attachment" "security_policy" {
  role       = aws_iam_role.security.name
  policy_arn = aws_iam_policy.security_policy.arn
}

# Attach AWS managed SecurityAudit policy
resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.security.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}
```

## 2. kms.tf - KMS Keys with Rotation

```hcl
# kms.tf - KMS keys with rotation and proper policies

# KMS key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "${local.name_prefix} S3 encryption key"
  deletion_window_in_days = 30
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
        Condition = {
          StringEquals = {
            "aws:PrincipalOrgID" = data.aws_organizations_organization.current.id
          }
        }
      },
      {
        Sid    = "Allow S3 service to use the key"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.allowed_regions[0]}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.allowed_regions[0]}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Deny unencrypted uploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "kms:ViaService" = [
              "s3.${var.allowed_regions[0]}.amazonaws.com",
              "s3.${var.allowed_regions[1]}.amazonaws.com"
            ]
            "aws:PrincipalOrgID" = data.aws_organizations_organization.current.id
          }
        }
      }
    ]
  })

  tags = merge(local.mandatory_tags, {
    Purpose = "S3-Encryption"
  })
}

# KMS key alias for S3
resource "aws_kms_alias" "s3" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "${local.name_prefix} RDS encryption key"
  deletion_window_in_days = 30
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
        Condition = {
          StringEquals = {
            "aws:PrincipalOrgID" = data.aws_organizations_organization.current.id
          }
        }
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "rds.amazonaws.com",
            "rds.${var.allowed_regions[0]}.amazonaws.com",
            "rds.${var.allowed_regions[1]}.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "rds.${var.allowed_regions[0]}.amazonaws.com",
              "rds.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })

  tags = merge(local.mandatory_tags, {
    Purpose = "RDS-Encryption"
  })
}

# KMS key alias for RDS
resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS key for EBS encryption
resource "aws_kms_key" "ebs" {
  description             = "${local.name_prefix} EBS encryption key"
  deletion_window_in_days = 30
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
        Condition = {
          StringEquals = {
            "aws:PrincipalOrgID" = data.aws_organizations_organization.current.id
          }
        }
      },
      {
        Sid    = "Allow EC2 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "ec2.${var.allowed_regions[0]}.amazonaws.com",
              "ec2.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      },
      {
        Sid    = "Allow attachment of persistent resources"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.developer.arn,
            aws_iam_role.operations.arn
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

  tags = merge(local.mandatory_tags, {
    Purpose = "EBS-Encryption"
  })
}

# KMS key alias for EBS
resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.name_prefix}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# Enable EBS encryption by default
resource "aws_ebs_encryption_by_default" "enabled" {
  enabled = true
}

# Set default EBS encryption key
resource "aws_ebs_default_kms_key" "ebs" {
  key_arn = aws_kms_key.ebs.arn
}
```

## 3. scp.tf - Service Control Policies

```hcl
# scp.tf - Service Control Policies for regional restrictions

# SCP to restrict regions
resource "aws_organizations_policy" "region_restriction" {
  name        = "${local.name_prefix}-region-restriction"
  description = "Restrict all actions to allowed regions only"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyAllOutsideAllowedRegions"
        Effect    = "Deny"
        Action    = "*"
        Resource  = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
          ForAllValues:StringNotEquals = {
            "aws:PrincipalOrgID" = [data.aws_organizations_organization.current.id]
          }
        }
      },
      {
        Sid    = "DenyRootAccountUsage"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      },
      {
        Sid    = "RequireMFAForDeletion"
        Effect = "Deny"
        Action = [
          "ec2:TerminateInstances",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "dynamodb:DeleteTable"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        Sid    = "PreventDisablingCloudTrail"
        Effect = "Deny"
        Action = [
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
          "cloudtrail:UpdateTrail"
        ]
        Resource = "*"
      },
      {
        Sid    = "PreventDisablingConfig"
        Effect = "Deny"
        Action = [
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder"
        ]
        Resource = "*"
      },
      {
        Sid    = "EnforceSecureTransport"
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# SCP to enforce encryption
resource "aws_organizations_policy" "encryption_enforcement" {
  name        = "${local.name_prefix}-encryption-enforcement"
  description = "Enforce encryption for all data at rest"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Action = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = ["aws:kms", "AES256"]
          }
        }
      },
      {
        Sid    = "DenyUnencryptedRDSInstances"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:RestoreDBInstanceFromS3"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedEBSVolumes"
        Effect = "Deny"
        Action = [
          "ec2:CreateVolume",
          "ec2:RunInstances"
        ]
        Resource = "arn:aws:ec2:*:*:volume/*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      }
    ]
  })
}

# Attach SCPs to organizational units or accounts
# Note: You'll need to specify the target_id based on your org structure
resource "aws_organizations_policy_attachment" "region_restriction" {
  count     = length(var.target_organizational_units)
  policy_id = aws_organizations_policy.region_restriction.id
  target_id = var.target_organizational_units[count.index]
}

resource "aws_organizations_policy_attachment" "encryption_enforcement" {
  count     = length(var.target_organizational_units)
  policy_id = aws_organizations_policy.encryption_enforcement.id
  target_id = var.target_organizational_units[count.index]
}
```

## 4. cloudwatch.tf - Alarms and Monitoring

```hcl
# cloudwatch.tf - CloudWatch alarms and monitoring setup

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = local.mandatory_tags
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "security_team" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_email
}

# CloudWatch log group for audit logs
resource "aws_cloudwatch_log_group" "audit_logs" {
  name              = "/aws/audit/${local.name_prefix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  tags = local.mandatory_tags
}

# Metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}-root-account-usage"
  alarm_description   = "Alert when root account is used"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  alarm_description   = "Alert on unauthorized API calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes" {
  name           = "${local.name_prefix}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)||($.eventName=AttachGroupPolicy)||($.eventName=DetachGroupPolicy)}"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_changes" {
  alarm_name          = "${local.name_prefix}-iam-policy-changes"
  alarm_description   = "Alert on IAM policy changes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for console sign-in failures
resource "aws_cloudwatch_log_metric_filter" "console_signin_failure" {
  name           = "${local.name_prefix}-console-signin-failures"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }"

  metric_transformation {
    name      = "ConsoleSignInFailures"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for console sign-in failures
resource "aws_cloudwatch_metric_alarm" "console_signin_failure" {
  alarm_name          = "${local.name_prefix}-console-signin-failures"
  alarm_description   = "Alert on multiple console sign-in failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleSignInFailures"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# CloudWatch dashboard for security monitoring
resource "aws_cloudwatch_dashboard" "security" {
  dashboard_name = "${local.name_prefix}-security-dashboard"

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
            ["${local.name_prefix}/Security", "RootAccountUsage"],
            [".", "UnauthorizedAPICalls"],
            [".", "IAMPolicyChanges"],
            [".", "ConsoleSignInFailures"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.allowed_regions[0]
          title   = "Security Events"
          period  = 300
        }
      }
    ]
  })
}
```

## 5. config.tf - AWS Config Rules

```hcl
# config.tf - AWS Config rules for compliance monitoring

# S3 bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-bucket-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy
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

# IAM role for Config
resource "aws_iam_role" "config" {
  name = "${local.name_prefix}-config-role"

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

  tags = local.mandatory_tags
}

# IAM policy for Config
resource "aws_iam_policy" "config" {
  name = "${local.name_prefix}-config-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
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
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListUsers"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "rds:Describe*",
          "s3:List*",
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:GetBucketTagging"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Config role
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = aws_iam_policy.config.arn
}

# Config recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config rule: MFA enabled for IAM users
resource "aws_config_config_rule" "iam_user_mfa_enabled" {
  name = "${local.name_prefix}-iam-user-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: Root account MFA enabled
resource "aws_config_config_rule" "root_account_mfa_enabled" {
  name = "${local.name_prefix}-root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: S3 bucket encryption
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${local.name_prefix}-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  tags = local.mandatory_tags
}

# Config rule: RDS encryption enabled
resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "${local.name_prefix}-rds-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = local.mandatory_tags
}

# Config rule: EBS encryption enabled
resource "aws_config_config_rule" "ebs_encryption_enabled" {
  name = "${local.name_prefix}-ebs-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  tags = local.mandatory_tags
}

# Config rule: Required tags
resource "aws_config_config_rule" "required_tags" {
  name = "${local.name_prefix}-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Environment"
    tag2Key = "Owner"
    tag3Key = "CostCenter"
  })

  tags = local.mandatory_tags
}

# Config rule: IAM password policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "${local.name_prefix}-iam-password-policy"

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

  tags = local.mandatory_tags
}

# Config rule: CloudTrail enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${local.name_prefix}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  tags = local.mandatory_tags
}
```

## 6. session-manager.tf - Systems Manager Configuration

```hcl
# session-manager.tf - Systems Manager Session Manager configuration

# S3 bucket for session logs
resource "aws_s3_bucket" "session_logs" {
  bucket = "${local.name_prefix}-session-logs-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "session_logs" {
  bucket = aws_s3_bucket.session_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch log group for session logs
resource "aws_cloudwatch_log_group" "session_logs" {
  name              = "/aws/ssm/${local.name_prefix}-sessions"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  tags = local.mandatory_tags
}

# Session Manager preferences document
resource "aws_ssm_document" "session_manager_prefs" {
  name          = "${local.name_prefix}-SessionManagerRunShell"
  document_type = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Session Manager preferences for ${local.name_prefix}"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName                = aws_s3_bucket.session_logs.id
      s3KeyPrefix                 = "session-logs/"
      s3EncryptionEnabled         = true
      cloudWatchLogGroupName      = aws_cloudwatch_log_group.session_logs.name
      cloudWatchEncryptionEnabled = true
      idleSessionTimeout          = "20"
      maxSessionDuration          = "60"
      runAsEnabled                = false
      runAsDefaultUser           = ""
      kmsKeyId                   = aws_kms_key.s3.arn
      shellProfile = {
        linux = "#!/bin/bash\necho 'Session started at:' $(date)\necho 'User:' $(whoami)\necho 'Instance:' $(ec2-metadata --instance-id | cut -d ' ' -f 2)\nexport HISTTIMEFORMAT='%F %T '"
      }
    }
  })

  tags = local.mandatory_tags
}

# IAM role for EC2 instances to use Session Manager
resource "aws_iam_role" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.mandatory_tags
}

# Attach SSM managed instance core policy
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Additional policy for session logging
resource "aws_iam_policy" "ssm_logging" {
  name        = "${local.name_prefix}-ssm-logging-policy"
  description = "Policy for SSM session logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.session_logs.arn,
          "${aws_s3_bucket.session_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.session_logs.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3.arn
      }
    ]
  })
}

# Attach logging policy to instance role
resource "aws_iam_role_policy_attachment" "ssm_logging" {
  role       = aws_iam_role.ssm_instance.name
  policy_arn = aws_iam_policy.ssm_logging.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ssm_instance" {
  name = "${local.name_prefix}-ssm-instance-profile"
  role = aws_iam_role.ssm_instance.name
}

# SSM activation for hybrid/on-premises servers (if needed)
resource "aws_ssm_activation" "hybrid" {
  count              = var.enable_hybrid_activation ? 1 : 0
  name               = "${local.name_prefix}-hybrid-activation"
  iam_role           = aws_iam_role.ssm_instance.id
  registration_limit = var.hybrid_activation_limit
  description        = "Activation for hybrid/on-premises servers"

  tags = local.mandatory_tags
}
```

## 7. tagging.tf - Tag Enforcement Policies

```hcl
# tagging.tf - Tag enforcement policies

# Tag policy for mandatory tags
resource "aws_organizations_policy" "tagging" {
  name        = "${local.name_prefix}-mandatory-tags"
  description = "Enforce mandatory tags on all resources"
  type        = "TAG_POLICY"

  content = jsonencode({
    tags = {
      Environment = {
        tag_key = {
          "@@assign" = "Environment"
        }
        tag_value = {
          "@@assign" = var.allowed_environments
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "ec2:snapshot",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer",
            "elasticloadbalancing:targetgroup"
          ]
        }
      }
      Owner = {
        tag_key = {
          "@@assign" = "Owner"
        }
        tag_value = {
          "@@assign" = ["*"]
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "ec2:security-group",
            "rds:db",
            "s3:bucket",
            "lambda:function"
          ]
        }
      }
      CostCenter = {
        tag_key = {
          "@@assign" = "CostCenter"
        }
        tag_value = {
          "@@assign" = var.cost_centers
        }
        enforced_for = {
          "@@assign" = [
            "ec2:instance",
            "ec2:volume",
            "rds:db",
            "rds:cluster",
            "s3:bucket",
            "dynamodb:table",
            "lambda:function",
            "elasticloadbalancing:loadbalancer"
          ]
        }
      }
    }
  })
}

# Attach tag policy to organizational units
resource "aws_organizations_policy_attachment" "tagging" {
  count     = length(var.target_organizational_units)
  policy_id = aws_organizations_policy.tagging.id
  target_id = var.target_organizational_units[count.index]
}

# Lambda function for auto-tagging resources
resource "aws_iam_role" "auto_tagging_lambda" {
  name = "${local.name_prefix}-auto-tagging-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.mandatory_tags
}

# Lambda execution policy
resource "aws_iam_policy" "auto_tagging_lambda" {
  name        = "${local.name_prefix}-auto-tagging-lambda-policy"
  description = "Policy for auto-tagging Lambda function"

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSecurityGroups",
          "rds:AddTagsToResource",
          "rds:DescribeDBInstances",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "auto_tagging_lambda" {
  role       = aws_iam_role.auto_tagging_lambda.name
  policy_arn = aws_iam_policy.auto_tagging_lambda.arn
}

# Lambda function for auto-tagging
resource "aws_lambda_function" "auto_tagging" {
  filename      = data.archive_file.auto_tagging_lambda.output_path
  function_name = "${local.name_prefix}-auto-tagging"
  role          = aws_iam_role.auto_tagging_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60

  environment {
    variables = {
      DEFAULT_TAGS = jsonencode(local.mandatory_tags)
    }
  }

  tags = local.mandatory_tags
}

# CloudWatch Events rule for auto-tagging
resource "aws_cloudwatch_event_rule" "auto_tagging" {
  name        = "${local.name_prefix}-auto-tagging"
  description = "Trigger auto-tagging Lambda on resource creation"

  event_pattern = jsonencode({
    source      = ["aws.ec2", "aws.rds", "aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "RunInstances",
        "CreateVolume",
        "CreateSecurityGroup",
        "CreateDBInstance",
        "CreateBucket"
      ]
    }
  })

  tags = local.mandatory_tags
}

# CloudWatch Events target
resource "aws_cloudwatch_event_target" "auto_tagging" {
  rule      = aws_cloudwatch_event_rule.auto_tagging.name
  target_id = "AutoTaggingLambda"
  arn       = aws_lambda_function.auto_tagging.arn
}

# Permission for CloudWatch Events to invoke Lambda
resource "aws_lambda_permission" "auto_tagging" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_tagging.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.auto_tagging.arn
}

# Archive file for Lambda
data "archive_file" "auto_tagging_lambda" {
  type        = "zip"
  output_path = "${path.module}/auto_tagging_lambda.zip"

  source {
    content  = file("${path.module}/lambda/auto_tagging.py")
    filename = "index.py"
  }
}
```

## 8. audit-role.tf - Cross-account Audit Role

```hcl
# audit-role.tf - Cross-account audit role setup

# Trust policy for cross-account audit role
data "aws_iam_policy_document" "audit_trust_policy" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = var.audit_account_ids
    }
    
    actions = ["sts:AssumeRole"]
    
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
    
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.audit_external_id]
    }
  }
}

# Cross-account audit role
resource "aws_iam_role" "audit" {
  name                 = "${local.name_prefix}-audit-role"
  assume_role_policy   = data.aws_iam_policy_document.audit_trust_policy.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags
}

# Audit policy - read-only access
resource "aws_iam_policy" "audit" {
  name        = "${local.name_prefix}-audit-policy"
  description = "Read-only policy for cross-account auditing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ViewOnlyAccess"
        Effect = "Allow"
        Action = [
          "acm:DescribeCertificate",
          "acm:ListCertificates",
          "apigateway:GET",
          "application-autoscaling:Describe*",
          "athena:GetQueryExecution",
          "athena:GetQueryResults",
          "autoscaling:Describe*",
          "backup:Describe*",
          "backup:GetBackupPlan",
          "backup:GetBackupSelection",
          "backup:GetBackupVaultAccessPolicy",
          "backup:GetBackupVaultNotifications",
          "backup:GetRecoveryPointRestoreMetadata",
          "backup:ListBackupJobs",
          "backup:ListBackupPlans",
          "backup:ListBackupSelections",
          "backup:ListBackupVaults",
          "backup:ListProtectedResources",
          "backup:ListRecoveryPointsByBackupVault",
          "backup:ListRecoveryPointsByResource",
          "backup:ListRestoreJobs",
          "cloudformation:Describe*",
          "cloudformation:Get*",
          "cloudformation:List*",
          "cloudfront:Get*",
          "cloudfront:List*",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetEventSelectors",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:ListPublicKeys",
          "cloudtrail:ListTags",
          "cloudtrail:LookupEvents",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "codebuild:BatchGetBuilds",
          "codebuild:BatchGetProjects",
          "codebuild:List*",
          "codecommit:BatchGetRepositories",
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:GetRepository",
          "codecommit:GetRepositoryTriggers",
          "codecommit:List*",
          "codepipeline:GetPipeline",
          "codepipeline:GetPipelineExecution",
          "codepipeline:GetPipelineState",
          "codepipeline:ListPipelines",
          "config:Deliver*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "datasync:Describe*",
          "datasync:List*",
          "dax:Describe*",
          "dax:ListTags",
          "directconnect:Describe*",
          "dms:Describe*",
          "dms:ListTagsForResource",
          "dynamodb:DescribeBackup",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeGlobalTable",
          "dynamodb:DescribeGlobalTableSettings",
          "dynamodb:DescribeLimits",
          "dynamodb:DescribeReservedCapacity",
          "dynamodb:DescribeReservedCapacityOfferings",
          "dynamodb:DescribeStream",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:ListBackups",
          "dynamodb:ListGlobalTables",
          "dynamodb:ListStreams",
          "dynamodb:ListTables",
          "dynamodb:ListTagsOfResource",
          "ec2:Describe*",
          "ecr:DescribeImageScanFindings",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetLifecyclePolicy",
          "ecr:GetRepositoryPolicy",
          "ecr:ListImages",
          "ecs:Describe*",
          "ecs:List*",
          "eks:DescribeCluster",
          "eks:ListClusters",
          "elasticache:Describe*",
          "elasticache:ListTagsForResource",
          "elasticbeanstalk:Describe*",
          "elasticfilesystem:DescribeFileSystems",
          "elasticfilesystem:DescribeLifecycleConfiguration",
          "elasticfilesystem:DescribeMountTargets",
          "elasticfilesystem:DescribeMountTargetSecurityGroups",
          "elasticfilesystem:DescribeTags",
          "elasticloadbalancing:Describe*",
          "elasticmapreduce:Describe*",
          "elasticmapreduce:ListBootstrapActions",
          "elasticmapreduce:ListClusters",
          "elasticmapreduce:ListInstances",
          "elasticmapreduce:ListSteps",
          "es:Describe*",
          "es:ListDomainNames",
          "es:ListTags",
          "events:DescribeRule",
          "events:ListRuleNamesByTarget",
          "events:ListRules",
          "events:ListTargetsByRule",
          "firehose:Describe*",
          "firehose:List*",
          "fsx:Describe*",
          "glacier:DescribeVault",
          "glacier:GetVaultAccessPolicy",
          "glacier:ListVaults",
          "glue:GetCatalogImportStatus",
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:GetTable",
          "glue:GetTables",
          "glue:GetPartition",
          "glue:GetPartitions",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:Generate*",
          "iam:Get*",
          "iam:List*",
          "iam:SimulateCustomPolicy",
          "iam:SimulatePrincipalPolicy",
          "inspector:Describe*",
          "inspector:Get*",
          "inspector:List*",
          "iot:Describe*",
          "iot:GetPolicy",
          "iot:GetPolicyVersion",
          "iot:List*",
          "kinesis:Describe*",
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:ListStreams",
          "kinesis:ListTagsForStream",
          "kinesisanalytics:Describe*",
          "kinesisanalytics:Discover*",
          "kinesisanalytics:GetApplicationState",
          "kinesisanalytics:ListApplications",
          "kinesisvideo:Describe*",
          "kinesisvideo:GetDataEndpoint",
          "kinesisvideo:GetHLSStreamingSessionURL",
          "kinesisvideo:GetMedia",
          "kinesisvideo:GetMediaForFragmentList",
          "kinesisvideo:ListFragments",
          "kinesisvideo:ListStreams",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "lambda:Get*",
          "lambda:List*",
          "logs:Describe*",
          "logs:FilterLogEvents",
          "logs:Get*",
          "logs:ListTagsLogGroup",
          "logs:TestMetricFilter",
          "mq:Describe*",
          "mq:List*",
          "organizations:Describe*",
          "organizations:List*",
          "rds:Describe*",
          "rds:List*",
          "redshift:Describe*",
          "redshift:ViewQueriesInConsole",
          "route53:Get*",
          "route53:List*",
          "route53:TestDNSAnswer",
          "route53domains:CheckDomainAvailability",
          "route53domains:GetDomainDetail",
          "route53domains:GetOperationDetail",
          "route53domains:ListDomains",
          "route53domains:ListOperations",
          "route53domains:ListTagsForDomain",
          "s3:GetAccelerateConfiguration",
          "s3:GetAnalyticsConfiguration",
          "s3:GetBucketAcl",
          "s3:GetBucketCORS",
          "s3:GetBucketLocation",
          "s3:GetBucketLogging",
          "s3:GetBucketNotification",
          "s3:GetBucketPolicy",
          "s3:GetBucketPolicyStatus",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketTagging",
          "s3:GetBucketVersioning",
          "s3:GetBucketWebsite",
          "s3:GetEncryptionConfiguration",
          "s3:GetInventoryConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetMetricsConfiguration",
          "s3:GetObjectAcl",
          "s3:GetObjectTagging",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging",
          "s3:GetReplicationConfiguration",
          "s3:ListAllMyBuckets",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:ListBucketVersions",
          "s3:ListMultipartUploadParts",
          "sagemaker:Describe*",
          "sagemaker:List*",
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:ListSecrets",
          "secretsmanager:ListSecretVersionIds",
          "securityhub:Describe*",
          "securityhub:Get*",
          "securityhub:List*",
          "servicecatalog:Describe*",
          "servicecatalog:List*",
          "servicecatalog:SearchProducts",
          "servicecatalog:ScanProvisionedProducts",
          "ses:Describe*",
          "ses:Get*",
          "ses:List*",
          "shield:Describe*",
          "shield:List*",
          "sns:GetTopicAttributes",
          "sns:ListSubscriptions",
          "sns:ListSubscriptionsByTopic",
          "sns:ListTopics",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ListDeadLetterSourceQueues",
          "sqs:ListQueues",
          "sqs:ListQueueTags",
          "ssm:Describe*",
          "ssm:Get*",
          "ssm:List*",
          "states:DescribeActivity",
          "states:DescribeExecution",
          "states:DescribeStateMachine",
          "states:GetExecutionHistory",
          "states:ListActivities",
          "states:ListExecutions",
          "states:ListStateMachines",
          "storagegateway:Describe*",
          "storagegateway:List*",
          "support:*",
          "tag:GetResources",
          "tag:GetTagKeys",
          "tag:GetTagValues",
          "transfer:Describe*",
          "transfer:List*",
          "trustedadvisor:Describe*",
          "waf:Get*",
          "waf:List*",
          "wafv2:Get*",
          "wafv2:List*",
          "waf-regional:Get*",
          "waf-regional:List*",
          "workspaces:Describe*",
          "xray:BatchGetTraces",
          "xray:GetEncryptionConfig",
          "xray:GetServiceGraph",
          "xray:GetTraceGraph",
          "xray:GetTraceSummaries"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyModifyActions"
        Effect = "Deny"
        Action = [
          "*:Create*",
          "*:Delete*",
          "*:Put*",
          "*:Update*",
          "*:Modify*",
          "*:Attach*",
          "*:Detach*",
          "*:Start*",
          "*:Stop*",
          "*:Terminate*",
          "*:Reboot*",
          "*:Reset*",
          "*:Change*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach audit policy to audit role
resource "aws_iam_role_policy_attachment" "audit" {
  role       = aws_iam_role.audit.name
  policy_arn = aws_iam_policy.audit.arn
}

# Output the audit role ARN for sharing with audit accounts
output "audit_role_arn" {
  value       = aws_iam_role.audit.arn
  description = "ARN of the cross-account audit role"
}

# Output the external ID for secure cross-account access
output "audit_external_id" {
  value       = var.audit_external_id
  description = "External ID required for assuming the audit role"
  sensitive   = true
}
```

## 9. variables.tf - Input Variables

```hcl
# variables.tf - All input variables with sensible defaults

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,28}[a-z0-9]$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, 4-30 characters."
  }
}

variable "allowed_regions" {
  description = "List of allowed AWS regions"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "allowed_environments" {
  description = "List of allowed environment tag values"
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "cost_centers" {
  description = "List of valid cost center codes"
  type        = list(string)
  default     = ["IT", "Engineering", "Finance", "Operations", "Security"]
}

variable "prohibited_instance_types" {
  description = "List of prohibited EC2 instance types"
  type        = list(string)
  default     = ["*.8xlarge", "*.12xlarge", "*.16xlarge", "*.24xlarge", "*.32xlarge"]
}

variable "security_team_email" {
  description = "Email address for security alerts"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.security_team_email))
    error_message = "Must be a valid email address."
  }
}

variable "audit_account_ids" {
  description = "List of AWS account IDs that can assume the audit role"
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for id in var.audit_account_ids : can(regex("^\\d{12}$", id))])
    error_message = "All audit account IDs must be 12-digit AWS account IDs."
  }
}

variable "audit_external_id" {
  description = "External ID for secure cross-account audit role assumption"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.audit_external_id) >= 32
    error_message = "External ID must be at least 32 characters for security."
  }
}

variable "target_organizational_units" {
  description = "List of organizational unit IDs to apply SCPs and tag policies"
  type        = list(string)
  default     = []
}

variable "enable_hybrid_activation" {
  description = "Enable SSM activation for hybrid/on-premises servers"
  type        = bool
  default     = false
}

variable "hybrid_activation_limit" {
  description = "Maximum number of on-premises servers that can be registered"
  type        = number
  default     = 10
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail log retention in days"
  type        = number
  default     = 365
}

variable "session_timeout_minutes" {
  description = "Session Manager idle timeout in minutes"
  type        = number
  default     = 20
  validation {
    condition     = var.session_timeout_minutes >= 1 && var.session_timeout_minutes <= 60
    error_message = "Session timeout must be between 1 and 60 minutes."
  }
}

variable "enable_auto_tagging" {
  description = "Enable automatic tagging of new resources"
  type        = bool
  default     = true
}

variable "enable_config_rules" {
  description = "Enable AWS Config rules for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}
```

## 10. outputs.tf - Output Values

```hcl
# outputs.tf - Important outputs like role ARNs, KMS key IDs

# IAM Role ARNs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = aws_iam_role.developer.arn
}

output "operations_role_arn" {
  description = "ARN of the operations IAM role"
  value       = aws_iam_role.operations.arn
}

output "security_role_arn" {
  description = "ARN of the security IAM role"
  value       = aws_iam_role.security.arn
}

output "ssm_instance_profile_name" {
  description = "Name of the SSM instance profile for EC2"
  value       = aws_iam_instance_profile.ssm_instance.name
}

# KMS Key Information
output "kms_key_ids" {
  description = "Map of KMS key IDs by purpose"
  value = {
    s3  = aws_kms_key.s3.id
    rds = aws_kms_key.rds.id
    ebs = aws_kms_key.ebs.id
  }
}

output "kms_key_arns" {
  description = "Map of KMS key ARNs by purpose"
  value = {
    s3  = aws_kms_key.s3.arn
    rds = aws_kms_key.rds.arn
    ebs = aws_kms_key.ebs.arn
  }
}

output "kms_key_aliases" {
  description = "Map of KMS key aliases"
  value = {
    s3  = aws_kms_alias.s3.name
    rds = aws_kms_alias.rds.name
    ebs = aws_kms_alias.ebs.name
  }
}

# S3 Bucket Information
output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

output "config_bucket_arn" {
  description = "ARN of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.arn
}

output "session_logs_bucket_name" {
  description = "Name of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.id
}

output "session_logs_bucket_arn" {
  description = "ARN of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.arn
}

# CloudWatch Resources
output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "audit_log_group_name" {
  description = "Name of the CloudWatch log group for audit logs"
  value       = aws_cloudwatch_log_group.audit_logs.name
}

output "session_log_group_name" {
  description = "Name of the CloudWatch log group for session logs"
  value       = aws_cloudwatch_log_group.session_logs.name
}

# Session Manager
output "session_manager_document_name" {
  description = "Name of the Session Manager preferences document"
  value       = aws_ssm_document.session_manager_prefs.name
}

output "hybrid_activation_id" {
  description = "ID of the SSM hybrid activation (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].id : null
}

output "hybrid_activation_code" {
  description = "Activation code for hybrid servers (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].activation_code : null
  sensitive   = true
}

# Config Rules
output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_rules" {
  description = "List of enabled AWS Config rules"
  value = [
    aws_config_config_rule.iam_user_mfa_enabled.name,
    aws_config_config_rule.root_account_mfa_enabled.name,
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_encryption_enabled.name,
    aws_config_config_rule.ebs_encryption_enabled.name,
    aws_config_config_rule.required_tags.name,
    aws_config_config_rule.iam_password_policy.name,
    aws_config_config_rule.cloudtrail_enabled.name
  ]
}

# Organization Policies
output "scp_policy_ids" {
  description = "IDs of Service Control Policies"
  value = {
    region_restriction     = aws_organizations_policy.region_restriction.id
    encryption_enforcement = aws_organizations_policy.encryption_enforcement.id
  }
}

output "tag_policy_id" {
  description = "ID of the tag enforcement policy"
  value       = aws_organizations_policy.tagging.id
}

# Lambda Functions
output "auto_tagging_lambda_arn" {
  description = "ARN of the auto-tagging Lambda function"
  value       = aws_lambda_function.auto_tagging.arn
}

# Summary Information
output "deployment_summary" {
  description = "Summary of the security deployment"
  value = {
    environment         = var.environment
    project_name        = var.project_name
    allowed_regions     = join(", ", var.allowed_regions)
    kms_rotation_enabled = true
    log_retention_days  = var.cloudtrail_retention_days
    mfa_required        = true
    encryption_enforced = true
  }
}
```

## 11. locals.tf - Naming Conventions and Reusable Values

```hcl
# locals.tf - Naming conventions and reusable values

locals {
  # Naming prefix for all resources
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Common mandatory tags
  mandatory_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "PCI-DSS-Compliance"
      CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )
  
  # Account and organization information
  account_id = data.aws_caller_identity.current.account_id
  org_id     = data.aws_organizations_organization.current.id
  
  # Region-specific service endpoints
  s3_service_endpoints = [
    for region in var.allowed_regions : "s3.${region}.amazonaws.com"
  ]
  
  rds_service_endpoints = [
    for region in var.allowed_regions : "rds.${region}.amazonaws.com"
  ]
  
  ec2_service_endpoints = [
    for region in var.allowed_regions : "ec2.${region}.amazonaws.com"
  ]
  
  # Compliance standards
  compliance_standards = {
    password_min_length       = 14
    password_max_age         = 90
    password_reuse_prevention = 24
    mfa_max_age_seconds      = 3600
    session_max_duration     = 43200  # 12 hours
    log_retention_days       = 365
  }
  
  # Resource limits
  resource_limits = {
    max_iam_policies_per_role = 10
    max_tags_per_resource     = 50
    max_kms_key_aliases       = 100
  }
  
  # Notification settings
  notification_settings = {
    alarm_evaluation_periods = 1
    alarm_period_seconds    = 300
    alarm_datapoints_to_alarm = 1
  }
  
  # Service principal mapping
  service_principals = {
    config       = "config.amazonaws.com"
    cloudtrail   = "cloudtrail.amazonaws.com"
    lambda       = "lambda.amazonaws.com"
    events       = "events.amazonaws.com"
    ssm          = "ssm.amazonaws.com"
    ec2          = "ec2.amazonaws.com"
    s3           = "s3.amazonaws.com"
    rds          = "rds.amazonaws.com"
    organizations = "organizations.amazonaws.com"
  }
  
  # CloudWatch alarm thresholds
  alarm_thresholds = {
    root_usage_count          = 0
    unauthorized_api_count    = 10
    iam_policy_changes_count  = 0
    signin_failures_count     = 5
  }
  
  # Lambda function settings
  lambda_settings = {
    runtime = "python3.9"
    timeout = 60
    memory  = 128
  }
  
  # S3 bucket naming
  s3_bucket_names = {
    config       = "${local.name_prefix}-config-bucket-${local.account_id}"
    session_logs = "${local.name_prefix}-session-logs-${local.account_id}"
    cloudtrail   = "${local.name_prefix}-cloudtrail-${local.account_id}"
  }
  
  # CloudWatch log group names
  log_group_names = {
    audit    = "/aws/audit/${local.name_prefix}"
    session  = "/aws/ssm/${local.name_prefix}-sessions"
    lambda   = "/aws/lambda/${local.name_prefix}"
  }
}

# Timestamp for resource creation tracking
locals {
  current_timestamp = timestamp()
  current_date      = formatdate("YYYY-MM-DD", local.current_timestamp)
  current_year      = formatdate("YYYY", local.current_timestamp)
}

# Environment-specific settings
locals {
  is_production = var.environment == "prod"
  
  # Stricter settings for production
  deletion_protection = local.is_production ? true : false
  backup_enabled      = local.is_production ? true : false
  
  # Environment-specific retention
  retention_days = {
    dev     = 90
    staging = 180
    prod    = 365
  }
}
```

## Lambda Function for Auto-tagging

Create a directory `lambda` and add this file:

```python
# lambda/auto_tagging.py
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    Auto-tag resources when they are created
    """
    print(f"Event: {json.dumps(event)}")
    
    # Get default tags from environment
    default_tags = json.loads(os.environ.get('DEFAULT_TAGS', '{}'))
    
    # Extract event details
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    region = detail.get('awsRegion', '')
    user_identity = detail.get('userIdentity', {})
    
    # Add dynamic tags
    tags = {
        **default_tags,
        'CreatedBy': user_identity.get('principalId', 'unknown'),
        'CreatedDate': datetime.now().strftime('%Y-%m-%d'),
        'CreatedVia': 'Auto-Tagging'
    }
    
    # Handle different resource types
    if event_name == 'RunInstances':
        tag_ec2_instances(detail, tags, region)
    elif event_name == 'CreateVolume':
        tag_ebs_volumes(detail, tags, region)
    elif event_name == 'CreateSecurityGroup':
        tag_security_groups(detail, tags, region)
    elif event_name == 'CreateDBInstance':
        tag_rds_instances(detail, tags, region)
    elif event_name == 'CreateBucket':
        tag_s3_buckets(detail, tags, region)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Tagging completed successfully')
    }

def tag_ec2_instances(detail, tags, region):
    """Tag EC2 instances"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    instances = response_elements.get('instancesSet', {}).get('items', [])
    
    instance_ids = [i['instanceId'] for i in instances if 'instanceId' in i]
    
    if instance_ids:
        ec2.create_tags(
            Resources=instance_ids,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EC2 instances: {instance_ids}")

def tag_ebs_volumes(detail, tags, region):
    """Tag EBS volumes"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    volume_id = response_elements.get('volumeId')
    
    if volume_id:
        ec2.create_tags(
            Resources=[volume_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EBS volume: {volume_id}")

def tag_security_groups(detail, tags, region):
    """Tag security groups"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    group_id = response_elements.get('groupId')
    
    if group_id:
        ec2.create_tags(
            Resources=[group_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged security group: {group_id}")

def tag_rds_instances(detail, tags, region):
    """Tag RDS instances"""
    rds = boto3.client('rds', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    db_instance = response_elements.get('dBInstance', {})
    db_instance_arn = db_instance.get('dBInstanceArn')
    
    if db_instance_arn:
        rds.add_tags_to_resource(
            ResourceName=db_instance_arn,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged RDS instance: {db_instance_arn}")

def tag_s3_buckets(detail, tags, region):
    """Tag S3 buckets"""
    s3 = boto3.client('s3')
    
    request_parameters = detail.get('requestParameters', {})
    bucket_name = request_parameters.get('bucketName')
    
    if bucket_name:
        try:
            s3.put_bucket_tagging(
                Bucket=bucket_name,
                Tagging={
                    'TagSet': [{'Key': k, 'Value': v} for k, v in tags.items()]
                }
            )
            print(f"Tagged S3 bucket: {bucket_name}")
        except Exception as e:
            print(f"Error tagging S3 bucket {bucket_name}: {str(e)}")
```

## Usage Instructions

1. **Create a `terraform.tfvars` file**:

```hcl
environment         = "prod"
project_name        = "pci-compliant"
security_team_email = "security@company.com"
audit_external_id   = "your-secure-random-external-id-at-least-32-chars"
audit_account_ids   = ["123456789012", "234567890123"]
target_organizational_units = ["ou-root-abc12345", "ou-apps-def67890"]
```

2. **Initialize and apply Terraform**:

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

3. **Post-deployment steps**:
   - Share the audit role ARN with your security team
   - Configure CloudTrail to send logs to the audit log group
   - Enable GuardDuty and Security Hub if desired
   - Test role assumptions with MFA
   - Verify all Config rules are compliant

This implementation provides a complete zero-trust architecture with comprehensive security controls, monitoring, and compliance features suitable for PCI-DSS requirements.