# Remove the problematic data sources - we'll use a direct version approach

# Random password generation when not provided
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 16
  special = true
  
  # Ensure password meets MySQL requirements
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1
  
  # Exclude problematic characters for MySQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store database credentials in Parameter Store
resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.name_prefix}/database/username"
  type  = "SecureString"
  value = var.db_username

  tags = var.tags
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.name_prefix}/database/password"
  type  = "SecureString"
  value = var.db_password != null ? var.db_password : random_password.db_password[0].result

  tags = var.tags
}

# RDS Subnet Group (if not passed from networking module)
resource "aws_db_subnet_group" "main" {
  count      = var.db_subnet_group_name == null ? 1 : 0
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# RDS Parameter Group for MySQL optimization
resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "${var.name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "max_connections"
    value = var.instance_class == "db.t3.micro" ? "100" : "1000"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  parameter {
    name  = "innodb_log_buffer_size"
    value = "16777216"
  }

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Option Group
resource "aws_db_option_group" "main" {
  name                     = "${var.name_prefix}-db-options"
  option_group_description = "Option group for ${var.name_prefix}"
  engine_name              = "mysql"
  major_engine_version     = "8.0"

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-database"

  # Engine Configuration - Direct version specification
  engine         = "mysql"
  engine_version = var.engine_version
  instance_class = var.instance_class

  # Storage Configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_id

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password != null ? var.db_password : random_password.db_password[0].result

  # Network Configuration
  db_subnet_group_name   = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.main[0].name
  vpc_security_group_ids = var.vpc_security_group_ids
  publicly_accessible    = false
  port                   = 3306

  # High Availability & Backup
  multi_az                = var.multi_az
  backup_retention_period = var.backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Deletion Protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot      = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance Insights (not available for t3.micro)
  performance_insights_enabled          = var.instance_class != "db.t3.micro" ? true : false
  performance_insights_retention_period = var.instance_class != "db.t3.micro" ? 7 : null

  # Parameter and Option Groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Enhanced Monitoring (not available for t3.micro)
  monitoring_interval = var.instance_class != "db.t3.micro" ? 60 : 0
  monitoring_role_arn = var.instance_class != "db.t3.micro" ? aws_iam_role.rds_monitoring[0].arn : null

  # Enable automated backups
  copy_tags_to_snapshot = true

  # Auto minor version upgrade
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Enable logging
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
      final_snapshot_identifier,
    ]
  }

  depends_on = [
    aws_db_parameter_group.main,
    aws_db_option_group.main
  ]
}

# Enhanced Monitoring Role (only for non-micro instances)
resource "aws_iam_role" "rds_monitoring" {
  count = var.instance_class != "db.t3.micro" ? 1 : 0
  name  = "${var.name_prefix}-rds-monitoring-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.instance_class != "db.t3.micro" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms for Database Monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-database-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.name_prefix}-database-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = var.instance_class == "db.t3.micro" ? "80" : "800"
  alarm_description   = "This metric monitors RDS connection count"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_free_storage" {
  alarm_name          = "${var.name_prefix}-database-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_read_latency" {
  alarm_name          = "${var.name_prefix}-database-read-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS read latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_write_latency" {
  alarm_name          = "${var.name_prefix}-database-write-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS write latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}