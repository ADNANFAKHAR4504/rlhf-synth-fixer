resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environmentSuffix}-"
  subnet_ids  = [for subnet in aws_subnet.private : subnet.id]

  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${var.environmentSuffix}"
  })
}

resource "aws_db_instance" "main" {
  identifier_prefix = "rds-${var.environmentSuffix}-"

  engine            = "mysql"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = "appdb"
  username = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["password"]

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "rds-${var.environmentSuffix}-final-snapshot"

  deletion_protection = false

  multi_az = false

  tags = merge(local.common_tags, {
    Name = "rds-${var.environmentSuffix}"
  })

  # Note: prevent_destroy removed for CI/CD compatibility
  # All resources must be fully destroyable for automated testing workflows
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "rds-key-${var.environmentSuffix}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environmentSuffix}"
  target_key_id = aws_kms_key.rds.key_id
}