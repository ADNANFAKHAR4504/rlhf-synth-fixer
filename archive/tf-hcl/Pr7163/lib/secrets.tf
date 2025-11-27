# Generate random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager (primary region)
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-master-password-${var.environment_suffix}"
  description             = "RDS master password"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-master-password-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# Replicate secret to DR region
resource "aws_secretsmanager_secret" "db_password_dr" {
  provider                = aws.us-west-2
  name                    = "rds-master-password-${var.environment_suffix}"
  description             = "RDS master password (DR replica)"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-master-password-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password_dr" {
  provider  = aws.us-west-2
  secret_id = aws_secretsmanager_secret.db_password_dr.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}
