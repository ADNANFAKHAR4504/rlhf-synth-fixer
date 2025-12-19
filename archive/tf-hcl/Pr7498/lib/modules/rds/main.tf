# modules/rds/main.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg-"
  description = "Security group for RDS Aurora PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-rds-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.environment}-db-subnet-"
  description = "Database subnet group"
  subnet_ids  = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-db-subnet-group-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = length(var.private_subnet_ids) >= 2
      error_message = "RDS requires at least 2 subnets in different availability zones."
    }
  }
}

resource "aws_rds_cluster_parameter_group" "main" {
  name_prefix = "${var.environment}-aurora-pg-"
  family      = "aurora-postgresql15"
  description = "Aurora PostgreSQL cluster parameter group"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-cluster-pg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = "${var.environment}-aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  database_name                   = var.database_name
  master_username                 = var.master_username
  master_password                 = var.master_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  skip_final_snapshot       = true
  final_snapshot_identifier = null
  deletion_protection       = false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  storage_encrypted = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-cluster-${var.environment_suffix}"
    }
  )

  lifecycle {
    precondition {
      condition     = can(regex("^[a-z]+-(dev|staging|prod)-aurora-cluster-[a-z0-9]+$", "${var.environment}-aurora-cluster-${var.environment_suffix}"))
      error_message = "Cluster identifier must follow naming convention."
    }
  }
}

resource "aws_rds_cluster_instance" "main" {
  count                = var.instance_count
  identifier           = "${var.environment}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = var.instance_class
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  performance_insights_enabled = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.environment}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    }
  )
}
