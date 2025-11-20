# dms.tf - AWS Database Migration Service configuration

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private[*].id

  tags = {
    Name           = "dms-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id     = "dms-instance-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 100
  engine_version              = "3.5.3"
  multi_az                    = false
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  vpc_security_group_ids      = [aws_security_group.dms.id]
  kms_key_arn                 = aws_kms_key.main.arn

  tags = {
    Name           = "dms-instance-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dms_vpc,
    aws_iam_role_policy_attachment.dms_cloudwatch
  ]
}

# DMS Source Endpoint (Oracle on-premises)
resource "aws_dms_endpoint" "source" {
  endpoint_id                 = "source-oracle-${var.environment_suffix}"
  endpoint_type               = "source"
  engine_name                 = "oracle"
  server_name                 = var.source_db_server
  port                        = 1521
  database_name               = var.source_db_name
  username                    = var.source_db_username
  password                    = var.source_db_password
  ssl_mode                    = "none"
  extra_connection_attributes = "useLogminerReader=N;useBfile=Y"

  tags = {
    Name           = "dms-source-endpoint-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "target-aurora-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = var.db_master_username
  password      = var.db_master_password
  ssl_mode      = "require"

  tags = {
    Name           = "dms-target-endpoint-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }

  depends_on = [aws_rds_cluster_instance.main]
}

# DMS Replication Task
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
        rule-name = "1"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })

  replication_task_settings = jsonencode({
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
  })

  tags = {
    Name           = "dms-replication-task-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}
