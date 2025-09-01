resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  
  tags = merge(var.common_tags, {
    Name = "rds-encryption-key"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}