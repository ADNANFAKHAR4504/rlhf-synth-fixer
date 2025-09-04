# Generate secure random password for database
resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

# KMS Key for database encryption
resource "aws_kms_key" "database" {
  description             = "KMS key for database encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-kms-key"
    Type = "kms-key"
  })
}

# KMS Alias for easier key management
resource "aws_kms_alias" "database" {
  name          = "alias/${var.name_prefix}-database"
  target_key_id = aws_kms_key.database.key_id
}

# Store password in SSM Parameter Store for secure access
resource "aws_ssm_parameter" "database_password" {
  name        = "/${var.name_prefix}/database/password"
  description = "Database password for ${var.name_prefix}"
  type        = "SecureString"
  value       = random_password.database.result
  key_id      = aws_kms_key.database.arn

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-password-param"
    Type = "ssm-parameter"
  })
}

# RDS Parameter Group with SSL/TLS configuration
resource "aws_db_parameter_group" "main" {
  family = var.db_engine_version == "8.0" ? "mysql8.0" : "mysql${replace(var.db_engine_version, ".", "")}"
  name   = "${var.name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  # Force SSL connections (requires reboot)
  parameter {
    name         = "require_secure_transport"
    value        = "ON"
    apply_method = "pending-reboot"
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-db-parameter-group"
    Type = "database"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-sg"
  vpc_id      = var.vpc_id

  # Allow MySQL traffic from application security group
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow MySQL traffic from bastion host (if exists)
  dynamic "ingress" {
    for_each = var.bastion_security_group_id != "" ? [1] : []
    content {
      from_port       = 3306
      to_port         = 3306
      protocol        = "tcp"
      security_groups = [var.bastion_security_group_id]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-rds-sg"
    Type = "security-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance with SSL/TLS and encryption
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-db"

  # Database configuration
  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  # Database credentials - using generated password
  username = var.database_username
  password = random_password.database.result
  db_name  = var.database_name

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.db_subnet_group_name

  # Backup and maintenance
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  multi_az                = var.environment == "production"

  # Performance and monitoring
  parameter_group_name = aws_db_parameter_group.main.name
  monitoring_interval  = var.environment == "production" ? 60 : 0
  monitoring_role_arn  = var.environment == "production" ? var.monitoring_role_arn : null

  # Security
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # SSL/TLS configuration
  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database"
    Type = "database"
  })
}

# RDS Read Replica for production
resource "aws_db_instance" "read_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.name_prefix}-db-read-replica"

  # Replica configuration
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.db_instance_class

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = var.db_subnet_group_name

  # Backup and maintenance
  backup_retention_period = 7
  backup_window           = "03:30-04:30"
  maintenance_window      = "sun:04:30-sun:05:30"

  # Performance and monitoring
  monitoring_interval = 60
  monitoring_role_arn = var.monitoring_role_arn

  # Security
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-read-replica-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # SSL/TLS configuration
  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-database-read-replica"
    Type = "database"
  })
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
