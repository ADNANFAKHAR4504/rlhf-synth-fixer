# KMS key for primary region
resource "aws_kms_key" "primary" {
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-kms-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "primary" {
  name          = "alias/rds-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for DR region
resource "aws_kms_key" "dr" {
  provider                = aws.us-west-2
  description             = "KMS key for RDS encryption in DR region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-kms-${var.environment_suffix}"
    }
  )
}

resource "aws_kms_alias" "dr" {
  provider      = aws.us-west-2
  name          = "alias/rds-dr-${var.environment_suffix}"
  target_key_id = aws_kms_key.dr.key_id
}
