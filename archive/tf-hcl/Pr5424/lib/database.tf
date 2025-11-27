# RDS Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name_prefix = "${local.name_prefix}-aurora-"
  description = "Subnet group for Aurora cluster"
  subnet_ids  = local.private_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-subnet-group"
    }
  )
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "${local.name_prefix}-aurora-cluster"
  engine                          = "aurora-postgresql"
  engine_version                  = var.aurora_engine_version == "" ? null : var.aurora_engine_version
  database_name                   = var.database_name
  master_username                 = var.database_master_username
  master_password                 = data.aws_secretsmanager_random_password.rds_password.random_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.rds.arn
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true
  apply_immediately               = false

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-cluster"
    }
  )
}

# RDS Aurora Writer Instance
resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier         = "${local.name_prefix}-aurora-writer"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  # Performance Insights only supported on db.t3.small and larger
  performance_insights_enabled = can(regex("^db\\.t3\\.(small|medium|large|xlarge|2xlarge)|^db\\.(r|x)", var.db_instance_class))
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-writer"
      Type = "writer"
    }
  )
}

# RDS Aurora Reader Instance
resource "aws_rds_cluster_instance" "aurora_reader" {
  identifier         = "${local.name_prefix}-aurora-reader"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  # Performance Insights only supported on db.t3.small and larger
  performance_insights_enabled = can(regex("^db\\.t3\\.(small|medium|large|xlarge|2xlarge)|^db\\.(r|x)", var.db_instance_class))
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-reader"
      Type = "reader"
    }
  )
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-kms-key"
    }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}
