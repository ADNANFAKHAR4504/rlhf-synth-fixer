# main.tf - Aurora Serverless MySQL cluster configuration

locals {
  # Common tags to be applied to all resources
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Purpose     = "Gaming Platform Database"
    }
  )

  # Database parameter group settings optimized for gaming workloads
  db_parameters = {
    max_connections         = "16000" # High connection count for concurrent players
    innodb_buffer_pool_size = "{DBInstanceClassMemory*3/4}"
    slow_query_log          = "1"
    long_query_time         = "0.5"
  }
}

# DB Subnet Group for Aurora cluster
resource "aws_db_subnet_group" "aurora" {
  name        = "${var.project_name}-${var.environment_suffix}-aurora-subnet-group"
  description = "Subnet group for Aurora Serverless cluster"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-subnet-group"
    }
  )
}

# Aurora Serverless v2 cluster for better scaling capabilities
resource "aws_rds_cluster" "aurora_serverless" {
  cluster_identifier = "${var.project_name}-${var.environment_suffix}-aurora-cluster"

  # Engine configuration
  engine          = "aurora-mysql"
  engine_mode     = "provisioned" # v2 uses provisioned mode with serverless scaling
  engine_version  = var.aurora_mysql_version
  database_name   = var.database_name
  master_username = "admin"
  
  # Use AWS Secrets Manager for secure credential management
  # RDS will automatically create and manage the secret with naming convention: rds-db-credentials/cluster-<cluster-identifier>/<random-suffix>
  # When manage_master_user_password is true, you CANNOT specify master_password
  manage_master_user_password   = true
  master_user_secret_kms_key_id = aws_kms_key.aurora.key_id

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  # Backup configuration
  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = var.backup_window
  preferred_maintenance_window = var.maintenance_window
  copy_tags_to_snapshot        = true

  # Initial backup configuration - Secrets Manager will manage the password
  final_snapshot_identifier = "${var.project_name}-${var.environment_suffix}-final-snapshot"

  # High availability (limit to 3 AZs for Aurora)
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  # Parameter group association
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  # Enable backtrack for gaming scenarios where rollback might be needed (disabled for multi-region compatibility)
  # backtrack_window = var.backtrack_window_hours

  # Performance Insights for monitoring
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Deletion protection disabled for testing environments
  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-cluster"
    }
  )
}

# Aurora Serverless v2 instance
resource "aws_rds_cluster_instance" "aurora_instance" {
  count = var.aurora_instance_count

  identifier         = "${var.project_name}-${var.environment_suffix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora_serverless.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora_serverless.engine
  engine_version     = aws_rds_cluster.aurora_serverless.engine_version

  # Performance monitoring (disabled for db.serverless instance class)
  # Performance Insights is not supported on db.serverless instances
  performance_insights_enabled = false

  # Enhanced monitoring for gaming workloads
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-instance-${count.index + 1}"
    }
  )

  depends_on = [aws_rds_cluster.aurora_serverless]
}

# Parameter group for Aurora MySQL optimized for gaming
resource "aws_rds_cluster_parameter_group" "aurora" {
  family      = "aurora-mysql8.0"
  name        = "${var.project_name}-${var.environment_suffix}-aurora-params"
  description = "Aurora parameter group optimized for gaming workloads"

  dynamic "parameter" {
    for_each = local.db_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-params"
    }
  )
}