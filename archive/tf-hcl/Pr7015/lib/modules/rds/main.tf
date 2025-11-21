resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-db-params"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-db-params"
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.14"

  instance_class    = var.instance_class
  allocated_storage = var.multi_az ? 100 : 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = var.multi_az
  backup_retention_period = var.multi_az ? 30 : 7
  backup_window           = "02:00-03:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${var.environment}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}" : null
  deletion_protection       = var.enable_deletion_protection

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.environment}-db"
  })
}