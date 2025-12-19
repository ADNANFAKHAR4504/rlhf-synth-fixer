# rds.tf - Aurora PostgreSQL Multi-AZ Cluster

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "payment-aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "payment-aurora-subnet-group-${var.environment_suffix}"
  }
}

# Aurora Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "payment-aurora-cluster-pg-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL 15 cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "payment-aurora-cluster-pg-${var.environment_suffix}"
  }
}

# DB Parameter Group for instances
resource "aws_db_parameter_group" "aurora" {
  name        = "payment-aurora-instance-pg-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL 15 instance parameter group"

  tags = {
    Name = "payment-aurora-instance-pg-${var.environment_suffix}"
  }
}

# Random password for Aurora master user
resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

# Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "payment-aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_version         = "15.4"
  database_name          = "payments"
  master_username        = "postgres"
  master_password        = random_password.aurora_master.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Multi-AZ configuration
  availability_zones = [
    data.aws_availability_zones.available.names[0],
    data.aws_availability_zones.available.names[1],
    data.aws_availability_zones.available.names[2]
  ]

  # Backup configuration - automated backups every 6 hours with 7-day retention
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Encryption at rest using KMS
  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  # Required for CI/CD - allows clean deletion
  skip_final_snapshot = true
  deletion_protection = false

  # Cluster parameter group
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  # Enable enhanced monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "payment-aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Writer Instance
resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier              = "payment-aurora-writer-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.aurora.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = aws_rds_cluster.aurora.engine_version
  db_parameter_group_name = aws_db_parameter_group.aurora.name

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance insights
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.aurora.arn

  tags = {
    Name = "payment-aurora-writer-${var.environment_suffix}"
    Role = "writer"
  }
}

# Aurora Reader Instance 1
resource "aws_rds_cluster_instance" "aurora_reader_1" {
  identifier              = "payment-aurora-reader-1-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.aurora.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = aws_rds_cluster.aurora.engine_version
  db_parameter_group_name = aws_db_parameter_group.aurora.name

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance insights
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.aurora.arn

  tags = {
    Name = "payment-aurora-reader-1-${var.environment_suffix}"
    Role = "reader"
  }
}

# Aurora Reader Instance 2
resource "aws_rds_cluster_instance" "aurora_reader_2" {
  identifier              = "payment-aurora-reader-2-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.aurora.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.aurora.engine
  engine_version          = aws_rds_cluster.aurora.engine_version
  db_parameter_group_name = aws_db_parameter_group.aurora.name

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance insights
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.aurora.arn

  tags = {
    Name = "payment-aurora-reader-2-${var.environment_suffix}"
    Role = "reader"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "payment-rds-monitoring-role-${var.environment_suffix}"

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
    Name = "payment-rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store Aurora credentials in Secrets Manager
resource "aws_secretsmanager_secret" "aurora_credentials" {
  name                    = "payment-aurora-credentials-${var.environment_suffix}"
  description             = "Aurora PostgreSQL master credentials"
  recovery_window_in_days = 0

  tags = {
    Name = "payment-aurora-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  secret_id = aws_secretsmanager_secret.aurora_credentials.id
  secret_string = jsonencode({
    username = aws_rds_cluster.aurora.master_username
    password = random_password.aurora_master.result
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.aurora.database_name
  })
}

# Random password provider configuration added to provider.tf
