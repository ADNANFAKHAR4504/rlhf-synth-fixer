# Systems Manager Parameter Store for database credentials
resource "aws_ssm_parameter" "db_master_username" {
  name        = "/payment-migration/${var.environment_suffix}/db/master-username"
  description = "RDS Aurora master username"
  type        = "String"
  value       = var.db_master_username

  tags = merge(
    local.common_tags,
    {
      Name = "db-master-username-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "db_master_password" {
  name        = "/payment-migration/${var.environment_suffix}/db/master-password"
  description = "RDS Aurora master password"
  type        = "SecureString"
  value       = var.db_master_password

  tags = merge(
    local.common_tags,
    {
      Name = "db-master-password-${var.environment_suffix}"
    }
  )
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name        = "aurora-subnet-group-${var.environment_suffix}"
  description = "Subnet group for Aurora cluster"
  subnet_ids  = aws_subnet.private_db[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-subnet-group-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "payment" {
  cluster_identifier              = "payment-cluster-${var.environment_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  engine_mode                     = "provisioned"
  database_name                   = "paymentdb"
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = local.current_env.db_backup_retention
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  storage_encrypted               = true
  deletion_protection             = false
  skip_final_snapshot             = true

  serverlessv2_scaling_configuration {
    max_capacity = 16.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name = "payment-cluster-${var.environment_suffix}"
    }
  )
}

# Aurora Cluster Instances (Writer)
resource "aws_rds_cluster_instance" "payment_writer" {
  identifier                   = "payment-writer-${var.environment_suffix}"
  cluster_identifier           = aws_rds_cluster.payment.id
  instance_class               = local.current_env.db_instance_class
  engine                       = aws_rds_cluster.payment.engine
  engine_version               = aws_rds_cluster.payment.engine_version
  publicly_accessible          = false
  db_subnet_group_name         = aws_db_subnet_group.aurora.name
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "payment-writer-${var.environment_suffix}"
      Role = "writer"
    }
  )
}

# Aurora Cluster Instances (Readers)
resource "aws_rds_cluster_instance" "payment_reader" {
  count = 2

  identifier                   = "payment-reader-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier           = aws_rds_cluster.payment.id
  instance_class               = local.current_env.db_instance_class
  engine                       = aws_rds_cluster.payment.engine
  engine_version               = aws_rds_cluster.payment.engine_version
  publicly_accessible          = false
  db_subnet_group_name         = aws_db_subnet_group.aurora.name
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = merge(
    local.common_tags,
    {
      Name = "payment-reader-${var.environment_suffix}-${count.index + 1}"
      Role = "reader"
    }
  )
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

  tags = merge(
    local.common_tags,
    {
      Name = "rds-monitoring-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store Aurora endpoints in Parameter Store
resource "aws_ssm_parameter" "aurora_writer_endpoint" {
  name        = "/payment-migration/${var.environment_suffix}/db/writer-endpoint"
  description = "Aurora cluster writer endpoint"
  type        = "String"
  value       = aws_rds_cluster.payment.endpoint

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-writer-endpoint-${var.environment_suffix}"
    }
  )
}

resource "aws_ssm_parameter" "aurora_reader_endpoint" {
  name        = "/payment-migration/${var.environment_suffix}/db/reader-endpoint"
  description = "Aurora cluster reader endpoint"
  type        = "String"
  value       = aws_rds_cluster.payment.reader_endpoint

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-reader-endpoint-${var.environment_suffix}"
    }
  )
}