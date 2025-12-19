# S3 Buckets with Advanced Security

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  count = var.s3_encryption_enabled ? 1 : 0

  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${local.partition}:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${local.region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:${local.partition}:logs:${local.region}:${local.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  count = var.s3_encryption_enabled ? 1 : 0

  name          = local.kms_key_alias
  target_key_id = aws_kms_key.s3[0].key_id
}

# Access Logs Bucket
resource "aws_s3_bucket" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = local.access_logs_bucket

  tags = merge(local.common_tags, {
    Purpose = "AccessLogs"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  count = var.enable_s3_access_logging && var.s3_encryption_enabled ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3[0].arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.access_logs[0].id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

# Financial Data Bucket
resource "aws_s3_bucket" "financial_data" {
  bucket = local.financial_data_bucket

  tags = merge(local.common_tags, {
    Purpose            = "FinancialData"
    DataClassification = "Confidential"
  })
}

resource "aws_s3_bucket_versioning" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id

  versioning_configuration {
    status = "Enabled"
    # MFA Delete cannot be enabled via Terraform - must be enabled manually using AWS CLI with MFA token:
    # aws s3api put-bucket-versioning --bucket BUCKET_NAME --versioning-configuration Status=Enabled,MFADelete=Enabled --mfa "SERIAL_NUMBER MFA_CODE"
  }
}

resource "aws_s3_bucket_public_access_block" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "financial_data" {
  count = var.s3_encryption_enabled ? 1 : 0

  bucket = aws_s3_bucket.financial_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3[0].arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_logging" "financial_data" {
  count = var.enable_s3_access_logging ? 1 : 0

  bucket = aws_s3_bucket.financial_data.id

  target_bucket = aws_s3_bucket.access_logs[0].id
  target_prefix = "financial-data-logs/"
}

# Financial Data Bucket Policy with VPC Endpoint and Encryption Requirements
data "aws_iam_policy_document" "financial_data_bucket_policy" {
  # Deny all access unless through VPC endpoint
  dynamic "statement" {
    for_each = var.vpc_endpoint_id != "" ? [1] : []
    content {
      sid    = "DenyAccessWithoutVPCEndpoint"
      effect = "Deny"
      principals {
        type        = "*"
        identifiers = ["*"]
      }
      actions = ["s3:*"]
      resources = [
        aws_s3_bucket.financial_data.arn,
        "${aws_s3_bucket.financial_data.arn}/*"
      ]

      condition {
        test     = "StringNotEquals"
        variable = "aws:SourceVpce"
        values   = [var.vpc_endpoint_id]
      }
    }
  }

  # Deny unencrypted uploads
  statement {
    sid    = "DenyUnencryptedUploads"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }

  # Deny insecure transport
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.financial_data.arn,
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Require MFA for delete operations
  statement {
    sid    = "RequireMFAForDelete"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = [
      "s3:DeleteObject",
      "s3:DeleteObjectVersion"
    ]
    resources = [
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }

  # Deny public access explicitly
  statement {
    sid    = "DenyPublicAccess"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.financial_data.arn,
      "${aws_s3_bucket.financial_data.arn}/*"
    ]

    condition {
      test     = "StringLike"
      variable = "s3:x-amz-acl"
      values   = ["public-read", "public-read-write"]
    }
  }
}

resource "aws_s3_bucket_policy" "financial_data" {
  bucket = aws_s3_bucket.financial_data.id
  policy = data.aws_iam_policy_document.financial_data_bucket_policy.json
}
