resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.name_prefix}-db-credentials-${var.environment_suffix}"

  tags = {
    Name        = "${var.name_prefix}-db-credentials-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
    engine   = "postgres"
    port     = 5432
    host     = aws_rds_cluster.main.endpoint
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group-${var.environment_suffix}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.name_prefix}-db-subnet-group-${var.environment_suffix}"
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${var.name_prefix}-aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.4"
  database_name          = "payments"
  master_username        = "dbadmin"
  master_password        = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = var.environment == "prod" ? 7 : 1
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true

  tags = {
    Name        = "${var.name_prefix}-aurora-cluster-${var.environment_suffix}"
    Environment = var.environment
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster_instance" "main" {
  count = 2

  identifier          = "${var.name_prefix}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.main.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.main.engine
  engine_version      = aws_rds_cluster.main.engine_version
  publicly_accessible = false

  tags = {
    Name        = "${var.name_prefix}-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = var.environment
  }
}
