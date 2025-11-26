# KMS key for encrypting all data at rest
resource "aws_kms_key" "main" {
  description             = "Customer-managed key for loan processing application - ${local.env_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "loan-processing-key-${local.env_suffix}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/loan-processing-${local.env_suffix}"
  target_key_id = aws_kms_key.main.key_id
}
