# KMS Key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-s3-key"
  })
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${local.project_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-rds-key"
  })
}

resource "aws_kms_alias" "rds_key_alias" {
  name          = "alias/${local.project_prefix}-rds-key"
  target_key_id = aws_kms_key.rds_key.key_id
}

# KMS Key for EBS encryption
resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-ebs-key"
  })
}

resource "aws_kms_alias" "ebs_key_alias" {
  name          = "alias/${local.project_prefix}-ebs-key"
  target_key_id = aws_kms_key.ebs_key.key_id
}