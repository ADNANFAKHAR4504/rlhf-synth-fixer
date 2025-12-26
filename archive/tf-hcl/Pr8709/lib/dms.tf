# dms.tf - AWS Database Migration Service configuration

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  count = var.enable_dms ? 1 : 0

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
  count = var.enable_dms ? 1 : 0

  replication_instance_id     = "dms-instance-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 100
  engine_version              = "3.5.3"
  multi_az                    = var.enable_multi_az_dms
  publicly_accessible         = false
  replication_subnet_group_id = aws_dms_replication_subnet_group.main[0].id
  vpc_security_group_ids      = [aws_security_group.dms[0].id]

  kms_key_arn = aws_kms_key.main.arn

  auto_minor_version_upgrade = true

  tags = {
    Name           = "dms-instance-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Source Endpoint (Oracle)
resource "aws_dms_endpoint" "source" {
  count = var.enable_dms ? 1 : 0

  endpoint_id   = "source-oracle-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "oracle"

  server_name   = var.source_db_host
  port          = var.source_db_port
  database_name = var.source_db_name
  username      = var.source_db_username
  password      = random_password.source_db_password[0].result # ✅ Use generated password

  ssl_mode = "require"

  extra_connection_attributes = "useLogminerReader=N;useBfile=Y"

  kms_key_arn = aws_kms_key.main.arn

  tags = {
    Name           = "source-oracle-endpoint-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Target Endpoint (Aurora PostgreSQL)
resource "aws_dms_endpoint" "target" {
  count = var.enable_dms ? 1 : 0

  endpoint_id   = "target-postgres-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"

  server_name   = aws_rds_cluster.main.endpoint
  port          = 5432
  database_name = aws_rds_cluster.main.database_name
  username      = var.db_master_username
  password      = random_password.db_master_password.result # ✅ Use generated password

  ssl_mode = "require"

  kms_key_arn = aws_kms_key.main.arn

  tags = {
    Name           = "target-postgres-endpoint-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  count = var.enable_dms ? 1 : 0

  replication_task_id      = "oracle-to-postgres-${var.environment_suffix}"
  source_endpoint_arn      = aws_dms_endpoint.source[0].endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target[0].endpoint_arn
  replication_instance_arn = aws_dms_replication_instance.main[0].replication_instance_arn
  migration_type           = "full-load-and-cdc"

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
    TargetMetadata = {
      TargetSchema = ""
      SupportLobs  = true
      LobMaxSize   = 32
    }
    FullLoadSettings = {
      TargetTablePrepMode = "DO_NOTHING"
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
        }
      ]
    }
  })

  start_replication_task = false

  tags = {
    Name           = "oracle-postgres-replication-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}
