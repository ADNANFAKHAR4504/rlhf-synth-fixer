variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "DB instance class"
  type        = string
}

variable "engine_version" {
  description = "Aurora engine version"
  type        = string
}

variable "cluster_size" {
  description = "Number of instances"
  type        = number
}

variable "is_primary_region" {
  description = "Is this the primary region"
  type        = bool
}

variable "global_cluster_id" {
  description = "Global cluster ID for secondary regions"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

# Security Group for Aurora
resource "aws_security_group" "aurora" {
  name_prefix = "${var.project_name}-${var.region}-aurora-sg-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.current.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-sg-${var.environment}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Get VPC data
data "aws_vpc" "current" {
  id = var.vpc_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "aurora" {
  name       = "${var.project_name}-${var.region}-aurora-subnet-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-subnet-${var.environment}"
    }
  )
}

# Aurora Global Cluster (only in primary region)
resource "aws_rds_global_cluster" "main" {
  count = var.is_primary_region ? 1 : 0

  global_cluster_identifier = "${var.project_name}-global-cluster-${var.environment}"
  engine                    = "aurora-mysql"
  engine_version            = var.engine_version
  database_name             = replace("${var.project_name}${var.environment}db", "-", "")
  storage_encrypted         = true
}

# KMS Key for encryption
resource "aws_kms_key" "aurora" {
  description = "${var.project_name}-${var.region}-aurora-kms-${var.environment}"

  tags = var.common_tags
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.project_name}-${var.region}-aurora-${var.environment}"
  target_key_id = aws_kms_key.aurora.key_id
}

# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.region}-aurora-cluster-${var.environment}"

  engine         = "aurora-mysql"
  engine_version = var.engine_version
  engine_mode    = "provisioned"

  database_name   = var.is_primary_region ? replace("${var.project_name}${var.environment}db", "-", "") : null
  master_username = var.is_primary_region ? "admin" : null
  master_password = var.is_primary_region ? random_password.master[0].result : null

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  global_cluster_identifier = var.is_primary_region ? aws_rds_global_cluster.main[0].id : var.global_cluster_id

  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  backup_retention_period = var.is_primary_region ? 7 : 1
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-${var.region}-final-snapshot-${var.environment}-${replace(timestamp(), ":", "-")}"

  tags = var.common_tags

  depends_on = [
    aws_rds_global_cluster.main
  ]
}

# Random password for master user
resource "random_password" "master" {
  count = var.is_primary_region ? 1 : 0

  length           = 32
  special          = true
  override_special = "!#$%&*+-=?^_`{|}~" # Exclude '/', '@', '"', ' ' which are not allowed by RDS
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  count = var.is_primary_region ? 1 : 0

  name = "${var.project_name}-${var.region}-aurora-passwords-${var.environment}"

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  count = var.is_primary_region ? 1 : 0

  secret_id     = aws_secretsmanager_secret.db_password[0].id
  secret_string = random_password.master[0].result
}

# Aurora Instances
resource "aws_rds_cluster_instance" "cluster_instances" {
  count = var.cluster_size

  identifier         = "${var.project_name}-${var.region}-aurora-instance-${count.index + 1}-${var.environment}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = "aurora-mysql"
  engine_version     = var.engine_version
  instance_class     = var.instance_class

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.aurora_monitoring.arn

  performance_insights_enabled = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.region}-aurora-instance-${count.index + 1}-${var.environment}"
    }
  )
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "aurora_monitoring" {
  name = "${var.project_name}-${var.region}-aurora-monitoring-${var.environment}"

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

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "aurora_monitoring" {
  role       = aws_iam_role.aurora_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Outputs
output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_resource_id" {
  description = "Aurora cluster resource ID"
  value       = aws_rds_cluster.main.cluster_resource_id
}

output "global_cluster_id" {
  description = "Aurora global cluster identifier"
  value       = var.is_primary_region ? aws_rds_global_cluster.main[0].id : var.global_cluster_id
}

output "global_cluster_arn" {
  description = "Aurora global cluster ARN"
  value       = var.is_primary_region ? aws_rds_global_cluster.main[0].arn : null
}

output "cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "cluster_database_name" {
  description = "Aurora cluster database name"
  value       = aws_rds_cluster.main.database_name
}

output "cluster_master_username" {
  description = "Aurora cluster master username"
  value       = aws_rds_cluster.main.master_username
}

output "instance_class" {
  description = "Aurora instance class"
  value       = var.instance_class
}

output "instance_identifiers" {
  description = "List of Aurora instance identifiers"
  value       = aws_rds_cluster_instance.cluster_instances[*].identifier
}

output "instance_endpoints" {
  description = "List of Aurora instance endpoints"
  value       = aws_rds_cluster_instance.cluster_instances[*].endpoint
}

output "instance_arns" {
  description = "List of Aurora instance ARNs"
  value       = aws_rds_cluster_instance.cluster_instances[*].arn
}

output "security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

output "subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.aurora.name
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = aws_kms_key.aurora.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.aurora.arn
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN for the database password"
  value       = var.is_primary_region ? aws_secretsmanager_secret.db_password[0].arn : null
}

output "monitoring_role_arn" {
  description = "IAM role ARN for enhanced monitoring"
  value       = aws_iam_role.aurora_monitoring.arn
}

output "engine_version" {
  description = "Aurora engine version"
  value       = var.engine_version
}

output "cluster_size" {
  description = "Number of instances in the cluster"
  value       = var.cluster_size
}
