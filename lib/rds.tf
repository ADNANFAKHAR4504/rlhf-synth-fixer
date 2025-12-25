# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Database subnet group
resource "aws_db_subnet_group" "main" {
  name       = "main-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(var.common_tags, {
    Name = "main-db-subnet-group-${var.environment_suffix}"
  })
}

# Secrets Manager secret for RDS credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                           = "rds-credentials-${var.environment_suffix}"
  description                    = "RDS database credentials"
  recovery_window_in_days        = 7 # Allow 7 days for recovery instead of immediate deletion
  force_overwrite_replica_secret = true

  tags = var.common_tags

  # Lifecycle rule disabled for LocalStack testing
  # lifecycle {
  #   prevent_destroy = true
  # }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.db_password.result
  })
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "main-postgres-params-${var.environment_suffix}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = var.common_tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "main-postgres-db-${var.environment_suffix}"

  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = "db.t3.small"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = false # Simplified for LocalStack

  db_name  = "maindb"
  username = "postgres"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az = false # LocalStack Community doesn't support multi-AZ

  parameter_group_name = aws_db_parameter_group.main.name

  skip_final_snapshot      = true
  delete_automated_backups = true
  deletion_protection      = false

  tags = merge(var.common_tags, {
    Name = "main-postgres-db-${var.environment_suffix}"
  })
}