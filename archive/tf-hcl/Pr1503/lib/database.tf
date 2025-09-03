# RDS Instance
resource "aws_db_instance" "ecommerce_db" {
  identifier     = "ecommerce-db-${var.environment_suffix}"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.ecommerce_kms_key.arn

  db_name  = "ecommerce"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.ecommerce_db_subnet_group.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az            = true
  publicly_accessible = false
  deletion_protection = false
  skip_final_snapshot = true

  # Performance Insights is not supported for db.t3.micro
  # Enable it only for larger instance types
  performance_insights_enabled = false
  # performance_insights_kms_key_id = aws_kms_key.ecommerce_kms_key.arn

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-${var.environment_suffix}"
  })
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store database password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "ecommerce-db-password-${var.environment_suffix}"
  description             = "Database password for ecommerce application"
  kms_key_id              = aws_kms_key.ecommerce_kms_key.arn
  recovery_window_in_days = 0

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-password-${var.environment_suffix}"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.ecommerce_db.username
    password = random_password.db_password.result
  })
}