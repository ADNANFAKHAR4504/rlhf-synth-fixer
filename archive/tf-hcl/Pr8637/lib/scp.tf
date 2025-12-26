# Service Control Policy to prevent root account usage
# NOTE: This requires AWS Organizations to be enabled
# These are example policies - deploy via AWS Organizations console or CLI

# Example SCP: Deny root account usage
# This should be applied at the Organization or OU level
locals {
  scp_deny_root = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
      }
    ]
  })

  scp_require_encryption = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyUnencryptedObjectUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = [
              "aws:kms",
              "AES256"
            ]
          }
        }
      },
      {
        Sid    = "RequireKMSEncryption"
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
      },
      {
        Sid    = "RequireEBSEncryption"
        Effect = "Deny"
        Action = [
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

# Output the SCPs for manual application
output "scp_deny_root_policy" {
  description = "SCP to deny root account usage - Apply via AWS Organizations"
  value       = local.scp_deny_root
}

output "scp_require_encryption_policy" {
  description = "SCP to require encryption - Apply via AWS Organizations"
  value       = local.scp_require_encryption
}
