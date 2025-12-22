# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id    = "dms-replication-${var.environment_suffix}"
  replication_instance_class = "dms.t3.medium"
  allocated_storage          = 100

  engine_version              = "3.5.2"
  multi_az                    = true
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]

  auto_minor_version_upgrade = true
  apply_immediately          = false

  tags = {
    Name = "dms-replication-${var.environment_suffix}"
  }
}

# DMS Source Endpoint (On-Premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name   = var.dms_source_endpoint
  port          = 5432
  database_name = var.dms_source_db_name
  username      = jsondecode(aws_secretsmanager_secret_version.dms_source_credentials.secret_string)["username"]
  password      = jsondecode(aws_secretsmanager_secret_version.dms_source_credentials.secret_string)["password"]

  ssl_mode = "require"

  tags = {
    Name = "dms-source-${var.environment_suffix}"
  }
}

# DMS Target Endpoint (Aurora)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"

  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = var.db_master_username
  password      = random_password.db_password.result

  ssl_mode = "require"

  tags = {
    Name = "dms-target-${var.environment_suffix}"
  }
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id = "dms-task-${var.environment_suffix}"
  migration_type      = "full-load-and-cdc"

  replication_instance_arn = aws_dms_replication_instance.main.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target.endpoint_arn

  table_mappings = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
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
      TargetSchema       = ""
      SupportLobs        = true
      FullLobMode        = false
      LobChunkSize       = 64
      LimitedSizeLobMode = true
      LobMaxSize         = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode = "DROP_AND_CREATE"
      MaxFullLoadSubTasks = 8
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id       = "TRANSFORMATION"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id       = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_INFO"
        },
        {
          Id       = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_INFO"
        }
      ]
    }
    ControlTablesSettings = {
      ControlSchema               = "dms_control"
      HistoryTimeslotInMinutes    = 5
      HistoryTableEnabled         = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled          = true
    }
    ChangeProcessingDdlHandlingPolicy = {
      HandleSourceTableDropped   = true
      HandleSourceTableTruncated = true
      HandleSourceTableAltered   = true
    }
  })

  tags = {
    Name = "dms-task-${var.environment_suffix}"
  }
}