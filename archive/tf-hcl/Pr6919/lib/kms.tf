# KMS key for primary region
resource "aws_kms_key" "primary_rds" {
  provider    = aws.primary
  description = "KMS key for RDS encryption in primary region"

  tags = {
    Name              = "rds-key-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

resource "aws_kms_alias" "primary_rds" {
  provider      = aws.primary
  name          = "alias/rds-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary_rds.key_id
}

# KMS key for DR region
resource "aws_kms_key" "dr_rds" {
  provider    = aws.dr
  description = "KMS key for RDS encryption in DR region"

  tags = {
    Name              = "rds-key-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

resource "aws_kms_alias" "dr_rds" {
  provider      = aws.dr
  name          = "alias/rds-dr-${var.environment_suffix}"
  target_key_id = aws_kms_key.dr_rds.key_id
}
