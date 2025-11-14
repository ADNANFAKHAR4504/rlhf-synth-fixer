# Store database connection string in Parameter Store
resource "aws_ssm_parameter" "db_connection_string" {
  name        = "/payment/${var.environment_suffix}/db/connection_string"
  description = "Database connection string for payment processor"
  type        = "SecureString"
  value = format(
    "postgresql://%s:%s@%s:5432/%s",
    aws_rds_cluster.aurora_postgresql.master_username,
    random_password.db_master_password.result,
    aws_rds_cluster.aurora_postgresql.endpoint,
    aws_rds_cluster.aurora_postgresql.database_name
  )

  tags = {
    Name        = "payment-db-connection-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database password in Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name        = "/payment/${var.environment_suffix}/db/password"
  description = "Database master password"
  type        = "SecureString"
  value       = random_password.db_master_password.result

  tags = {
    Name        = "payment-db-password-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database endpoint in Parameter Store
resource "aws_ssm_parameter" "db_endpoint" {
  name        = "/payment/${var.environment_suffix}/db/endpoint"
  description = "Database cluster endpoint"
  type        = "String"
  value       = aws_rds_cluster.aurora_postgresql.endpoint

  tags = {
    Name        = "payment-db-endpoint-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Store database reader endpoint in Parameter Store
resource "aws_ssm_parameter" "db_reader_endpoint" {
  name        = "/payment/${var.environment_suffix}/db/reader_endpoint"
  description = "Database cluster reader endpoint"
  type        = "String"
  value       = aws_rds_cluster.aurora_postgresql.reader_endpoint

  tags = {
    Name        = "payment-db-reader-endpoint-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}
