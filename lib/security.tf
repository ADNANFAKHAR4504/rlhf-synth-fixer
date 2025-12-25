# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Secrets Manager Secret for RDS credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.name_prefix}-db-credentials"
  description = "RDS database credentials"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = var.db_name
  })
}

# AWS Certificate Manager - SSL Certificate - Disabled for test deployment
# resource "aws_acm_certificate" "main" {
#   domain_name       = "*.${local.name_prefix}.local"
#   validation_method = "EMAIL"
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = merge(local.common_tags, {
#     Name = "${local.name_prefix}-certificate"
#   })
# }

# LocalStack: Security Hub is a PRO feature - commented out for Community edition
# Security Hub - Enhanced security visibility
# resource "aws_securityhub_account" "main" {
#   enable_default_standards = true
# }

# Enable Config for compliance monitoring - Conditional creation
# Set var.enable_config to true only if Config is not already enabled in the region

resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config ? 1 : 0
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config ? 1 : 0
  name           = "${local.name_prefix}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_s3_bucket" "config" {
  bucket        = "${local.name_prefix}-config-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-config"
  })
}

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