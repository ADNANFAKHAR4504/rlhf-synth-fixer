resource "aws_rds_global_cluster" "main" {
  provider = aws.primary

  global_cluster_identifier = var.global_cluster_identifier
  engine                    = var.engine
  engine_version            = var.engine_version
  database_name             = var.database_name
  storage_encrypted         = true
  deletion_protection       = false

  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "aws_db_subnet_group" "primary" {
  provider = aws.primary

  name       = "${var.primary_cluster_identifier}-subnet-group"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name = "${var.primary_cluster_identifier}-subnet-group"
  }
}

resource "aws_rds_cluster" "primary" {
  provider = aws.primary

  cluster_identifier        = var.primary_cluster_identifier
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = var.engine
  engine_version            = var.engine_version
  database_name             = var.database_name
  master_username           = var.master_username
  master_password           = var.master_password
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [var.primary_security_group_id]

  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.preferred_backup_window

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  deletion_protection             = false

  skip_final_snapshot       = true
  final_snapshot_identifier = null

  tags = {
    Name = var.primary_cluster_identifier
  }

  lifecycle {
    ignore_changes = [
      replication_source_identifier,
      engine_version
    ]
  }
}

resource "aws_rds_cluster_instance" "primary" {
  provider = aws.primary
  count    = var.primary_instance_count

  identifier         = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.primary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  publicly_accessible = false

  tags = {
    Name = "${var.primary_cluster_identifier}-instance-${count.index + 1}"
  }

  lifecycle {
    ignore_changes = [engine_version]
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary

  name       = "${var.secondary_cluster_identifier}-subnet-group"
  subnet_ids = var.secondary_subnet_ids

  tags = {
    Name = "${var.secondary_cluster_identifier}-subnet-group"
  }
}

resource "aws_kms_key" "secondary" {
  provider = aws.secondary

  description             = "KMS key for Aurora secondary cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.secondary_cluster_identifier}-kms-key"
  }
}

resource "aws_kms_alias" "secondary" {
  provider = aws.secondary

  name          = "alias/${var.secondary_cluster_identifier}-kms"
  target_key_id = aws_kms_key.secondary.key_id
}

resource "aws_rds_cluster" "secondary" {
  provider = aws.secondary

  depends_on = [aws_rds_cluster_instance.primary]

  cluster_identifier        = var.secondary_cluster_identifier
  global_cluster_identifier = aws_rds_global_cluster.main.id
  engine                    = var.engine
  engine_version            = var.engine_version
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [var.secondary_security_group_id]

  enabled_cloudwatch_logs_exports = ["postgresql"]
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.secondary.arn
  deletion_protection             = false

  skip_final_snapshot       = true
  final_snapshot_identifier = null

  tags = {
    Name = var.secondary_cluster_identifier
  }

  lifecycle {
    ignore_changes = [
      replication_source_identifier,
      engine_version
    ]
  }
}

resource "aws_rds_cluster_instance" "secondary" {
  provider = aws.secondary
  count    = var.secondary_instance_count

  identifier         = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class     = var.secondary_instance_class
  engine             = var.engine
  engine_version     = var.engine_version

  publicly_accessible = false

  tags = {
    Name = "${var.secondary_cluster_identifier}-instance-${count.index + 1}"
  }

  lifecycle {
    ignore_changes = [engine_version]
  }
}
