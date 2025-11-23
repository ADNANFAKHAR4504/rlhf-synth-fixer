# Service Control Policies - COMMENTED OUT
# This file has been disabled along with AWS Organizations
#
# # Service Control Policy - Enforce S3 Encryption
# resource "aws_organizations_policy" "enforce_s3_encryption" {
#   name        = "enforce-s3-encryption-${var.environment_suffix}"
#   description = "Enforce encryption for S3 buckets"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyUnencryptedS3Uploads"
#         Effect = "Deny"
#         Action = [
#           "s3:PutObject"
#         ]
#         Resource = "*"
#         Condition = {
#           StringNotEquals = {
#             "s3:x-amz-server-side-encryption" = [
#               "AES256",
#               "aws:kms"
#             ]
#           }
#         }
#       },
#       {
#         Sid    = "DenyUnencryptedS3BucketCreation"
#         Effect = "Deny"
#         Action = [
#           "s3:CreateBucket"
#         ]
#         Resource = "*"
#         Condition = {
#           StringNotEquals = {
#             "s3:x-amz-bucket-encryption" = "true"
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Service Control Policy - Enforce EBS Encryption
# resource "aws_organizations_policy" "enforce_ebs_encryption" {
#   name        = "enforce-ebs-encryption-${var.environment_suffix}"
#   description = "Enforce encryption for EBS volumes"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyUnencryptedEBSVolumes"
#         Effect = "Deny"
#         Action = [
#           "ec2:CreateVolume",
#           "ec2:RunInstances"
#         ]
#         Resource = "*"
#         Condition = {
#           Bool = {
#             "ec2:Encrypted" = "false"
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Service Control Policy - Enforce RDS Encryption
# resource "aws_organizations_policy" "enforce_rds_encryption" {
#   name        = "enforce-rds-encryption-${var.environment_suffix}"
#   description = "Enforce encryption for RDS databases"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyUnencryptedRDSInstances"
#         Effect = "Deny"
#         Action = [
#           "rds:CreateDBInstance",
#           "rds:CreateDBCluster"
#         ]
#         Resource = "*"
#         Condition = {
#           Bool = {
#             "rds:StorageEncrypted" = "false"
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Service Control Policy - Prevent CloudWatch Logs Deletion
# resource "aws_organizations_policy" "protect_cloudwatch_logs" {
#   name        = "protect-cloudwatch-logs-${var.environment_suffix}"
#   description = "Prevent disabling or deleting CloudWatch Logs"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyCloudWatchLogsDeletion"
#         Effect = "Deny"
#         Action = [
#           "logs:DeleteLogGroup",
#           "logs:DeleteLogStream",
#           "logs:PutRetentionPolicy"
#         ]
#         Resource = "*"
#         Condition = {
#           StringNotEquals = {
#             "aws:PrincipalArn" = [
#               "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/security-audit-role-${var.environment_suffix}"
#             ]
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Service Control Policy - Restrict Root User Actions
# resource "aws_organizations_policy" "restrict_root_user" {
#   name        = "restrict-root-user-${var.environment_suffix}"
#   description = "Restrict root user actions"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyRootUserActions"
#         Effect = "Deny"
#         Action = [
#           "iam:*",
#           "organizations:*",
#           "account:*"
#         ]
#         Resource = "*"
#         Condition = {
#           StringLike = {
#             "aws:PrincipalArn" = "arn:aws:iam::*:root"
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Service Control Policy - Enforce Tagging
# resource "aws_organizations_policy" "enforce_tagging" {
#   name        = "enforce-tagging-${var.environment_suffix}"
#   description = "Enforce mandatory resource tagging"
#   type        = "SERVICE_CONTROL_POLICY"
#
#   content = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "DenyResourceCreationWithoutTags"
#         Effect = "Deny"
#         Action = [
#           "ec2:RunInstances",
#           "rds:CreateDBInstance",
#           "s3:CreateBucket"
#         ]
#         Resource = "*"
#         Condition = {
#           "Null" = {
#             "aws:RequestTag/Project"     = "true",
#             "aws:RequestTag/Environment" = "true"
#           }
#         }
#       }
#     ]
#   })
# }
#
# # Attach SCPs to OUs
# resource "aws_organizations_policy_attachment" "security_s3" {
#   policy_id = aws_organizations_policy.enforce_s3_encryption.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_s3" {
#   policy_id = aws_organizations_policy.enforce_s3_encryption.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_s3" {
#   policy_id = aws_organizations_policy.enforce_s3_encryption.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
#
# resource "aws_organizations_policy_attachment" "security_ebs" {
#   policy_id = aws_organizations_policy.enforce_ebs_encryption.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_ebs" {
#   policy_id = aws_organizations_policy.enforce_ebs_encryption.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_ebs" {
#   policy_id = aws_organizations_policy.enforce_ebs_encryption.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
#
# resource "aws_organizations_policy_attachment" "security_rds" {
#   policy_id = aws_organizations_policy.enforce_rds_encryption.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_rds" {
#   policy_id = aws_organizations_policy.enforce_rds_encryption.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_rds" {
#   policy_id = aws_organizations_policy.enforce_rds_encryption.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
#
# resource "aws_organizations_policy_attachment" "security_logs" {
#   policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_logs" {
#   policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_logs" {
#   policy_id = aws_organizations_policy.protect_cloudwatch_logs.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
#
# resource "aws_organizations_policy_attachment" "security_root" {
#   policy_id = aws_organizations_policy.restrict_root_user.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_root" {
#   policy_id = aws_organizations_policy.restrict_root_user.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_root" {
#   policy_id = aws_organizations_policy.restrict_root_user.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
#
# resource "aws_organizations_policy_attachment" "security_tagging" {
#   policy_id = aws_organizations_policy.enforce_tagging.id
#   target_id = aws_organizations_organizational_unit.security.id
# }
#
# resource "aws_organizations_policy_attachment" "production_tagging" {
#   policy_id = aws_organizations_policy.enforce_tagging.id
#   target_id = aws_organizations_organizational_unit.production.id
# }
#
# resource "aws_organizations_policy_attachment" "development_tagging" {
#   policy_id = aws_organizations_policy.enforce_tagging.id
#   target_id = aws_organizations_organizational_unit.development.id
# }
