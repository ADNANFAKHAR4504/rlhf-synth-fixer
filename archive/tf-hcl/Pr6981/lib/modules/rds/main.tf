resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.project_name}-${var.environment_suffix}-"
  description = "Database subnet group for ${var.environment}"
  subnet_ids  = var.db_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-db-subnet-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment_suffix}-db"

  engine            = "postgres"
  engine_version    = "15.15"
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "payment_${replace(var.environment_suffix, "-", "_")}"
  username = var.username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids

  # Multi-AZ for production, single-AZ for dev/staging
  multi_az = var.environment == "prod" ? true : false

  # Backup configuration
  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # Destroyability settings
  skip_final_snapshot      = true
  deletion_protection      = false
  delete_automated_backups = true

  # Performance insights
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-db"
    }
  )
}
