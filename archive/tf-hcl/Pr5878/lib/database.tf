# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "rds-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "rds-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "rds-subnet-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name_prefix = "rds-params-${var.environment_suffix}-"
  family      = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = {
    Name = "rds-parameter-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS MySQL Instance
resource "aws_db_instance" "main" {
  identifier = "rds-${var.environment_suffix}"

  engine            = "mysql"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = null
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name = "rds-mysql-${var.environment_suffix}"
  }
}
