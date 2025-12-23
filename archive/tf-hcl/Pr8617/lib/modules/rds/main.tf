resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name_prefix = "${var.environment}-db-password-${var.environment_suffix}-"
  description = "RDS database password for ${var.environment}"

  tags = {
    Name        = "${var.environment}-db-password-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.environment}-db-subnet-${var.environment_suffix}-"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name        = "${var.environment}-db-subnet-group-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-postgres-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.10"
  instance_class = var.instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = var.kms_key_arn

  db_name  = replace("${var.project_name}${var.environment}", "-", "")
  username = "dbadmin"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = var.backup_retention
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.environment}-final-snapshot-${var.environment_suffix}"
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.environment}-postgres-${var.environment_suffix}"
    Environment = var.environment
  }
}
