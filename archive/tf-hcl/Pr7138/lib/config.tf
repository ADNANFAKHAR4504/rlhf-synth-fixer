# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config ? 1 : 0
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn
  recording_group {
    all_supported = true
  }

  depends_on = [aws_iam_role_policy_attachment.config_managed_policy]
}

# Start the configuration recorder
resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
  depends_on = [
    aws_s3_bucket_policy.config_bucket_policy,
    aws_config_delivery_channel.main[0]
  ]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config ? 1 : 0
  name           = "config-delivery-channel-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.id
  sns_topic_arn  = aws_sns_topic.config_notifications.arn
  depends_on     = [aws_config_configuration_recorder.main[0]]
}

# S3 bucket policy for Config
resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketVersioning"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# SNS topic for Config notifications
resource "aws_sns_topic" "config_notifications" {
  name              = "config-notifications-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.primary.id

  tags = merge(
    var.tags,
    {
      Name = "config-notifications-${var.environment_suffix}"
    }
  )
}

# Config Rule 1: S3 bucket server-side encryption enabled
resource "aws_config_config_rule" "s3_encryption" {
  count = var.enable_config ? 1 : 0
  name  = "s3-bucket-server-side-encryption-enabled-${var.environment_suffix}"

  description = "Checks that S3 bucket has server-side encryption enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "s3-encryption-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 2: EBS volumes are encrypted
resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_config ? 1 : 0
  name  = "encrypted-volumes-${var.environment_suffix}"

  description = "Checks whether EBS volumes are encrypted"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "ebs-encryption-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 3: RDS encryption enabled
resource "aws_config_config_rule" "rds_encryption" {
  count = var.enable_config ? 1 : 0
  name  = "rds-encryption-enabled-${var.environment_suffix}"

  description = "Checks that RDS instances have encryption enabled"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "rds-encryption-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 4: Root account MFA enabled
resource "aws_config_config_rule" "root_account_mfa" {
  count = var.enable_config ? 1 : 0
  name  = "root-account-mfa-enabled-${var.environment_suffix}"

  description = "Checks whether the root user has MFA enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "root-mfa-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 5: IAM policy with admin access
resource "aws_config_config_rule" "iam_admin_access" {
  count = var.enable_config ? 1 : 0
  name  = "iam-policy-no-statements-with-admin-access-${var.environment_suffix}"

  description = "Checks if any customer-managed IAM policy contains admin access"

  source {
    owner             = "AWS"
    source_identifier = "IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "iam-admin-access-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 6: CloudTrail enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  count = var.enable_config ? 1 : 0
  name  = "cloudtrail-enabled-${var.environment_suffix}"

  description = "Checks whether CloudTrail is enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "cloudtrail-enabled-rule-${var.environment_suffix}"
    }
  )
}

# Config Rule 7: Config enabled
resource "aws_config_config_rule" "config_enabled" {
  count = var.enable_config ? 1 : 0
  name  = "config-enabled-${var.environment_suffix}"

  description = "Checks whether AWS Config is enabled"

  source {
    owner             = "AWS"
    source_identifier = "CONFIG_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder_status.main[0]]

  tags = merge(
    var.tags,
    {
      Name = "config-enabled-rule-${var.environment_suffix}"
    }
  )
}

# AWS Config Conformance Pack
resource "aws_config_conformance_pack" "security" {
  count = var.enable_config ? 1 : 0
  name  = "${var.config_conformance_pack_name}-${var.environment_suffix}"

  template_body = templatefile("${path.module}/conformance-pack.yaml", {
    environment_suffix = var.environment_suffix
  })

  depends_on = [
    aws_config_configuration_recorder_status.main[0],
    aws_config_config_rule.s3_encryption[0],
    aws_config_config_rule.encrypted_volumes[0],
    aws_config_config_rule.rds_encryption[0],
    aws_config_config_rule.root_account_mfa[0],
    aws_config_config_rule.iam_admin_access[0],
    aws_config_config_rule.cloudtrail_enabled[0],
    aws_config_config_rule.config_enabled[0]
  ]
}
