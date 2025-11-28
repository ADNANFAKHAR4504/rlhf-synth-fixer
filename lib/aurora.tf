# aurora.tf

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  }
}

# Random password for Aurora master user
resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "aurora_master_password" {
  name_prefix             = "aurora-master-${var.environment_suffix}-"
  description             = "Aurora master password"
  kms_key_id              = aws_kms_key.main.id
  recovery_window_in_days = 0

  tags = {
    Name = "aurora-master-password-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "aurora_master_password" {
  secret_id = aws_secretsmanager_secret.aurora_master_password.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.aurora_master.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
  })
}

# Aurora PostgreSQL Cluster (Serverless v2)
resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = "loanprocessing"
  master_username        = var.db_master_username
  master_password        = random_password.aurora_master.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    min_capacity = var.aurora_min_capacity
    max_capacity = var.aurora_max_capacity
  }

  # Backup configuration
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Enable point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  # IAM database authentication
  iam_database_authentication_enabled = true

  # Deletion protection disabled for testing (destroyable)
  deletion_protection = false
  skip_final_snapshot = true

  # Apply changes immediately for testing
  apply_immediately = true

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Cluster Instance (Serverless v2)
resource "aws_rds_cluster_instance" "aurora" {
  count              = 2
  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.main.arn
  performance_insights_retention_period = 7

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "rds-monitoring-${var.environment_suffix}-"

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

  tags = {
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
