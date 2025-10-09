# Aurora Global Database

resource "aws_db_subnet_group" "primary" {
  name       = "${var.project_name}-db-subnet-group-primary-${var.resource_suffix}"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group-primary-${var.resource_suffix}"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "${var.project_name}-db-subnet-group-secondary-${var.resource_suffix}"
  subnet_ids = var.secondary_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group-secondary-${var.resource_suffix}"
    Environment = var.environment
  }
}

resource "aws_rds_global_cluster" "main" {
  global_cluster_identifier = "${var.project_name}-global-db-${var.environment}-${var.resource_suffix}"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.04.0"
  storage_encrypted         = true
}

resource "aws_rds_cluster" "primary" {
  cluster_identifier           = "${var.project_name}-aurora-primary-${var.resource_suffix}"
  engine                       = aws_rds_global_cluster.main.engine
  engine_version               = aws_rds_global_cluster.main.engine_version
  database_name                = "${replace(var.project_name, "-", "")}db"
  master_username              = "admin"
  master_password              = "ChangeMe123456!" # In production, use AWS Secrets Manager
  db_subnet_group_name         = aws_db_subnet_group.primary.name
  vpc_security_group_ids       = [var.primary_db_sg_id]
  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  kms_key_id                   = var.primary_kms_key_arn
  skip_final_snapshot          = true
  global_cluster_identifier    = aws_rds_global_cluster.main.id

  tags = {
    Name        = "${var.project_name}-aurora-primary"
    Environment = var.environment
    Region      = var.primary_region
  }

  depends_on = [aws_rds_global_cluster.main]
}

resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  identifier         = "${var.project_name}-aurora-primary-${var.resource_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.primary.engine

  tags = {
    Name        = "${var.project_name}-aurora-primary-instance-${var.resource_suffix}-${count.index + 1}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "${var.project_name}-aurora-secondary-${var.resource_suffix}"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [var.secondary_db_sg_id]
  kms_key_id                = var.secondary_kms_key_arn
  skip_final_snapshot       = true
  global_cluster_identifier = aws_rds_global_cluster.main.id

  tags = {
    Name        = "${var.project_name}-aurora-secondary"
    Environment = var.environment
    Region      = var.secondary_region
  }

  depends_on = [aws_rds_cluster_instance.primary]
}

resource "aws_rds_cluster_instance" "secondary" {
  count              = 2
  provider           = aws.secondary
  identifier         = "${var.project_name}-aurora-secondary-${var.resource_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.secondary.engine

  tags = {
    Name        = "${var.project_name}-aurora-secondary-instance-${var.resource_suffix}-${count.index + 1}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

