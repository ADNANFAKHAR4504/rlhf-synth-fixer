# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-payment-app-db-subnet-group"
  subnet_ids = data.aws_subnets.private.ids

  tags = {
    Name        = "${var.environment}-payment-app-db-subnet-group"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.environment}-payment-app-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.environment == "prod" ? 100 : 20
  storage_type         = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted    = true
  
  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "${var.environment}-payment-app-db-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  deletion_protection = var.environment == "prod" ? true : false
  
  multi_az               = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = var.environment != "prod"
  
  performance_insights_enabled = var.environment == "prod" ? true : false
  monitoring_interval         = var.environment == "prod" ? 60 : 0
  monitoring_role_arn        = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null
  
  enabled_cloudwatch_logs_exports = var.environment != "dev" ? ["postgresql"] : []
  
  tags = {
    Name        = "${var.environment}-payment-app-db"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# IAM role for RDS monitoring (only in prod)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${var.environment}-payment-app-rds-monitoring-role"
  
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
    Name        = "${var.environment}-payment-app-rds-monitoring-role"
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