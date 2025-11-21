variable "cluster_identifier" {
  description = "Aurora cluster identifier"
  type        = string
}

variable "engine_version" {
  description = "Aurora engine version"
  type        = string
}

variable "instance_class" {
  description = "Instance class"
  type        = string
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "master_username" {
  description = "Master username"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access Aurora"
  type        = list(string)
  default     = []
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${var.cluster_identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-subnet-group"
  })
}

resource "aws_security_group" "aurora" {
  name_prefix = "${var.cluster_identifier}-sg"
  description = "Security group for Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    description     = "PostgreSQL access from allowed security groups"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_password" "master_password" {
  length  = 32
  special = true
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier        = var.cluster_identifier
  engine                    = "aurora-postgresql"
  engine_version            = var.engine_version
  database_name             = replace(var.database_name, "-", "_")
  master_username           = var.master_username
  master_password           = random_password.master_password.result
  backup_retention_period   = var.backup_retention_period
  preferred_backup_window   = var.preferred_backup_window
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.cluster_identifier}-final-snapshot"
  storage_encrypted         = var.storage_encrypted
  kms_key_id                = var.kms_key_id
  db_subnet_group_name      = aws_db_subnet_group.aurora.name
  vpc_security_group_ids    = [aws_security_group.aurora.id]

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = var.cluster_identifier
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.instance_count

  identifier         = "${var.cluster_identifier}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = true

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-${count.index + 1}"
  })
}

output "cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.aurora.id
}

output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.aurora.id
}

output "master_password" {
  description = "Master password"
  value       = random_password.master_password.result
  sensitive   = true
}
