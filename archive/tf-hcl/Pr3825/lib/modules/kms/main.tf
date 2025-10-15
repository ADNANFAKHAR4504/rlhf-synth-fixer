# KMS Keys for RDS Encryption

resource "aws_kms_key" "rds_primary" {
  description             = "KMS key for RDS encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-rds-kms-primary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_primary" {
  name          = "alias/${var.project_name}-rds-primary"
  target_key_id = aws_kms_key.rds_primary.key_id
}

resource "aws_kms_key" "rds_secondary" {
  provider                = aws.secondary
  description             = "KMS key for RDS encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-rds-kms-secondary"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "rds_secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-rds-secondary"
  target_key_id = aws_kms_key.rds_secondary.key_id
}

