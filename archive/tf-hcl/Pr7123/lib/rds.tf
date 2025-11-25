# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Exclude characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store database password in Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name        = "/${local.name_prefix}/database/password"
  description = "Database master password"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-password"
    }
  )
}

# Store database connection string in Parameter Store
resource "aws_ssm_parameter" "db_connection_string" {
  name        = "/${local.name_prefix}/database/connection-string"
  description = "Database connection string"
  type        = "SecureString"
  value = jsonencode({
    host     = aws_rds_cluster.main.endpoint
    port     = aws_rds_cluster.main.port
    database = var.db_name
    username = var.db_username
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-connection"
    }
  )

  depends_on = [aws_rds_cluster.main]
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-db-subnet-group"
    }
  )
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier           = "${local.name_prefix}-aurora-cluster"
  engine                       = "aurora-postgresql"
  engine_version               = "14.6"
  engine_mode                  = "provisioned"
  database_name                = var.db_name
  master_username              = var.db_username
  master_password              = random_password.db_password.result
  backup_retention_period      = var.db_backup_retention_period
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  db_subnet_group_name         = aws_db_subnet_group.main.name
  vpc_security_group_ids       = [aws_security_group.rds.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  enabled_cloudwatch_logs_exports = ["postgresql"]

  skip_final_snapshot       = true
  final_snapshot_identifier = null

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-cluster"
    }
  )
}

# RDS Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count              = 2 # Create 2 instances for HA
  identifier         = "${local.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-aurora-instance-${count.index + 1}"
    }
  )
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-kms-key"
    }
  )
}

# KMS Key Alias
resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${local.name_prefix}-rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-monitoring-role"
    }
  )
}

# Attach AWS managed policy for RDS monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
