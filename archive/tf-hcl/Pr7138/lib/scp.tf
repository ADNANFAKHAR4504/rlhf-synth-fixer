# Service Control Policy for S3 encryption enforcement
resource "aws_organizations_policy" "s3_encryption" {
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
            "s3:x-amz-server-side-encryption" = [
              "AES256",
              "aws:kms"
            ]
          }
        }
      },
      {
        Sid    = "DenyS3WithoutKMS"
        Effect = "Deny"
        Action = [
          "s3:PutObject"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyS3PublicBuckets"
        Effect = "Deny"
        Action = [
          "s3:PutAccountPublicAccessBlock"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "s3:BlockPublicAcls"       = "false"
            "s3:BlockPublicPolicy"     = "false"
            "s3:IgnorePublicAcls"      = "false"
            "s3:RestrictPublicBuckets" = "false"
          }
        }
      }
    ]
  })

  description = "Enforce S3 encryption and block public access"
  name        = "S3-Encryption-SCP-${var.environment_suffix}"
  type        = "SERVICE_CONTROL_POLICY"

  tags = merge(
    var.tags,
    {
      Name = "s3-encryption-scp-${var.environment_suffix}"
    }
  )
}

# Service Control Policy for EBS encryption enforcement
resource "aws_organizations_policy" "ebs_encryption" {
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedEBSVolumes"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances"
        ]
        Resource = [
          "arn:aws:ec2:*:*:volume/*"
        ]
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedEBSSnapshots"
        Effect = "Deny"
        Action = [
          "ec2:CopySnapshot"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "ec2:Encrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyEBSSnapshotSharing"
        Effect = "Deny"
        Action = [
          "ec2:ModifySnapshotAttribute"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:CreateVolume" = "true"
          }
        }
      }
    ]
  })

  description = "Enforce EBS volume and snapshot encryption"
  name        = "EBS-Encryption-SCP-${var.environment_suffix}"
  type        = "SERVICE_CONTROL_POLICY"

  tags = merge(
    var.tags,
    {
      Name = "ebs-encryption-scp-${var.environment_suffix}"
    }
  )
}

# Service Control Policy for RDS encryption enforcement
resource "aws_organizations_policy" "rds_encryption" {
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedRDS"
        Effect = "Deny"
        Action = [
          "rds:CreateDBInstance",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:RestoreDBInstanceFromS3",
          "rds:CreateDBCluster",
          "rds:RestoreDBClusterFromSnapshot"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "rds:StorageEncrypted" = "false"
          }
        }
      },
      {
        Sid    = "DenyRDSSnapshotCopyWithoutEncryption"
        Effect = "Deny"
        Action = [
          "rds:CopyDBSnapshot",
          "rds:CopyDBClusterSnapshot"
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

  description = "Enforce RDS database encryption"
  name        = "RDS-Encryption-SCP-${var.environment_suffix}"
  type        = "SERVICE_CONTROL_POLICY"

  tags = merge(
    var.tags,
    {
      Name = "rds-encryption-scp-${var.environment_suffix}"
    }
  )
}

# Service Control Policy to prevent KMS key deletion
resource "aws_organizations_policy" "kms_protection" {
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyKMSKeyDeletion"
        Effect = "Deny"
        Action = [
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey",
          "kms:PutKeyPolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyKMSGrantDeletion"
        Effect = "Deny"
        Action = [
          "kms:RetireGrant",
          "kms:RevokeGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:GrantIsForAWSResource" = "false"
          }
        }
      }
    ]
  })

  description = "Prevent accidental KMS key deletion and modification"
  name        = "KMS-Protection-SCP-${var.environment_suffix}"
  type        = "SERVICE_CONTROL_POLICY"

  tags = merge(
    var.tags,
    {
      Name = "kms-protection-scp-${var.environment_suffix}"
    }
  )
}

# Attach S3 encryption SCP to organizational units
resource "aws_organizations_policy_attachment" "s3_security_ou" {
  policy_id = aws_organizations_policy.s3_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "s3_production_ou" {
  policy_id = aws_organizations_policy.s3_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "s3_development_ou" {
  policy_id = aws_organizations_policy.s3_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

# Attach EBS encryption SCP to organizational units
resource "aws_organizations_policy_attachment" "ebs_security_ou" {
  policy_id = aws_organizations_policy.ebs_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "ebs_production_ou" {
  policy_id = aws_organizations_policy.ebs_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "ebs_development_ou" {
  policy_id = aws_organizations_policy.ebs_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

# Attach RDS encryption SCP to organizational units
resource "aws_organizations_policy_attachment" "rds_security_ou" {
  policy_id = aws_organizations_policy.rds_encryption.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "rds_production_ou" {
  policy_id = aws_organizations_policy.rds_encryption.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "rds_development_ou" {
  policy_id = aws_organizations_policy.rds_encryption.id
  target_id = aws_organizations_organizational_unit.development.id
}

# Attach KMS protection SCP to organizational units
resource "aws_organizations_policy_attachment" "kms_security_ou" {
  policy_id = aws_organizations_policy.kms_protection.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "kms_production_ou" {
  policy_id = aws_organizations_policy.kms_protection.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "kms_development_ou" {
  policy_id = aws_organizations_policy.kms_protection.id
  target_id = aws_organizations_organizational_unit.development.id
}
