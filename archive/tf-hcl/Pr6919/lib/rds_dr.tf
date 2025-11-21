# DB Subnet Group - DR
resource "aws_db_subnet_group" "dr" {
  provider    = aws.dr
  name        = "db-subnet-group-dr-${var.environment_suffix}"
  description = "Subnet group for DR RDS instance"
  subnet_ids  = aws_subnet.dr_private[*].id

  tags = {
    Name              = "db-subnet-group-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# DB Parameter Group - DR
resource "aws_db_parameter_group" "dr" {
  provider    = aws.dr
  name        = "pg-param-group-dr-${var.environment_suffix}"
  family      = "postgres15"
  description = "Parameter group for DR PostgreSQL"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name              = "pg-param-group-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# DR RDS Instance (Read Replica)
resource "aws_db_instance" "dr" {
  provider            = aws.dr
  identifier          = "trading-db-dr-${var.environment_suffix}"
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = var.db_instance_class

  storage_encrypted = true
  kms_key_id        = aws_kms_key.dr_rds.arn

  vpc_security_group_ids = [aws_security_group.dr_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.dr.name
  parameter_group_name   = aws_db_parameter_group.dr.name

  publicly_accessible = false

  backup_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.dr_rds.arn

  skip_final_snapshot      = true
  deletion_protection      = false
  delete_automated_backups = true

  tags = {
    Name              = "trading-db-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
