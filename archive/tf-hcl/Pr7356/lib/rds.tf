# rds.tf - Aurora MySQL cluster configuration

resource "aws_db_subnet_group" "aurora" {
  name       = "payment-aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private_db[*].id

  tags = {
    Name       = "payment-aurora-subnet-group-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  name_prefix = "payment-aurora-${var.environment_suffix}-"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL cluster parameter group for payment processing"

  parameter {
    name  = "require_secure_transport"
    value = "ON"
  }

  parameter {
    name  = "tls_version"
    value = "TLSv1.2,TLSv1.3"
  }

  tags = {
    Name       = "payment-aurora-cluster-params-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_parameter_group" "aurora" {
  name_prefix = "payment-aurora-instance-${var.environment_suffix}-"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL instance parameter group for payment processing"

  tags = {
    Name       = "payment-aurora-instance-params-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_password" "aurora_master" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_master_password" {
  name_prefix             = "payment-aurora-master-${var.environment_suffix}-"
  description             = "Master password for Aurora MySQL cluster"
  recovery_window_in_days = 0

  tags = {
    Name       = "payment-aurora-master-password-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_secretsmanager_secret_version" "aurora_master_password" {
  secret_id     = aws_secretsmanager_secret.aurora_master_password.id
  secret_string = random_password.aurora_master.result
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier     = "payment-aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-mysql"
  engine_mode            = "provisioned"
  engine_version         = "8.0.mysql_aurora.3.04.0"
  database_name          = "paymentdb"
  master_username        = "admin"
  master_password        = random_password.aurora_master.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  storage_encrypted   = true
  kms_key_id          = aws_kms_key.database.arn
  deletion_protection = false
  skip_final_snapshot = true

  backup_retention_period      = 7
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  tags = {
    Name       = "payment-aurora-cluster-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = 3
  identifier         = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  db_parameter_group_name = aws_db_parameter_group.aurora.name

  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.database.arn

  tags = {
    Name       = "payment-aurora-instance-${count.index + 1}-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}
