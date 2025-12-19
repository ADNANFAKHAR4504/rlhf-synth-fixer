# Aurora Database - Simplified Multi-AZ Configuration

# DB Subnet Group
resource "aws_db_subnet_group" "primary" {
  name       = "${var.project_name}-db-subnet-group-${var.environment}-${var.resource_suffix}"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group-${var.resource_suffix}"
    Environment = var.environment
  }
}

# Primary Aurora Cluster (Multi-AZ)
resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "${var.project_name}-aurora-${var.environment}-${var.resource_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  database_name                   = replace("${var.project_name}db", "-", "")
  master_username                 = "admin"
  master_password                 = "ChangeMe123456!" # Use AWS Secrets Manager in production
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [var.primary_db_sg_id]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  storage_encrypted               = true
  kms_key_id                      = var.primary_kms_key_arn
  skip_final_snapshot             = true
  enabled_cloudwatch_logs_exports = ["error", "slowquery"]

  tags = {
    Name        = "${var.project_name}-aurora-cluster-${var.resource_suffix}"
    Environment = var.environment
    Region      = var.primary_region
  }

  lifecycle {
    ignore_changes = [master_password]
  }
}

# Aurora Instances (Multi-AZ with 2 instances across different AZs)
resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  identifier         = "${var.project_name}-aurora-${var.environment}-${var.resource_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  tags = {
    Name        = "${var.project_name}-aurora-instance-${var.resource_suffix}-${count.index + 1}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}