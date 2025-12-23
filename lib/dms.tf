# AWS DMS for Database Migration
# Continuous replication from on-premises PostgreSQL to Aurora PostgreSQL

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS subnet group for database migration"
  subnet_ids                           = aws_subnet.private[*].id

  tags = {
    Name           = "dms-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# IAM Role for DMS
resource "aws_iam_role" "dms" {
  name = "dms-role-${var.environment_suffix}"

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
    Name           = "dms-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

resource "aws_iam_role_policy" "dms_cloudwatch" {
  name = "dms-cloudwatch-policy-${var.environment_suffix}"
  role = aws_iam_role.dms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.dms.arn}:*"
      }
    ]
  })
}

# CloudWatch Log Group for DMS
resource "aws_cloudwatch_log_group" "dms" {
  name              = "/aws/dms/${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name           = "dms-logs-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id     = "dms-replication-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 100
  apply_immediately           = true
  auto_minor_version_upgrade  = true
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]

  tags = {
    Name           = "dms-replication-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }

  depends_on = [aws_iam_role_policy.dms_cloudwatch]
}

# DMS Source Endpoint - On-premises PostgreSQL
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "source-onprem-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"
  server_name   = var.dms_source_server
  port          = 5432
  database_name = var.dms_source_database
  username      = var.dms_source_username
  password      = var.dms_source_password
  ssl_mode      = "require"

  tags = {
    Name           = "dms-source-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# DMS Target Endpoint - Aurora PostgreSQL
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = aws_rds_cluster.main.master_username
  password      = random_password.db_password.result
  ssl_mode      = "require"

  tags = {
    Name           = "dms-target-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# DMS Replication Task - Continuous replication
resource "aws_dms_replication_task" "main" {
  replication_task_id      = "dms-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn
  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "include-all-tables"
        object-locator = {
          schema-name = "public"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
    TargetMetadata = {
      TargetSchema        = ""
      SupportLobs         = true
      FullLobMode         = false
      LobChunkSize        = 64
      LimitedSizeLobMode  = true
      LobMaxSize          = 32
      InlineLobMaxSize    = 0
      LoadMaxFileSize     = 0
      ParallelLoadThreads = 0
      BatchApplyEnabled   = false
    }
    FullLoadSettings = {
      TargetTablePrepMode             = "DROP_AND_CREATE"
      CreatePkAfterFullLoad           = false
      StopTaskCachedChangesApplied    = false
      StopTaskCachedChangesNotApplied = false
      MaxFullLoadSubTasks             = 8
      TransactionConsistencyTimeout   = 600
      CommitRate                      = 10000
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "SOURCE_UNLOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "TARGET_LOAD"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        }
      ]
      CloudWatchLogGroup  = aws_cloudwatch_log_group.dms.name
      CloudWatchLogStream = "dms-task-${var.environment_suffix}"
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
    ControlTablesSettings = {
      historyTimeslotInMinutes    = 5
      ControlSchema               = ""
      HistoryTableEnabled         = false
      SuspendedTablesTableEnabled = false
      StatusTableEnabled          = false
    }
  })

  start_replication_task = false

  tags = {
    Name           = "dms-task-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }

  depends_on = [
    aws_dms_replication_instance.main,
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}

# CloudWatch Alarm for DMS Replication Lag
resource "aws_cloudwatch_metric_alarm" "dms_replication_lag" {
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencyTarget"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "DMS replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]
  ok_actions          = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }

  tags = {
    Name           = "dms-lag-alarm-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}
