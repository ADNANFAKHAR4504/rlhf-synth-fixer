# dms.tf - AWS Database Migration Service Configuration

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id    = "dms-replication-${var.environment_suffix}"
  replication_instance_class = var.dms_replication_instance_class
  allocated_storage          = 200
  # engine_version removed - will use latest available version
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.dms.id
  vpc_security_group_ids      = [aws_security_group.dms.id]
  auto_minor_version_upgrade  = true

  tags = {
    Name = "dms-replication-${var.environment_suffix}"
  }
}

# Source Endpoint (On-Premises PostgreSQL)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"
  server_name   = var.onprem_db_endpoint
  port          = var.onprem_db_port
  database_name = var.onprem_db_name
  username      = var.onprem_db_username
  password      = var.onprem_db_password
  ssl_mode      = "require"

  tags = {
    Name = "dms-source-${var.environment_suffix}"
  }
}

# Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  server_name   = aws_rds_cluster.aurora.endpoint
  port          = 5432
  database_name = "paymentdb"
  username      = var.aurora_master_username
  password      = var.aurora_master_password != null ? var.aurora_master_password : random_password.aurora_master_password.result
  ssl_mode      = "require"

  tags = {
    Name = "dms-target-${var.environment_suffix}"
  }

  depends_on = [aws_rds_cluster_instance.aurora_writer]
}

# DMS Replication Task - Full Load and CDC
resource "aws_dms_replication_task" "migration" {
  replication_task_id      = "dms-migration-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn
  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "select-all-tables"
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
      TargetSchema       = ""
      SupportLobs        = true
      FullLobMode        = false
      LobChunkSize       = 64
      LimitedSizeLobMode = true
      LobMaxSize         = 32
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
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped   = true
      HandleSourceTableTruncated = true
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
    ValidationSettings = {
      EnableValidation = true
      ThreadCount      = 5
      PartitionSize    = 10000
    }
  })

  start_replication_task = false

  tags = {
    Name = "dms-migration-task-${var.environment_suffix}"
  }
}

# CloudWatch Log Group for DMS
resource "aws_cloudwatch_log_group" "dms" {
  name              = "/aws/dms/${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "dms-logs-${var.environment_suffix}"
  }
}
