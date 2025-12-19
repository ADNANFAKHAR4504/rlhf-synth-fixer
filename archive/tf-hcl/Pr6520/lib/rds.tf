# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "payment-aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "payment-aurora-subnet-group-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Random password for Aurora master user
resource "random_password" "db_master_password" {
  length  = 32
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora_postgresql" {
  cluster_identifier     = "payment-aurora-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = "paymentdb"
  master_username        = var.db_master_username
  master_password        = random_password.db_master_password.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period      = var.db_backup_retention_days
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot = true

  apply_immediately = false

  tags = {
    Name        = "payment-aurora-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Aurora Cluster Instances (Multi-AZ)
resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 2
  identifier         = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora_postgresql.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.aurora_postgresql.engine
  engine_version     = aws_rds_cluster.aurora_postgresql.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring_role.arn

  tags = {
    Name        = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS Aurora encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "payment-rds-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# KMS Key Alias
resource "aws_kms_alias" "rds" {
  name          = "alias/payment-rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}
