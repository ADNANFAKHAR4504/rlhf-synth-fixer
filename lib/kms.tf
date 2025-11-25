# KMS key for primary region
resource "aws_kms_key" "primary_db" {
  description             = "KMS key for RDS encryption in ${var.primary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-kms-${var.primary_region}-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_kms_alias" "primary_db" {
  name          = "alias/rds-aurora-${var.primary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_db.key_id
}

resource "aws_kms_key_policy" "primary_db" {
  key_id = aws_kms_key.primary_db.id

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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key for secondary region
resource "aws_kms_key" "secondary_db" {
  provider                = aws.secondary
  description             = "KMS key for RDS encryption in ${var.secondary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-kms-${var.secondary_region}-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_kms_alias" "secondary_db" {
  provider      = aws.secondary
  name          = "alias/rds-aurora-${var.secondary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary_db.key_id
}

resource "aws_kms_key_policy" "secondary_db" {
  provider = aws.secondary
  key_id   = aws_kms_key.secondary_db.id

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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key for SNS encryption in primary region
resource "aws_kms_key" "primary_sns" {
  description             = "KMS key for SNS encryption in ${var.primary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "sns-kms-${var.primary_region}-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

resource "aws_kms_alias" "primary_sns" {
  name          = "alias/sns-${var.primary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_sns.key_id
}

resource "aws_kms_key_policy" "primary_sns" {
  key_id = aws_kms_key.primary_sns.id

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
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS key for SNS encryption in secondary region
resource "aws_kms_key" "secondary_sns" {
  provider                = aws.secondary
  description             = "KMS key for SNS encryption in ${var.secondary_region}-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name   = "sns-kms-${var.secondary_region}-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

resource "aws_kms_alias" "secondary_sns" {
  provider      = aws.secondary
  name          = "alias/sns-${var.secondary_region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary_sns.key_id
}

resource "aws_kms_key_policy" "secondary_sns" {
  provider = aws.secondary
  key_id   = aws_kms_key.secondary_sns.id

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
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
