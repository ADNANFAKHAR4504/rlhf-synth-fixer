# Primary Aurora cluster in us-east-1 (will be promoted to global)
resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "14.13"
  master_username                 = var.master_username
  master_password                 = random_password.master_password.result
  database_name                   = var.database_name
  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = var.preferred_backup_window
  preferred_maintenance_window    = var.preferred_maintenance_window
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.primary.name
  vpc_security_group_ids          = [aws_security_group.primary_db.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.primary_db.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = false
  skip_final_snapshot             = true

  lifecycle {
    ignore_changes = [
      global_cluster_identifier,
      engine_version
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name      = "aurora-primary-${var.environment_suffix}"
      Region    = var.primary_region
      Role      = "primary"
      TaskID    = var.environment_suffix
      ManagedBy = "terraform"
    }
  )
}

# Aurora Global Database cluster - created from existing primary cluster
resource "aws_rds_global_cluster" "global" {
  global_cluster_identifier    = "aurora-global-${var.environment_suffix}"
  source_db_cluster_identifier = aws_rds_cluster.primary.arn
  force_destroy                = true

  lifecycle {
    ignore_changes = [
      engine_version,
      source_db_cluster_identifier,
      engine,
      engine_lifecycle_support,
      force_destroy
    ]
  }

  depends_on = [
    aws_rds_cluster_instance.primary
  ]
}

# Primary cluster instances (2 for HA)
resource "aws_rds_cluster_instance" "primary" {
  count                           = 2
  identifier                      = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier              = aws_rds_cluster.primary.id
  instance_class                  = var.db_instance_class
  engine                          = aws_rds_cluster.primary.engine
  engine_version                  = aws_rds_cluster.primary.engine_version
  db_parameter_group_name         = aws_db_parameter_group.primary.name
  auto_minor_version_upgrade      = false
  publicly_accessible             = false
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.primary_db.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  tags = merge(
    var.common_tags,
    {
      Name      = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
      Region    = var.primary_region
      Role      = "primary"
      TaskID    = var.environment_suffix
      ManagedBy = "terraform"
    }
  )
}

# Secondary Aurora cluster in us-west-2 (Global Database Secondary)
resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "aurora-secondary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "14.13"
  global_cluster_identifier       = aws_rds_global_cluster.global.id
  db_subnet_group_name            = aws_db_subnet_group.secondary.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.secondary.name
  vpc_security_group_ids          = [aws_security_group.secondary_db.id]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.secondary_db.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection             = false
  skip_final_snapshot             = true

  depends_on = [
    aws_rds_global_cluster.global
  ]

  lifecycle {
    ignore_changes = [
      replication_source_identifier,
      engine_version
    ]
  }

  tags = merge(
    var.common_tags,
    {
      Name      = "aurora-secondary-${var.environment_suffix}"
      Region    = var.secondary_region
      Role      = "secondary"
      TaskID    = var.environment_suffix
      ManagedBy = "terraform"
    }
  )
}

# Secondary cluster instances (2 for HA)
resource "aws_rds_cluster_instance" "secondary" {
  provider                        = aws.secondary
  count                           = 2
  identifier                      = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier              = aws_rds_cluster.secondary.id
  instance_class                  = var.db_instance_class
  engine                          = aws_rds_cluster.secondary.engine
  engine_version                  = aws_rds_cluster.secondary.engine_version
  db_parameter_group_name         = aws_db_parameter_group.secondary.name
  auto_minor_version_upgrade      = false
  publicly_accessible             = false
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.secondary_db.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring_secondary.arn

  tags = merge(
    var.common_tags,
    {
      Name      = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
      Region    = var.secondary_region
      Role      = "secondary"
      TaskID    = var.environment_suffix
      ManagedBy = "terraform"
    }
  )
}
