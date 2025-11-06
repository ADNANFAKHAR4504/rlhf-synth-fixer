# config.tf - AWS Config rules for compliance monitoring

# S3 bucket for Config
resource "aws_s3_bucket" "config" {
  bucket = "${local.name_prefix}-config-bucket-${data.aws_caller_identity.current.account_id}"

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
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

  lifecycle {
    prevent_destroy = false
  }
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
  count    = var.enable_config_recorder ? 1 : 0
  name     = "${local.name_prefix}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Config delivery channel
resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config_recorder ? 1 : 0
  name           = "${local.name_prefix}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

# Start Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config_recorder ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
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

# Config rule: EC2 instance type restrictions
resource "aws_config_config_rule" "ec2_instance_type" {
  name = "${local.name_prefix}-ec2-instance-type-restriction"

  source {
    owner             = "AWS"
    source_identifier = "DESIRED_INSTANCE_TYPE"
  }

  input_parameters = jsonencode({
    instanceType = "t2.micro,t2.small,t2.medium,t3.micro,t3.small,t3.medium,t3.large"
  })

  tags = local.mandatory_tags
}