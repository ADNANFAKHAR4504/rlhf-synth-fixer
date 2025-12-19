resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-${var.project_name}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-db-subnet-group"
    }
  )
}

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-${var.project_name}-rds"

  engine            = "postgres"
  engine_version    = "15.12"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az            = var.multi_az
  publicly_accessible = false
  deletion_protection = var.deletion_protection

  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.environment}-${var.project_name}-rds-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  lifecycle {
    prevent_destroy = false
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-${var.project_name}-rds"
    }
  )
}

# Conditional lifecycle rule for production
resource "null_resource" "rds_lifecycle_check" {
  count = var.environment == "prod" ? 1 : 0

  lifecycle {
    prevent_destroy = true
  }

  triggers = {
    rds_id = aws_db_instance.main.id
  }
}