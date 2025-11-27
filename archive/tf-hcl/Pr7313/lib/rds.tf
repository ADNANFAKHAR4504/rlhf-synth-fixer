# DB Subnet Group for Aurora
resource "aws_db_subnet_group" "aurora" {
  name_prefix = "loan-processing-aurora-subnet-group-${local.env_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "loan-processing-aurora-subnet-group-${local.env_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Random password for Aurora (will be rotated via IAM auth)
resource "random_password" "db_master" {
  length  = 32
  special = true
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "aurora-${local.env_suffix}-${random_string.unique_suffix.result}"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "14.6" # Use supported version for Serverless v2
  database_name      = "loandb"
  master_username    = var.db_master_username
  master_password    = random_password.db_master.result

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  # IAM database authentication
  iam_database_authentication_enabled = true

  # Backup and recovery
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Enable point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Destroyability for testing
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "loan-processing-aurora-${local.env_suffix}"
  }
}

# Aurora Cluster Instance
resource "aws_rds_cluster_instance" "aurora" {
  identifier         = "aurora-inst-${local.env_suffix}-${random_string.unique_suffix.result}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  performance_insights_enabled = true

  tags = {
    Name = "loan-processing-aurora-instance-${local.env_suffix}"
  }
}
