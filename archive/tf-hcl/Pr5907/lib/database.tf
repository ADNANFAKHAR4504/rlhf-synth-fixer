# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name           = "payment-rds-kms-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/payment-rds-${var.environment_suffix}"
  target_key_id = aws_kms_key.rds.key_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name           = "payment-db-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.10"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  deletion_protection             = false
  skip_final_snapshot             = true

  tags = {
    Name           = "payment-db-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  replication_subnet_group_id          = "payment-dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private_app[*].id

  tags = {
    Name           = "payment-dms-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  replication_instance_id    = "payment-dms-${var.environment_suffix}"
  replication_instance_class = "dms.c5.large"
  allocated_storage          = 100

  vpc_security_group_ids      = [aws_security_group.dms.id]
  replication_subnet_group_id = aws_dms_replication_subnet_group.main.id
  publicly_accessible         = false
  multi_az                    = false
  engine_version              = "3.5.4"

  tags = {
    Name           = "payment-dms-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Source Endpoint (On-premises database)
resource "aws_dms_endpoint" "source" {
  endpoint_id   = "payment-dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"

  server_name   = var.dms_source_endpoint_server
  port          = var.dms_source_endpoint_port
  username      = var.dms_source_endpoint_username
  password      = var.dms_source_endpoint_password
  database_name = var.dms_source_endpoint_database

  ssl_mode = "require"

  tags = {
    Name           = "payment-dms-source-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }
}

# DMS Target Endpoint (RDS)
resource "aws_dms_endpoint" "target" {
  endpoint_id   = "payment-dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "postgres"

  server_name   = aws_db_instance.main.address
  port          = aws_db_instance.main.port
  username      = var.db_username
  password      = random_password.db_password.result
  database_name = var.db_name

  ssl_mode = "require"

  tags = {
    Name           = "payment-dms-target-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [aws_db_instance.main]
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  replication_task_id      = "payment-dms-task-${var.environment_suffix}"
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
    }
  })

  tags = {
    Name           = "payment-dms-task-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Application    = "PaymentProcessing"
    MigrationPhase = "production"
  }

  depends_on = [
    aws_dms_endpoint.source,
    aws_dms_endpoint.target
  ]
}
