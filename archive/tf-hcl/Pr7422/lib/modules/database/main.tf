# DB subnet group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.resource_prefix}-db-subnet-"
  subnet_ids  = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-db-subnet-group"
    }
  )
}

# Random password for RDS
resource "random_password" "db_master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.resource_prefix}/db/master-password"
  description = "Master password for RDS Aurora cluster"
  type        = "SecureString"
  value       = random_password.db_master.result

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-db-master-password"
    }
  )
}

# RDS Aurora cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.resource_prefix}-aurora-cluster"
  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.04.0"
  database_name      = "finservdb"
  master_username    = "admin"
  master_password    = random_password.db_master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_security_group_id]

  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]

  storage_encrypted = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-aurora-cluster"
    }
  )

  lifecycle {
    ignore_changes = [master_password]
  }
}

# RDS Aurora cluster instances using for_each
resource "aws_rds_cluster_instance" "main" {
  for_each = toset(["primary", "replica"])

  identifier         = "${var.resource_prefix}-aurora-${each.key}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  publicly_accessible = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-aurora-${each.key}"
      Role = each.key
    }
  )

  depends_on = [aws_rds_cluster.main]
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.resource_prefix}-rds-mon-"

  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume_role.json

  tags = merge(
    var.common_tags,
    {
      Name = "${var.resource_prefix}-rds-monitoring-role"
    }
  )
}

# IAM policy document for RDS monitoring assume role
data "aws_iam_policy_document" "rds_monitoring_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Attach AWS managed policy for RDS enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch alarms for database
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.resource_prefix}-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when database CPU exceeds 80%"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.resource_prefix}-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Triggers when database connections exceed 100"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  tags = var.common_tags
}
