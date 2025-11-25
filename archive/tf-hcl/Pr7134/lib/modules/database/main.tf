# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "rds-subnet-group-${var.environment_suffix}"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "rds-sg-${var.environment_suffix}"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "rds-sg-${var.environment_suffix}"
    }
  )
}

# Data source for VPC
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Random password for RDS
resource "random_password" "master" {
  length  = 32
  special = true
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.3"
  database_name           = "appdb"
  master_username         = "dbadmin"
  master_password         = random_password.master.result
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = true
  storage_encrypted       = true

  # Note: serverlessv2_scaling_configuration removed - incompatible with traditional instance classes
  # Using traditional provisioned instances as specified in requirements

  tags = merge(
    var.tags,
    {
      Name = "aurora-cluster-${var.environment_suffix}"
    }
  )
}

# RDS Aurora Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count              = var.aurora_instance_count
  identifier         = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.rds_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = merge(
    var.tags,
    {
      Name = "aurora-instance-${var.environment_suffix}-${count.index + 1}"
    }
  )
}

# Secrets Manager Secret for RDS credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "rds-credentials-${var.environment_suffix}"
  description = "RDS Aurora cluster credentials"

  tags = merge(
    var.tags,
    {
      Name = "rds-credentials-${var.environment_suffix}"
    }
  )
}

# Secrets Manager Secret Version
resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = aws_rds_cluster.main.master_password
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.main.database_name
  })
}
