# Random suffix for unique resource naming
resource "random_id" "secret_suffix" {
  byte_length = 4
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store password in AWS Secrets Manager with unique naming and immediate deletion
resource "aws_secretsmanager_secret" "db_password" {
  provider                = aws.primary
  name                    = "${local.resource_prefix}-db-password-${random_id.secret_suffix.hex}"
  description             = "Database password for multi-region setup"
  recovery_window_in_days = 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

# DB Subnet Groups with unique naming to avoid quota issues
# We'll use a timestamp-based suffix to ensure uniqueness and avoid conflicts

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "${local.resource_prefix}-primary-${random_id.secret_suffix.hex}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-${random_id.secret_suffix.hex}"
  })

  depends_on = [random_id.secret_suffix]
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${local.resource_prefix}-secondary-${random_id.secret_suffix.hex}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-${random_id.secret_suffix.hex}"
  })

  depends_on = [random_id.secret_suffix]
}

# Primary RDS Instance with Multi-AZ
resource "aws_db_instance" "primary" {
  provider              = aws.primary
  identifier            = "${local.resource_prefix}-primary-db"
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  db_name               = var.db_name
  username              = var.db_username
  password              = random_password.db_password.result

  # Multi-AZ for high availability
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Security and Network
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name

  # Performance and Monitoring
  # Disabled for t3.micro - not supported
  performance_insights_enabled = false
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn

  # Encryption
  storage_encrypted = true

  # Disable final snapshot for demo purposes
  skip_final_snapshot = true

  # Enable automated backups for cross-region read replica
  copy_tags_to_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-db"
  })

  depends_on = [aws_iam_role.rds_enhanced_monitoring]
}

# KMS Key for secondary region encryption
resource "aws_kms_key" "secondary_rds" {
  provider    = aws.secondary
  description = "KMS key for RDS encryption in secondary region"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-rds-key"
  })
}

resource "aws_kms_alias" "secondary_rds" {
  provider      = aws.secondary
  name          = "alias/${local.resource_prefix}-secondary-rds"
  target_key_id = aws_kms_key.secondary_rds.key_id
}

# Cross-region Read Replica in Secondary Region
resource "aws_db_instance" "secondary_replica" {
  provider            = aws.secondary
  identifier          = "${local.resource_prefix}-secondary-replica"
  replicate_source_db = aws_db_instance.primary.arn

  # Override source settings for replica
  instance_class             = var.db_instance_class
  auto_minor_version_upgrade = false

  # Security and Network for replica
  db_subnet_group_name = aws_db_subnet_group.secondary.name

  # Encryption - must specify KMS key for cross-region replica
  storage_encrypted = true
  kms_key_id        = aws_kms_key.secondary_rds.arn

  # Performance and Monitoring
  # Disabled for t3.micro - not supported
  performance_insights_enabled = false
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn

  # Disable final snapshot for demo purposes
  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-secondary-replica"
  })

  depends_on = [
    aws_db_instance.primary,
    aws_iam_role.rds_enhanced_monitoring,
    aws_kms_key.secondary_rds
  ]
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.resource_prefix}-rds-monitoring-${random_id.secret_suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}