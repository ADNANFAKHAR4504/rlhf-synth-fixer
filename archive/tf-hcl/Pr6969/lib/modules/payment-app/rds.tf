# Generate a random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store the password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "payment-app/${var.environment}/db-pass-v1-${var.pr_number}"
  description             = "Auto-generated RDS password for payment-app-${var.pr_number}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Name        = "payment-app-${var.pr_number}-db-pass-v1"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })

  depends_on = [aws_db_instance.main]
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name = "db-subnet-group-${var.pr_number}"
  # Use local fallback list so module still plans if private tag filtering
  # returns empty (falls back to public subnets as a last resort)
  subnet_ids = local.private_subnet_ids

  tags = {
    Name        = "db-subnet-group-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "rds-${var.pr_number}"

  engine         = "postgres"
  engine_version = "15.14"
  instance_class = var.db_instance_class

  allocated_storage = var.environment == "prod" ? 100 : 20
  storage_type      = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "rds-${var.pr_number}-final" : null

  deletion_protection = var.environment == "prod" ? true : false

  multi_az                   = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = var.environment != "prod"

  performance_insights_enabled          = var.environment == "prod" ? true : false
  performance_insights_kms_key_id       = var.environment == "prod" ? aws_kms_key.main.arn : null
  performance_insights_retention_period = var.environment == "prod" ? 7 : null
  monitoring_interval                   = var.environment == "prod" ? 60 : 0
  monitoring_role_arn                   = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = var.environment != "dev" ? ["postgresql"] : []

  tags = {
    Name        = "rds-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [
      db_subnet_group_name,
      final_snapshot_identifier
    ]
  }
}

# IAM role for RDS monitoring (only in prod)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0

  name = "rds-monitoring-role-${var.pr_number}"

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

  tags = {
    Name        = "rds-monitoring-role-${var.pr_number}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}