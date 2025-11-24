# Primary RDS instance
resource "aws_db_instance" "primary" {
  identifier     = "rds-primary-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = data.aws_rds_engine_version.postgresql.version
  instance_class = local.instance_class

  allocated_storage = var.environment == "prod" ? 100 : 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.primary.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.primary_db.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  parameter_group_name   = aws_db_parameter_group.primary.name

  multi_az                = local.multi_az
  backup_retention_period = var.backup_retention_period
  backup_window           = local.backup_window
  maintenance_window      = local.maintenance_window

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "prod"
  performance_insights_kms_key_id = var.environment == "prod" ? aws_kms_key.primary.arn : null

  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-${var.environment_suffix}"
      Role = "primary"
    }
  )
}

# DR Read Replica
resource "aws_db_instance" "dr_replica" {
  provider             = aws.us-west-2
  identifier           = "rds-dr-replica-${var.environment_suffix}"
  replicate_source_db  = aws_db_instance.primary.arn
  db_subnet_group_name = aws_db_subnet_group.dr.name

  instance_class    = local.instance_class
  storage_encrypted = true
  kms_key_id        = aws_kms_key.dr.arn

  vpc_security_group_ids = [aws_security_group.dr_db.id]
  parameter_group_name   = aws_db_parameter_group.dr.name

  multi_az = false # Read replicas cannot be multi-AZ

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "prod"
  performance_insights_kms_key_id = var.environment == "prod" ? aws_kms_key.dr.arn : null

  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-replica-${var.environment_suffix}"
      Role = "replica"
    }
  )
}
