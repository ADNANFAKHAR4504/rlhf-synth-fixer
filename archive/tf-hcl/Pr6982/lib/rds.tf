# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "db-subnet-group-${var.environment_suffix}"
  })
}

# Aurora PostgreSQL Serverless v2 Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "15.8"
  database_name                   = var.db_name
  master_username                 = var.db_username
  master_password                 = local.db_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  skip_final_snapshot             = true
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.rds.arn
  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2.0
  }

  tags = merge(local.common_tags, {
    Name = "aurora-cluster-${var.environment_suffix}"
  })
}

# Aurora Serverless v2 Instance - Writer
resource "aws_rds_cluster_instance" "writer" {
  identifier           = "aurora-writer-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = merge(local.common_tags, {
    Name = "aurora-writer-${var.environment_suffix}"
    Role = "Writer"
  })
}

# Aurora Serverless v2 Instance - Reader
resource "aws_rds_cluster_instance" "reader" {
  identifier           = "aurora-reader-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.main.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.main.engine
  engine_version       = aws_rds_cluster.main.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = merge(local.common_tags, {
    Name = "aurora-reader-${var.environment_suffix}"
    Role = "Reader"
  })
}

# CloudWatch Log Group for RDS
resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/cluster/aurora-cluster-${var.environment_suffix}/postgresql"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}
