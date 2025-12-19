# RDS Module - Aurora Multi-AZ and Multi-Region Database

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.name_prefix}-aurora-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-subnet-group"
    }
  )
}

# Primary Aurora Cluster (Multi-AZ)
resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "${var.name_prefix}-aurora-cluster"
  engine                          = "aurora-mysql"
  engine_version                  = var.engine_version
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = var.master_password
  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = var.preferred_backup_window
  preferred_maintenance_window    = var.preferred_maintenance_window
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  vpc_security_group_ids          = [var.database_security_group_id]
  storage_encrypted               = true
  skip_final_snapshot             = var.skip_final_snapshot
  final_snapshot_identifier       = var.skip_final_snapshot ? null : "${var.name_prefix}-aurora-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  enabled_cloudwatch_logs_exports = ["error", "slowquery"]

  # Enable deletion protection for production
  deletion_protection = var.deletion_protection

  # Multi-AZ deployment through multiple instances
  availability_zones = var.availability_zones

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-cluster"
      Type = "primary"
    }
  )

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      availability_zones
    ]
  }
}

# Aurora Instances (Multi-AZ) - Primary Region
resource "aws_rds_cluster_instance" "primary" {
  count                = var.instance_count
  identifier           = "${var.name_prefix}-aurora-instance-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = var.instance_class
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.aurora.name

  # Performance Insights
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null

  # Enhanced monitoring
  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? var.monitoring_role_arn : null

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-aurora-instance-${count.index + 1}"
      Type = "primary"
    }
  )
}

# CloudWatch alarms for database monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-aurora-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when Aurora CPU exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-aurora-high-cpu-alarm"
      Severity = "high"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.name_prefix}-aurora-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_connections_threshold
  alarm_description   = "Alert when Aurora connections are high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-aurora-high-connections-alarm"
      Severity = "medium"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.name_prefix}-aurora-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000000000 # 1GB in bytes
  alarm_description   = "Alert when Aurora free memory is low"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.name_prefix}-aurora-low-storage-alarm"
      Severity = "high"
    }
  )
}

