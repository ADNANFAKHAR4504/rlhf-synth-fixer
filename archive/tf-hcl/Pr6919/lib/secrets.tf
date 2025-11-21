# Generate random password
# AWS RDS password requirements: Only printable ASCII characters besides '/', '@', '"', ' ' may be used
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store password in Secrets Manager - Primary region
resource "aws_secretsmanager_secret" "db_password_primary" {
  provider    = aws.primary
  name        = "rds-master-password-primary-${var.environment_suffix}"
  description = "Master password for primary RDS instance"

  tags = {
    Name              = "rds-secret-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_primary" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_password_primary.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Store password in Secrets Manager - DR region
resource "aws_secretsmanager_secret" "db_password_dr" {
  provider                       = aws.dr
  name                           = "rds-master-password-dr-${var.environment_suffix}"
  description                    = "Master password for DR RDS instance"
  force_overwrite_replica_secret = true

  tags = {
    Name              = "rds-secret-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

resource "aws_secretsmanager_secret_version" "db_password_dr" {
  provider  = aws.dr
  secret_id = aws_secretsmanager_secret.db_password_dr.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}
