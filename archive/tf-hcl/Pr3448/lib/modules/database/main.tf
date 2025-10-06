resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.name_prefix}-db-subnet-"
  subnet_ids  = var.database_subnet_ids

  tags = {
    Name = "${var.name_prefix}-db-subnet-group-${var.region}"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-sg-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-rds-sg-${var.region}"
  }
}

resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.name_prefix}-db-params-"
  family      = "${var.engine}${substr(var.engine_version, 0, 3)}"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-db-params-${var.region}"
  }
}

resource "aws_db_instance" "main" {
  identifier_prefix = "${var.name_prefix}-db-"

  engine            = var.engine
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = replace(var.name_prefix, "-", "_")
  username = "admin"
  password = var.master_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  tags = {
    Name = "${var.name_prefix}-rds-${var.region}"
  }
}

resource "aws_dynamodb_table" "main" {
  name         = "${var.name_prefix}-table-${var.region}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "timestamp"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "timestamp-index"
    hash_key        = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_id
  }

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name = "${var.name_prefix}-dynamodb-${var.region}"
  }
}

resource "aws_backup_plan" "dynamodb" {
  name = "${var.name_prefix}-dynamodb-backup-${var.region}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment = var.environment
      Region      = var.region
    }
  }
}

resource "aws_backup_vault" "main" {
  name        = "${var.name_prefix}-backup-vault-${var.region}"
  kms_key_arn = var.kms_key_id

  tags = {
    Name = "${var.name_prefix}-backup-vault-${var.region}"
  }
}

resource "aws_backup_selection" "dynamodb" {
  name         = "${var.name_prefix}-dynamodb-selection-${var.region}"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.dynamodb.id

  resources = [
    aws_dynamodb_table.main.arn
  ]
}

resource "aws_iam_role" "backup" {
  name = "${var.name_prefix}-backup-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}


