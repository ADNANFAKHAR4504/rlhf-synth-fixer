# KMS Keys for Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS Aurora encryption - ${var.environment_suffix}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "rds-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-aurora-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption - ${var.environment_suffix}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "s3-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-migration-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3.key_id
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "migration-vpc-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "migration-igw-${var.environment_suffix}"
  }
}

# Public Subnets (for NAT Gateway and DMS)
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "migration-public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets (for RDS Aurora)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "migration-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "migration-public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "aurora" {
  name_prefix = "aurora-sg-${var.environment_suffix}-"
  description = "Security group for Aurora PostgreSQL cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from DMS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.dms.id]
  }

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "aurora-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "dms" {
  name_prefix = "dms-sg-${var.environment_suffix}-"
  description = "Security group for DMS replication instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from on-premises"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to on-premises IP ranges in production
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dms-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for DMS
resource "aws_iam_role" "dms_vpc_role" {
  name = "dms-vpc-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "dms-vpc-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "dms_vpc_role" {
  role       = aws_iam_role.dms_vpc_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

resource "aws_iam_role" "dms_cloudwatch_role" {
  name = "dms-cloudwatch-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "dms-cloudwatch-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch_role" {
  role       = aws_iam_role.dms_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}

# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  }
}

# Aurora Parameter Group (PostgreSQL 13.x compatible)
resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "aurora-pg13-params-${var.environment_suffix}"
  family      = "aurora-postgresql13"
  description = "Custom parameter group for Aurora PostgreSQL 13 - ${var.environment_suffix}"

  # Parameters matching PostgreSQL 13.x configuration
  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements,pg_hint_plan"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "aurora-pg13-params-${var.environment_suffix}"
  }
}

resource "aws_db_parameter_group" "aurora_instance" {
  name        = "aurora-instance-params-${var.environment_suffix}"
  family      = "aurora-postgresql13"
  description = "Instance parameter group for Aurora PostgreSQL 13 - ${var.environment_suffix}"

  tags = {
    Name = "aurora-instance-params-${var.environment_suffix}"
  }
}

# Aurora Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = var.aurora_engine_version
  database_name                   = var.aurora_database_name
  master_username                 = var.aurora_master_username
  master_password                 = var.aurora_master_password
  db_subnet_group_name            = aws_db_subnet_group.aurora.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  vpc_security_group_ids          = [aws_security_group.aurora.id]

  # Multi-AZ and High Availability
  availability_zones = var.availability_zones

  # Backup Configuration
  backup_retention_period      = var.aurora_backup_retention_period
  preferred_backup_window      = var.aurora_preferred_backup_window
  preferred_maintenance_window = var.aurora_preferred_maintenance_window

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  # Deletion Protection - DISABLED for destroyability
  deletion_protection = false
  skip_final_snapshot = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

# Aurora Cluster Instances
resource "aws_rds_cluster_instance" "aurora" {
  count              = var.aurora_instance_count
  identifier         = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  db_parameter_group_name = aws_db_parameter_group.aurora_instance.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

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

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group - ${var.environment_suffix}"
  subnet_ids                           = aws_subnet.public[*].id

  tags = {
    Name = "dms-subnet-group-${var.environment_suffix}"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id     = "dms-instance-${var.environment_suffix}"
  replication_instance_class  = var.dms_replication_instance_class
  allocated_storage           = var.dms_allocated_storage
  vpc_security_group_ids      = [aws_security_group.dms.id]
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  publicly_accessible         = false
  multi_az                    = true
  engine_version              = "3.4.7"
  auto_minor_version_upgrade  = false
  allow_major_version_upgrade = false
  apply_immediately           = true

  tags = {
    Name = "dms-instance-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc_role,
    aws_iam_role_policy_attachment.dms_cloudwatch_role
  ]
}

# DMS Source Endpoint (On-premises PostgreSQL)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "source-endpoint-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name   = var.dms_source_endpoint_host
  port          = var.dms_source_endpoint_port
  database_name = var.dms_source_database_name
  username      = var.dms_source_username
  password      = var.dms_source_password

  ssl_mode = "require"

  tags = {
    Name = "source-endpoint-${var.environment_suffix}"
  }
}

# DMS Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-endpoint-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"

  server_name   = aws_rds_cluster.aurora.endpoint
  port          = 5432
  database_name = var.aurora_database_name
  username      = var.aurora_master_username
  password      = var.aurora_master_password

  ssl_mode = "require"

  tags = {
    Name = "target-endpoint-${var.environment_suffix}"
  }

  depends_on = [aws_rds_cluster.aurora]
}

# DMS Replication Task (Full Load + CDC)
resource "aws_dms_replication_task" "main" {
  replication_task_id      = "migration-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn
  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "migrate-all-tables"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    TargetMetadata = {
      SupportLobs        = true
      FullLobMode        = false
      LobChunkSize       = 64
      LimitedSizeLobMode = true
      LobMaxSize         = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode             = "DO_NOTHING"
      CreatePkAfterFullLoad           = false
      StopTaskCachedChangesApplied    = false
      StopTaskCachedChangesNotApplied = false
      MaxFullLoadSubTasks             = 8
      TransactionConsistencyTimeout   = 600
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped   = true
      HandleSourceTableTruncated = true
      HandleSourceTableAltered   = true
    }
    ErrorBehavior = {
      DataErrorPolicy               = "LOG_ERROR"
      EventErrorPolicy              = "IGNORE"
      DataTruncationErrorPolicy     = "LOG_ERROR"
      DataErrorEscalationPolicy     = "SUSPEND_TABLE"
      DataErrorEscalationCount      = 50
      TableErrorPolicy              = "SUSPEND_TABLE"
      TableErrorEscalationPolicy    = "STOP_TASK"
      TableErrorEscalationCount     = 50
      RecoverableErrorCount         = -1
      RecoverableErrorInterval      = 5
      RecoverableErrorThrottling    = true
      RecoverableErrorThrottlingMax = 1800
      ApplyErrorDeletePolicy        = "IGNORE_RECORD"
      ApplyErrorInsertPolicy        = "LOG_ERROR"
      ApplyErrorUpdatePolicy        = "LOG_ERROR"
      ApplyErrorEscalationPolicy    = "LOG_ERROR"
      ApplyErrorEscalationCount     = 0
      FullLoadIgnoreConflicts       = true
    }
    ChangeProcessingTuning = {
      BatchApplyPreserveTransaction = true
      BatchApplyTimeoutMin          = 1
      BatchApplyTimeoutMax          = 30
      BatchApplyMemoryLimit         = 500
      BatchSplitSize                = 0
      MinTransactionSize            = 1000
      CommitTimeout                 = 1
      MemoryLimitTotal              = 1024
      MemoryKeepTime                = 60
      StatementCacheSize            = 50
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "SOURCE_UNLOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_LOAD"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_INFO"
        }
      ]
    }
  })

  tags = {
    Name = "migration-task-${var.environment_suffix}"
  }

  depends_on = [
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}

# S3 Bucket for File Migration
resource "aws_s3_bucket" "migration" {
  bucket = "inventory-migration-${var.environment_suffix}"

  tags = {
    Name = "inventory-migration-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "migration" {
  bucket = aws_s3_bucket.migration.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "migration" {
  bucket = aws_s3_bucket.migration.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "migration" {
  bucket = aws_s3_bucket.migration.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.s3_lifecycle_ia_transition_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.s3_lifecycle_glacier_transition_days
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = var.s3_lifecycle_ia_transition_days
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = var.s3_lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "migration" {
  bucket = aws_s3_bucket.migration.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SNS Topic for Notifications
resource "aws_sns_topic" "migration_alerts" {
  name              = "migration-alerts-${var.environment_suffix}"
  display_name      = "Database Migration Alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = {
    Name = "migration-alerts-${var.environment_suffix}"
  }
}

resource "aws_sns_topic_subscription" "migration_email" {
  count     = length(var.alarm_email_endpoints)
  topic_arn = aws_sns_topic.migration_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CDCLatencyTarget"
  namespace           = "AWS/DMS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_replication_lag_threshold
  alarm_description   = "DMS replication lag exceeds ${var.alarm_replication_lag_threshold} seconds"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }

  tags = {
    Name = "dms-replication-lag-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "aurora-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "Aurora CPU utilization exceeds ${var.alarm_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-cpu-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_connections" {
  alarm_name          = "aurora-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "450"
  alarm_description   = "Aurora database connections approaching limit"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-connections-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_storage" {
  alarm_name          = "aurora-storage-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "VolumeBytesUsed"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "644245094400" # 600 GB in bytes
  alarm_description   = "Aurora storage usage exceeds 600 GB"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name = "aurora-storage-${var.environment_suffix}"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencyTarget", { "stat" : "Average" }],
            [".", "CDCLatencySource", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DMS Replication Lag"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "FullLoadThroughputRowsTarget", { "stat" : "Average" }],
            [".", "FullLoadThroughputBandwidthTarget", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DMS Full Load Throughput"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { "stat" : "Average", "label" : "Aurora CPU" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora CPU Utilization"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Database Connections"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "VolumeBytesUsed", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Storage Usage"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "WriteLatency", { "stat" : "Average" }],
            [".", "ReadLatency", { "stat" : "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Aurora Read/Write Latency"
          period  = 300
        }
      }
    ]
  })
}
