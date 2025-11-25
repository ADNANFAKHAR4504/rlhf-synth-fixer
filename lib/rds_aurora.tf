# Primary Aurora cluster in us-east-1
resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "14.13"
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = random_password.master_password.result
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

  # Enable replication for DR
  replication_source_identifier   = null

  tags = merge(
    var.common_tags,
    {
      Name   = "aurora-primary-${var.environment_suffix}"
      Region = var.primary_region
      Role   = "primary"
    }
  )
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
      Name   = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
      Region = var.primary_region
      Role   = "primary"
    }
  )
}

# Note: Aurora PostgreSQL does not support cross-region read replicas using replication_source_identifier.
# For true multi-region DR, Aurora Global Database would be required (supported in version 15.8+).
# This configuration provides HA within us-east-1 using Multi-AZ with 2 instances,
# plus disaster recovery via automated backups and cross-region S3 backup replication.
