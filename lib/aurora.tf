# KMS key for primary region
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for Aurora encryption in primary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "kms-aurora-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/aurora-primary-${var.environment_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS key for secondary region
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for Aurora encryption in secondary region"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "kms-aurora-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/aurora-secondary-${var.environment_suffix}"
  target_key_id = aws_kms_key.secondary.key_id
}

# DB subnet group for primary
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "aurora-subnet-group-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name        = "subnet-group-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# DB subnet group for secondary
resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "aurora-subnet-group-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = {
    Name        = "subnet-group-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Security group for Aurora in primary
resource "aws_security_group" "aurora_primary" {
  provider    = aws.primary
  name        = "aurora-sg-primary-${var.environment_suffix}"
  description = "Security group for Aurora cluster in primary region"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr]
    description = "PostgreSQL from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name        = "sg-aurora-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Security group rule to allow Lambda rotation function to access Aurora - Primary
resource "aws_security_group_rule" "aurora_from_lambda_primary" {
  provider                 = aws.primary
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_primary.id
  security_group_id        = aws_security_group.aurora_primary.id
  description              = "PostgreSQL from Lambda rotation function"
}

# Security group for Aurora in secondary
resource "aws_security_group" "aurora_secondary" {
  provider    = aws.secondary
  name        = "aurora-sg-secondary-${var.environment_suffix}"
  description = "Security group for Aurora cluster in secondary region"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.secondary_vpc_cidr]
    description = "PostgreSQL from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name        = "sg-aurora-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Security group rule to allow Lambda rotation function to access Aurora - Secondary
resource "aws_security_group_rule" "aurora_from_lambda_secondary" {
  provider                 = aws.secondary
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda_secondary.id
  security_group_id        = aws_security_group.aurora_secondary.id
  description              = "PostgreSQL from Lambda rotation function"
}

# Parameter group with pg_stat_statements
resource "aws_rds_cluster_parameter_group" "aurora" {
  provider    = aws.primary
  name        = "aurora-pg-params-${var.environment_suffix}"
  family      = "aurora-postgresql15"
  description = "Custom parameter group with pg_stat_statements enabled"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "all"
  }

  parameter {
    name  = "pg_stat_statements.max"
    value = "10000"
  }

  tags = {
    Name        = "pg-params-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Aurora Global Database
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "aurora-global-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = var.database_name
  storage_encrypted         = true
}

# Primary Aurora Cluster
resource "aws_rds_cluster" "primary" {
  provider                        = aws.primary
  cluster_identifier              = "aurora-primary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  master_username                 = var.db_username
  master_password                 = random_password.db_password.result
  database_name                   = var.database_name
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [aws_security_group.aurora_primary.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
  kms_key_id                      = aws_kms_key.primary.arn
  storage_encrypted               = true
  skip_final_snapshot             = true
  deletion_protection             = false
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "aurora-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }

  lifecycle {
    ignore_changes = [master_password]
  }
}

# Primary Aurora instances (1 writer + 2 readers)
resource "aws_rds_cluster_instance" "primary" {
  provider            = aws.primary
  count               = 3
  identifier          = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.primary.id
  instance_class      = "db.r6g.large"
  engine              = "aurora-postgresql"
  publicly_accessible = false
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_primary.arn

  tags = {
    Name        = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
    Role        = count.index == 0 ? "writer" : "reader"
  }
}

# Secondary Aurora Cluster
resource "aws_rds_cluster" "secondary" {
  provider                        = aws.secondary
  cluster_identifier              = "aurora-secondary-${var.environment_suffix}"
  engine                          = "aurora-postgresql"
  engine_version                  = "15.4"
  global_cluster_identifier       = aws_rds_global_cluster.main.id
  db_subnet_group_name            = aws_db_subnet_group.secondary.name
  vpc_security_group_ids          = [aws_security_group.aurora_secondary.id]
  kms_key_id                      = aws_kms_key.secondary.arn
  storage_encrypted               = true
  skip_final_snapshot             = true
  deletion_protection             = false
  enabled_cloudwatch_logs_exports = ["postgresql"]

  depends_on = [aws_rds_cluster_instance.primary]

  tags = {
    Name        = "aurora-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

# Secondary Aurora instances (read replicas)
resource "aws_rds_cluster_instance" "secondary" {
  provider            = aws.secondary
  count               = 3
  identifier          = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.secondary.id
  instance_class      = "db.r6g.large"
  engine              = "aurora-postgresql"
  publicly_accessible = false
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_secondary.arn

  tags = {
    Name        = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
    Role        = "reader"
  }
}

# IAM role for RDS enhanced monitoring - Primary
resource "aws_iam_role" "rds_monitoring_primary" {
  provider = aws.primary
  name     = "rds-monitoring-role-primary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "iam-role-rds-monitoring-primary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_primary" {
  provider   = aws.primary
  role       = aws_iam_role.rds_monitoring_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# IAM role for RDS enhanced monitoring - Secondary
resource "aws_iam_role" "rds_monitoring_secondary" {
  provider = aws.secondary
  name     = "rds-monitoring-role-secondary-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "iam-role-rds-monitoring-secondary-${var.environment_suffix}"
    Environment = "production"
    DR-Tier     = "critical"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}