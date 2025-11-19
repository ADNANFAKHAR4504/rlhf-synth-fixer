resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.database[*].id

  tags = {
    Name = "db-subnet-group-${var.environment_suffix}"
  }
}

resource "aws_rds_cluster_parameter_group" "main" {
  name_prefix = "aurora-postgres-params-${var.environment_suffix}-"
  family      = "aurora-postgresql14"
  description = "Aurora PostgreSQL cluster parameter group"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "aurora-postgres-params-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "trading-db-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "14.6"
  database_name          = var.db_name
  master_username        = var.db_master_username
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  enabled_cloudwatch_logs_exports     = ["postgresql"]
  storage_encrypted                   = true
  iam_database_authentication_enabled = true

  skip_final_snapshot = true

  tags = {
    Name = "aurora-cluster-${var.environment_suffix}"
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "trading-db-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  publicly_accessible = false

  performance_insights_enabled = true

  tags = {
    Name = "aurora-instance-${count.index + 1}-${var.environment_suffix}"
  }
}
