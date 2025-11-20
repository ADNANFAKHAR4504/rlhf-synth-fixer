# rds.tf - RDS Aurora PostgreSQL cluster

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name           = "aurora-subnet-group-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Aurora PostgreSQL Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "16.4"
  database_name           = "paymentdb"
  master_username         = var.db_master_username
  master_password         = random_password.db_master_password.result # ✅ Use generated password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  skip_final_snapshot       = var.environment_suffix != "prod"
  final_snapshot_identifier = var.environment_suffix == "prod" ? "aurora-final-snapshot-${var.environment_suffix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name           = "aurora-cluster-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

# Aurora PostgreSQL Instances
resource "aws_rds_cluster_instance" "main" {
  count               = 3
  identifier          = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = var.environment_suffix == "prod" ? "db.r6g.large" : var.rds_instance_class
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  publicly_accessible = false

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main.arn

  tags = {
    Name           = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Role           = count.index == 0 ? "Primary" : "Replica"
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}
