# KMS Key for encryption
resource "aws_kms_key" "ecommerce_kms_key" {
  description             = "KMS key for ecommerce application encryption"
  deletion_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "ecommerce-kms-key-${var.environment_suffix}"
  })
}

resource "aws_kms_alias" "ecommerce_kms_alias" {
  name          = "alias/ecommerce-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.ecommerce_kms_key.key_id
}