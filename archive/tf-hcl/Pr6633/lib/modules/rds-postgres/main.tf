# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "rds-subnet-${var.environment_suffix}-"
  subnet_ids  = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "rds-subnet-group-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DB Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name_prefix = "postgres-params-${var.environment_suffix}-"
  family      = "postgres15"

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

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(
    var.tags,
    {
      Name = "postgres-params-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier_prefix = "fintech-db-${var.environment_suffix}-"

  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.performance_insights_retention_period

  deletion_protection       = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "fintech-db-${var.environment_suffix}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  copy_tags_to_snapshot = true

  auto_minor_version_upgrade = true

  tags = merge(
    var.tags,
    {
      Name = "fintech-db-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [password, final_snapshot_identifier]
  }
}
