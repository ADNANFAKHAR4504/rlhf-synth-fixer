# KMS Key for Primary Aurora Encryption
resource "aws_kms_key" "aurora_primary" {
  provider                = aws.primary
  description             = "KMS key for Aurora encryption in primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "kms-aurora-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

resource "aws_kms_alias" "aurora_primary" {
  provider      = aws.primary
  name          = "alias/aurora-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora_primary.key_id
}

# KMS Key for Secondary Aurora Encryption
resource "aws_kms_key" "aurora_secondary" {
  provider                = aws.secondary
  description             = "KMS key for Aurora encryption in secondary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name    = "kms-aurora-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

resource "aws_kms_alias" "aurora_secondary" {
  provider      = aws.secondary
  name          = "alias/aurora-secondary-${var.environment_suffix}"
  target_key_id = aws_kms_key.aurora_secondary.key_id
}

# Aurora Global Database Cluster
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "14.11"
  database_name             = var.db_name
  storage_encrypted         = true

  lifecycle {
    prevent_destroy = false
  }
}

# Primary DB Subnet Group
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "aurora-subnet-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_db[*].id

  tags = merge(local.common_tags, {
    Name    = "aurora-subnet-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  database_name                   = var.db_name
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.primary_aurora.id]
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  kms_key_id                      = aws_kms_key.aurora_primary.arn
  storage_encrypted               = true

  # Point-in-time recovery is enabled by default with backup_retention_period > 0

  tags = merge(local.common_tags, {
    Name    = "aurora-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })

  depends_on = [aws_rds_global_cluster.main]
}

# Primary Aurora Cluster Instances (writer)
resource "aws_rds_cluster_instance" "primary" {
  provider             = aws.primary
  count                = 2
  identifier           = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.primary.name

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name    = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Secondary DB Subnet Group
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_db[*].id

  tags = merge(local.common_tags, {
    Name    = "aurora-subnet-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Aurora Cluster (read replica)
resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "aurora-secondary-${var.environment_suffix}"
  engine                          = aws_rds_global_cluster.main.engine
  engine_version                  = aws_rds_global_cluster.main.engine_version
  db_subnet_group_name            = aws_db_subnet_group.secondary.name
  vpc_security_group_ids          = [aws_security_group.secondary_aurora.id]
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  skip_final_snapshot             = true
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  kms_key_id                      = aws_kms_key.aurora_secondary.arn
  storage_encrypted               = true

  depends_on = [
    aws_rds_cluster_instance.primary
  ]

  tags = merge(local.common_tags, {
    Name    = "aurora-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Secondary Aurora Cluster Instances (reader)
resource "aws_rds_cluster_instance" "secondary" {
  provider             = aws.secondary
  count                = 2
  identifier           = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.secondary.engine
  engine_version       = aws_rds_cluster.secondary.engine_version
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.secondary.name

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name    = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}
