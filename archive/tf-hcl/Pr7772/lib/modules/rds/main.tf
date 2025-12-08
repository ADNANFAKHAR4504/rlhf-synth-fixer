data "aws_caller_identity" "current" {}

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name_prefix = "/${var.project_name}/db-password/${var.environment}"
  description = "Database password for ${var.project_name} ${var.environment}"
  kms_key_id  = var.kms_key_id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBPassword-${var.region}-${var.environment}"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBSubnetGroup-${var.region}-${var.environment}"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS database"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "PostgreSQL access from VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-SG-${var.region}-${var.environment}"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-postgres15-${var.environment}"
  family = "postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-DBParameterGroup-${var.region}-${var.environment}"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${var.environment}"

  engine            = "postgres"
  engine_version    = "15.12"
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_encrypted = true
  kms_key_id        = var.kms_key_id
  storage_type      = "gp3"

  db_name  = "${var.project_name}db"
  username = "${var.project_name}admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az                  = var.environment == "prod" ? true : false
  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-final-snapshot-${var.environment}-${replace(timestamp(), ":", "-")}" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-RDS-${var.region}-${var.environment}"
  })
}

resource "aws_db_instance_automated_backups_replication" "main" {
  count = var.environment == "prod" ? 1 : 0

  source_db_instance_arn = aws_db_instance.main.arn
  kms_key_id             = var.kms_key_id
}