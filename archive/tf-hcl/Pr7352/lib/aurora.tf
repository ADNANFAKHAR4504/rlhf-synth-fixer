# aurora.tf - Aurora PostgreSQL Cluster Configuration

# Random password generation for Aurora (if not provided)
resource "random_password" "aurora_master_password" {
  length  = 32
  special = true
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = var.aurora_engine_version
  database_name                   = "paymentdb"
  master_username                 = var.aurora_master_username
  master_password                 = var.aurora_master_password != null ? var.aurora_master_password : random_password.aurora_master_password.result
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]
  backup_retention_period         = var.aurora_backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  skip_final_snapshot             = true
  apply_immediately               = true

  # Point-in-time recovery enabled through backup retention
  backtrack_window = 0 # Not available for PostgreSQL

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Cluster Instances (Writer)
resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier                            = "aurora-writer-${var.environment_suffix}"
  cluster_identifier                    = aws_rds_cluster.aurora.id
  instance_class                        = var.aurora_instance_class
  engine                                = aws_rds_cluster.aurora.engine
  engine_version                        = aws_rds_cluster.aurora.engine_version
  publicly_accessible                   = false
  db_subnet_group_name                  = aws_db_subnet_group.aurora.name
  auto_minor_version_upgrade            = true
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Name = "aurora-writer-${var.environment_suffix}"
    Role = "writer"
  }
}

# Aurora Cluster Instances (Readers) - one per AZ for high availability
resource "aws_rds_cluster_instance" "aurora_readers" {
  count                                 = length(var.availability_zones)
  identifier                            = "aurora-reader-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier                    = aws_rds_cluster.aurora.id
  instance_class                        = var.aurora_instance_class
  engine                                = aws_rds_cluster.aurora.engine
  engine_version                        = aws_rds_cluster.aurora.engine_version
  publicly_accessible                   = false
  db_subnet_group_name                  = aws_db_subnet_group.aurora.name
  auto_minor_version_upgrade            = true
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  availability_zone                     = var.availability_zones[count.index]

  tags = {
    Name = "aurora-reader-${var.environment_suffix}-${count.index + 1}"
    Role = "reader"
  }
}

# Aurora Parameter Group
resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "aurora-pg-${var.environment_suffix}"
  family      = "aurora-postgresql14"
  description = "Aurora PostgreSQL 14 parameter group for ${var.environment_suffix}"

  parameter {
    name  = "ssl"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "aurora-pg-${var.environment_suffix}"
  }
}

# Parameter group is applied directly in the main aurora cluster resource above

# Secrets Manager Secret for Aurora Credentials
resource "aws_secretsmanager_secret" "aurora_credentials" {
  name                    = "aurora-credentials-${var.environment_suffix}"
  description             = "Aurora PostgreSQL credentials for ${var.environment_suffix}"
  recovery_window_in_days = 0 # Allow immediate deletion for testing

  tags = {
    Name = "aurora-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    username = var.aurora_master_username
    password = var.aurora_master_password != null ? var.aurora_master_password : random_password.aurora_master_password.result
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    database = "paymentdb"
  })
}
