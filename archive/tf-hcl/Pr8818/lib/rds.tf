# Security group for RDS
resource "aws_security_group" "rds" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.current_vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-rds-sg-${local.current_region}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  provider    = aws.primary
  name_prefix = "${local.resource_prefix}-db-subnet-"
  subnet_ids  = aws_subnet.private[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-db-subnet-group-${local.current_region}"
    }
  )
}

# RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  provider               = aws.primary
  identifier             = "${local.resource_prefix}-postgres-${local.current_region}"
  engine                 = "postgres"
  engine_version         = "15.15"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  max_allocated_storage  = 500
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  db_name                = "payments"
  username               = var.db_master_username
  password               = var.db_master_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  # Backup configuration
  backup_retention_period         = 7
  backup_window                   = "03:00-04:00"
  maintenance_window              = "Mon:04:00-Mon:05:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Snapshot configuration
  copy_tags_to_snapshot     = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.resource_prefix}-postgres-final-${local.current_region}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = false

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-postgres-${local.current_region}"
    }
  )
}

# RDS instance in secondary region (read replica for cross-region replication)
resource "aws_db_instance" "postgres_secondary" {
  provider                = aws.secondary
  count                   = local.is_primary ? 1 : 0
  identifier              = "${local.resource_prefix}-postgres-${local.other_region}"
  replicate_source_db     = aws_db_instance.postgres.arn
  instance_class          = "db.t3.medium"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.rds_secondary.arn
  publicly_accessible     = false
  skip_final_snapshot     = true
  backup_retention_period = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-postgres-replica-${local.other_region}"
    }
  )
}
