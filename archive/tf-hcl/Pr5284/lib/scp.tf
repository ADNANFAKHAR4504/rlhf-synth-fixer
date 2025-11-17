# scp.tf - Service Control Policies for regional restrictions
# Note: These resources require AWS Organizations admin access
# Set var.enable_organization_policies = true to deploy

# SCP to restrict regions
resource "aws_organizations_policy" "region_restriction" {
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-region-restriction"
  description = "Restrict all actions to allowed regions only"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyAllOutsideAllowedRegions"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid      = "DenyRootAccountUsage"
        Effect   = "Deny"
        Action   = "*"
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
        Sid      = "EnforceSecureTransport"
        Effect   = "Deny"
        Action   = "*"
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
  count       = var.enable_organization_policies ? 1 : 0
  name        = "${local.name_prefix}-encryption-enforcement"
  description = "Enforce encryption for all data at rest"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyUnencryptedObjectUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
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
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.region_restriction[0].id
  target_id = var.target_organizational_units[count.index]
}

resource "aws_organizations_policy_attachment" "encryption_enforcement" {
  count     = var.enable_organization_policies ? length(var.target_organizational_units) : 0
  policy_id = aws_organizations_policy.encryption_enforcement[0].id
  target_id = var.target_organizational_units[count.index]
}