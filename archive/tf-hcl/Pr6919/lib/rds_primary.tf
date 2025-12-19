# DB Subnet Group - Primary
resource "aws_db_subnet_group" "primary" {
  provider    = aws.primary
  name        = "db-subnet-group-primary-${var.environment_suffix}"
  description = "Subnet group for primary RDS instance"
  subnet_ids  = aws_subnet.primary_private[*].id

  tags = {
    Name              = "db-subnet-group-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# DB Parameter Group - Primary
resource "aws_db_parameter_group" "primary" {
  provider    = aws.primary
  name        = "pg-param-group-primary-${var.environment_suffix}"
  family      = "postgres15"
  description = "Parameter group for primary PostgreSQL"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name              = "pg-param-group-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# Primary RDS Instance
resource "aws_db_instance" "primary" {
  provider          = aws.primary
  identifier        = "trading-db-primary-${var.environment_suffix}"
  engine            = "postgres"
  engine_version    = data.aws_rds_engine_version.postgresql.version
  instance_class    = var.db_instance_class
  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.primary_rds.arn

  db_name  = "tradingdb"
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  parameter_group_name   = aws_db_parameter_group.primary.name

  multi_az            = true
  publicly_accessible = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.primary_rds.arn

  skip_final_snapshot      = true
  deletion_protection      = false
  delete_automated_backups = true

  tags = {
    Name              = "trading-db-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
