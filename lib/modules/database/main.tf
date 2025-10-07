# DB Subnet Group
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-group-${var.region}"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS database"

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-sg-${var.region}"
  })
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption in ${var.region}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-kms-${var.region}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.environment}-rds-${var.region}"
  target_key_id = aws_kms_key.rds.key_id
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-mysql-params-${var.region}"
  family = "mysql8.0"

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "log_bin_trust_function_creators"
    value = "1"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-params-${var.region}"
  })
}

# Primary RDS Instance (Multi-AZ)
resource "aws_db_instance" "primary" {
  count = var.is_primary ? 1 : 0

  identifier     = "${var.environment}-mysql-primary"
  engine         = "mysql"
  engine_version = "8.0.42"

  instance_class    = var.instance_class
  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = "webapp"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  deletion_protection = false # Disabled for testing
  skip_final_snapshot = true  # Skip snapshot to avoid cleanup issues

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-primary"
    Type = "Primary"
  })
}

# Read Replica in Secondary Region
resource "aws_db_instance" "replica" {
  count = var.is_primary ? 0 : 1

  identifier          = "${var.environment}-mysql-replica"
  replicate_source_db = var.source_db_arn

  instance_class = var.instance_class

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.rds.arn
  publicly_accessible        = false
  auto_minor_version_upgrade = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-replica"
    Type = "Replica"
  })
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-rds-high-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.database_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.environment}-rds-low-storage-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [aws_sns_topic.database_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
  }

  tags = var.tags
}

# SNS Topic for Database Alerts
resource "aws_sns_topic" "database_alerts" {
  name = "${var.environment}-database-alerts-${var.region}"

  tags = merge(var.tags, {
    Name = "${var.environment}-database-alerts-${var.region}"
  })
}
