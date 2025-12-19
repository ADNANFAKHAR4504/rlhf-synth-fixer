resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name        = "${local.name_prefix}-aurora-subnet-group"
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "${local.name_prefix}-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.5"
  database_name           = "blogdb"
  master_username         = var.db_master_username
  master_password         = var.db_master_password
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.database.id]
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true

  serverlessv2_scaling_configuration {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "${local.name_prefix}-aurora-cluster"
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier           = "${local.name_prefix}-aurora-writer"
  cluster_identifier   = aws_rds_cluster.aurora.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.aurora.engine
  engine_version       = aws_rds_cluster.aurora.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.aurora.name

  performance_insights_enabled = true

  tags = {
    Name        = "${local.name_prefix}-aurora-writer"
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "aurora_reader" {
  count                = 2
  identifier           = "${local.name_prefix}-aurora-reader-${count.index + 1}"
  cluster_identifier   = aws_rds_cluster.aurora.id
  instance_class       = "db.serverless"
  engine               = aws_rds_cluster.aurora.engine
  engine_version       = aws_rds_cluster.aurora.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.aurora.name

  performance_insights_enabled = true

  tags = {
    Name        = "${local.name_prefix}-aurora-reader-${count.index + 1}"
    Environment = var.environment
  }
}
