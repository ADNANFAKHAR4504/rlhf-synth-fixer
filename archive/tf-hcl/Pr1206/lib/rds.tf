# DB Subnet Group with unique name to avoid conflicts
resource "aws_db_subnet_group" "main" {
  name       = "${local.project_prefix}-db-subnet-group-${random_id.bucket_suffix.hex}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-db-subnet-group-${random_id.bucket_suffix.hex}"
  })
}

# RDS Aurora Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier          = "${local.project_prefix}-aurora-cluster"
  engine                      = "aurora-mysql"
  engine_version              = "8.0.mysql_aurora.3.07.0"
  database_name               = replace(local.project_prefix, "-", "")
  master_username             = "admin"
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  serverlessv2_scaling_configuration {
    max_capacity = 16
    min_capacity = 0.5
  }

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = local.common_tags
}

# RDS Aurora Serverless v2 Instance
resource "aws_rds_cluster_instance" "main" {
  count = 2

  identifier         = "${local.project_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  tags = local.common_tags
}

# RDS Monitoring IAM Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.project_prefix}-rds-monitoring-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}