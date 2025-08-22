# Generate a secure random password for RDS
# AWS RDS only allows printable ASCII characters besides '/', '@', '"', ' '
resource "random_password" "database" {
  length  = 32
  special = false # Disable special characters to avoid AWS RDS validation errors
  upper   = true
  lower   = true
  numeric = true
  # Only use alphanumeric characters to ensure AWS RDS compatibility

  # Add lifecycle rule to handle dependency cycles
  lifecycle {
    create_before_destroy = true
  }
}

# Validate password meets AWS RDS requirements
locals {
  # AWS RDS password requirements:
  # - Must be 8-41 characters long
  # - Can contain any printable ASCII character except '/', '@', '"', ' '
  # - Our password is 32 characters and only uses alphanumeric characters
  password_length = length(random_password.database.result)

  # Ensure password meets minimum length requirement
  password_valid = local.password_length >= 8 && local.password_length <= 41
}

# Store the password in AWS SSM Parameter Store
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.environment}/database/${var.region}/password-${var.common_tags.UniqueSuffix}"
  description = "Database password for ${var.environment} environment in ${var.region}"
  type        = "SecureString"
  value       = random_password.database.result

  tags = merge(var.common_tags, {
    Name = "db-password-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }

  # Explicitly depend on the random password to break the cycle
  depends_on = [random_password.database]
}

resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "db-subnet-group-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "db-params-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(var.common_tags, {
    Name = "db-params-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_db_instance" "main" {
  count = var.is_primary ? 1 : 0

  identifier = "postgres-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"

  engine         = "postgres"
  engine_version = "15.14"
  instance_class = var.db_instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_encrypted     = true
  kms_key_id            = var.kms_key_id != "" ? var.kms_key_id : null

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
    Name = "postgres-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
    Type = "Primary"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_db_instance" "read_replica" {
  count = var.is_primary ? 0 : 1

  identifier = "postgres-replica-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"

  replicate_source_db = var.source_db_identifier
  instance_class      = var.db_instance_class

  allocated_storage = var.allocated_storage
  storage_encrypted = true
  kms_key_id        = var.kms_key_id != "" ? var.kms_key_id : null

  vpc_security_group_ids = [var.database_security_group_id]

  skip_final_snapshot = var.environment == "dev"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }

  tags = merge(var.common_tags, {
    Name = "postgres-replica-${var.environment}-${var.region}-${var.common_tags.UniqueSuffix}"
    Type = "ReadReplica"
  })
}
