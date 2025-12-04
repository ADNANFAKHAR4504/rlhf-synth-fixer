# KMS key for S3 encryption in current region
resource "aws_kms_key" "s3" {
  provider                = aws.primary
  description             = "KMS key for S3 encryption in ${local.current_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.resource_prefix}-s3-kms-${local.current_region}"
      Service = "S3"
    }
  )
}

resource "aws_kms_alias" "s3" {
  provider      = aws.primary
  name          = "alias/${local.resource_prefix}-s3-${local.current_region}"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for RDS encryption in current region
resource "aws_kms_key" "rds" {
  provider                = aws.primary
  description             = "KMS key for RDS encryption in ${local.current_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "${local.resource_prefix}-rds-kms-${local.current_region}"
      Service = "RDS"
    }
  )
}

resource "aws_kms_alias" "rds" {
  provider      = aws.primary
  name          = "alias/${local.resource_prefix}-rds-${local.current_region}"
  target_key_id = aws_kms_key.rds.key_id
}
