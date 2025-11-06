# KMS Keys for encryption
resource "aws_kms_key" "aurora_primary" {
  description             = "KMS key for Aurora primary cluster encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "aurora-kms-primary-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "aurora_primary" {
  name          = "alias/aurora-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora_primary.key_id
}

resource "aws_kms_key" "aurora_dr" {
  provider                = aws.dr
  description             = "KMS key for Aurora DR cluster encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "aurora-kms-dr-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "aurora_dr" {
  provider      = aws.dr
  name          = "alias/aurora-dr-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora_dr.key_id
}

# DB Subnet Groups
resource "aws_db_subnet_group" "primary" {
  name       = "aurora-subnet-group-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name = "aurora-subnet-group-primary-${var.environment_suffix}"
  }
}

resource "aws_db_subnet_group" "dr" {
  provider   = aws.dr
  name       = "aurora-subnet-group-dr-${var.environment_suffix}"
  subnet_ids = aws_subnet.dr_private[*].id

  tags = {
    Name = "aurora-subnet-group-dr-${var.environment_suffix}"
  }
}

# Aurora Global Database
resource "aws_rds_global_cluster" "payments" {
  global_cluster_identifier = "payment-global-cluster-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "14.6"
  database_name             = var.db_name
  storage_encrypted         = true
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  cluster_identifier        = "payment-cluster-primary-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.payments.engine
  engine_version            = aws_rds_global_cluster.payments.engine_version
  database_name             = var.db_name
  master_username           = var.db_master_username
  master_password           = random_password.db_password.result
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.aurora_primary.id]
  global_cluster_identifier = aws_rds_global_cluster.payments.id
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.aurora_primary.arn
  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  skip_final_snapshot       = true

  tags = {
    Name = "payment-cluster-primary-${var.environment_suffix}"
  }
}

# Primary Aurora Instances
resource "aws_rds_cluster_instance" "primary" {
  count                = 2
  identifier           = "payment-instance-primary-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.primary.name

  tags = {
    Name = "payment-instance-primary-${count.index + 1}-${var.environment_suffix}"
  }
}

# DR Aurora Cluster
resource "aws_rds_cluster" "dr" {
  provider                  = aws.dr
  cluster_identifier        = "payment-cluster-dr-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.payments.engine
  engine_version            = aws_rds_global_cluster.payments.engine_version
  db_subnet_group_name      = aws_db_subnet_group.dr.name
  vpc_security_group_ids    = [aws_security_group.aurora_dr.id]
  global_cluster_identifier = aws_rds_global_cluster.payments.id
  storage_encrypted         = true
  kms_key_id                = aws_kms_key.aurora_dr.arn
  skip_final_snapshot       = true

  depends_on = [aws_rds_cluster_instance.primary]

  tags = {
    Name = "payment-cluster-dr-${var.environment_suffix}"
  }
}

# DR Aurora Instances
resource "aws_rds_cluster_instance" "dr" {
  provider             = aws.dr
  count                = 2
  identifier           = "payment-instance-dr-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.dr.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.dr.engine
  engine_version       = aws_rds_cluster.dr.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.dr.name

  tags = {
    Name = "payment-instance-dr-${count.index + 1}-${var.environment_suffix}"
  }
}