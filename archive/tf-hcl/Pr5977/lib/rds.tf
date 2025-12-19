# RDS Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment}-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.13"
  database_name                   = "payments"
  master_username                 = "dbadmin"
  master_password                 = random_password.db_password.result
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = var.environment == "prod" ? 30 : 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.rds.arn
  skip_final_snapshot             = true
  final_snapshot_identifier       = null
  apply_immediately               = true

  serverlessv2_scaling_configuration {
    max_capacity = var.environment == "prod" ? 16.0 : 4.0
    min_capacity = 0.5
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cluster-${var.environment}-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Instance
resource "aws_rds_cluster_instance" "main" {
  count               = var.environment == "prod" ? 2 : 1
  identifier          = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = "db.serverless"
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  publicly_accessible = false

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-instance-${count.index + 1}-${var.environment}-${var.environment_suffix}"
    }
  )
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store DB password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "rds-password-${var.environment}-${var.environment_suffix}"
  description             = "RDS master password for ${var.environment} environment"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name = "rds-password-${var.environment}-${var.environment_suffix}"
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = random_password.db_password.result
    endpoint = aws_rds_cluster.main.endpoint
    database = aws_rds_cluster.main.database_name
  })
}