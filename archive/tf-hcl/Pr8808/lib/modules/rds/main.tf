terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "availability_zones" { type = list(string) }
variable "db_master_username" { type = string }
variable "db_master_password" {
  type      = string
  sensitive = true
}
variable "is_primary" { type = bool }
variable "global_cluster_identifier" { type = string }

resource "aws_db_subnet_group" "main" {
  name       = "transaction-db-subnet-${var.region}-${var.environment_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "transaction-db-subnet-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_security_group" "rds" {
  name        = "transaction-rds-sg-${var.region}-${var.environment_suffix}"
  description = "Security group for RDS Aurora"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "transaction-rds-sg-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_rds_global_cluster" "main" {
  count                     = var.is_primary ? 1 : 0
  global_cluster_identifier = var.global_cluster_identifier
  engine                    = "aurora-postgresql"
  engine_version            = "15.3"
  database_name             = "transactions"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = "transaction-cluster-${var.region}-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.3"
  database_name                   = var.is_primary ? "transactions" : null
  master_username                 = var.is_primary ? var.db_master_username : null
  master_password                 = var.is_primary ? var.db_master_password : null
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  storage_encrypted               = true
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true

  global_cluster_identifier = var.is_primary ? aws_rds_global_cluster.main[0].id : var.global_cluster_identifier
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "transaction-instance-${var.region}-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r5.large"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  db_parameter_group_name      = aws_db_parameter_group.main.name
  performance_insights_enabled = true
}

resource "aws_db_parameter_group" "main" {
  name   = "transaction-pg-${var.region}-${var.environment_suffix}"
  family = "aurora-postgresql15"

  parameter {
    name  = "ssl"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

output "cluster_id" { value = aws_rds_cluster.main.id }
output "cluster_arn" { value = aws_rds_cluster.main.arn }
output "cluster_endpoint" { value = aws_rds_cluster.main.endpoint }
output "cluster_identifier" { value = aws_rds_cluster.main.cluster_identifier }
output "reader_endpoint" { value = aws_rds_cluster.main.reader_endpoint }
