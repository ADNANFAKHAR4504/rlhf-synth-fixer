# database.tf

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment_suffix}-xy"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.tags, {
    Name = "db-subnet-group-${var.environment_suffix}-xy"
  })
}

# DB Parameter Group for SSL enforcement
resource "aws_db_parameter_group" "postgres_ssl" {
  name   = "postgres-ssl-${var.environment_suffix}xy"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  tags = merge(var.tags, {
    Name = "postgres-ssl-${var.environment_suffix}-xy"
  })
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# AWS Secrets Manager for DB password
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-password-${var.environment_suffix}-xy"
  recovery_window_in_days = 0 # Force delete for testing

  tags = merge(var.tags, {
    Name = "rds-password-${var.environment_suffix}-xy"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "payment_db" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.8"
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database_tier.id]
  parameter_group_name   = aws_db_parameter_group.postgres_ssl.name

  multi_az            = true
  publicly_accessible = false

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = false # Allow deletion for testing
  skip_final_snapshot = true  # Skip final snapshot for testing

  tags = merge(var.tags, {
    Name = "payment-db-${var.environment_suffix}"
  })
}
