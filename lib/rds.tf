# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-${var.environment_suffix}-db-password"
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-db-password"
    Environment = var.environment
    Project     = var.project_name
  }

  lifecycle {
    ignore_changes = [name]
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment_suffix}-db"

  allocated_storage     = 20
  max_allocated_storage = local.is_localstack ? 0 : 100
  storage_type          = "gp2"
  storage_encrypted     = local.is_localstack ? false : true

  engine         = "mysql"
  engine_version = local.is_localstack ? "8.0.32" : "8.0"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = local.is_localstack ? 0 : 7
  backup_window           = local.is_localstack ? null : "03:00-04:00"
  maintenance_window      = local.is_localstack ? null : "sun:04:00-sun:05:00"

  skip_final_snapshot      = true
  delete_automated_backups = true
  deletion_protection      = false
  apply_immediately        = true

  # Performance Insights - disabled for t3.micro and LocalStack
  performance_insights_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-db"
    Environment = var.environment
    Project     = var.project_name
  }
}