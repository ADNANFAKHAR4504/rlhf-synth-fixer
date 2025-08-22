resource "aws_kms_key" "primary" {
  description             = "KMS key for primary region (us-west-1)"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name        = "primary-kms-key"
    Environment = "production"
    Region      = "us-west-1"
  })
}

resource "aws_kms_alias" "primary" {
  name          = "alias/primary-key-${var.resource_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.eu_central_1
  description             = "KMS key for secondary region (eu-central-1)"
  deletion_window_in_days = 7

  tags = merge(var.tags, {
    Name        = "secondary-kms-key"
    Environment = "production"
    Region      = "eu-central-1"
  })
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.eu_central_1
  name          = "alias/secondary-key-${var.resource_suffix}"
  target_key_id = aws_kms_key.secondary.key_id
}
