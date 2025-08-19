# Generate a secure random password
resource "random_password" "database" {
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store the password in AWS SSM Parameter Store
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.environment}/database/${var.region}/password"
  description = "Database password for ${var.environment} environment in ${var.region}"
  type        = "SecureString"
  value       = random_password.database.result

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-password-${var.region}"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-subnet-group-${var.region}"
  })
}

resource "aws_db_parameter_group" "main" {
  family = "postgres13"
  name   = "${var.environment}-db-params-${var.region}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-db-params-${var.region}"
  })
}

resource "aws_db_instance" "main" {
  count = var.is_primary ? 1 : 0

  identifier = "${var.environment}-postgres-${var.region}"

  engine         = "postgres"
  engine_version = "13.22"
  instance_class = var.db_instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.database_username
  password = random_password.database.result

  vpc_security_group_ids = [var.database_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment == "dev"
  deletion_protection = var.environment == "prod"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-postgres-${var.region}"
    Type = "Primary"
  })
}

resource "aws_db_instance" "read_replica" {
  count = var.is_primary ? 0 : 1

  identifier = "${var.environment}-postgres-replica-${var.region}"

  replicate_source_db = var.source_db_identifier
  instance_class      = var.db_instance_class

  vpc_security_group_ids = [var.database_security_group_id]

  skip_final_snapshot = var.environment == "dev"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-postgres-replica-${var.region}"
    Type = "ReadReplica"
  })
}
