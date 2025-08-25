# Variables
variable "vpc_id" {
  description = "VPC ID where RDS will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS subnet group"
  type        = list(string)
}

variable "random_prefix" {
  description = "Random prefix for unique resource naming"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  # Use a stable name for the DB subnet group to avoid Terraform creating
  # a new group during updates which can trigger AWS errors when modifying
  # the DB instance's subnet group. RDS subnet groups are tied to a VPC
  # and moving instances is not allowed in this workflow.
  name       = var.random_prefix != "" ? "${var.random_prefix}-db-subnet-group" : "${var.common_tags.Environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-db-subnet-group" : "${var.common_tags.Environment}-db-subnet-group"
  })

  lifecycle {
    # Do not create a replacement subnet group before destroying the old one
    # — keep operations in-place to avoid AWS rejecting moves between groups.
    create_before_destroy = false
  }
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name_prefix = var.random_prefix != "" ? "${var.random_prefix}-rds-sg" : "${var.common_tags.Environment}-rds-sg"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "MySQL from VPC"
  }

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-rds-sg" : "${var.common_tags.Environment}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = var.random_prefix != "" ? "${var.random_prefix}/rds/password" : "${var.common_tags.Environment}/rds/password"
  description             = "RDS database password"
  recovery_window_in_days = 7

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier_prefix = var.random_prefix != "" ? "${var.random_prefix}-database-" : "${var.common_tags.Environment}-database-"

  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "${replace(var.common_tags.Environment, "-", "")}db"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = var.enable_deletion_protection

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-database" : "${var.common_tags.Environment}-database"
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes = [
      password,            # Ignore password changes to prevent unnecessary updates
      db_subnet_group_name # Prevent Terraform from attempting to change subnet group on the DB instance
    ]
  }

  depends_on = [aws_db_subnet_group.main]
}

# Outputs
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds_sg.id
}

output "db_secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret for RDS password"
  value       = aws_secretsmanager_secret.db_password.arn
}
