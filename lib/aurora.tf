# Aurora Global Database
resource "aws_rds_global_cluster" "main" {
  provider                  = aws.primary
  global_cluster_identifier = "global-cluster-${var.environment_suffix}"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.05.2"
  database_name             = "transactiondb"
  storage_encrypted         = true

  tags = {
    Name    = "global-cluster-${var.environment_suffix}"
    DR-Role = "global"
  }
}

# Primary Cluster
resource "aws_rds_cluster" "primary" {
  provider                  = aws.primary
  cluster_identifier        = "aurora-primary-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  database_name             = aws_rds_global_cluster.main.database_name
  master_username           = var.db_username
  master_password           = var.db_password
  backup_retention_period   = var.backup_retention_days
  preferred_backup_window   = "03:00-04:00"
  skip_final_snapshot       = true
  storage_encrypted         = true
  db_subnet_group_name      = aws_db_subnet_group.primary.name
  vpc_security_group_ids    = [aws_security_group.primary_database.id]
  global_cluster_identifier = aws_rds_global_cluster.main.id

  tags = {
    Name = "aurora-primary-${var.environment_suffix}"
  }

  depends_on = [aws_rds_global_cluster.main]
}

# Primary Instances
resource "aws_rds_cluster_instance" "primary" {
  provider            = aws.primary
  count               = 2
  identifier          = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.primary.id
  instance_class      = var.db_instance_class
  engine              = aws_rds_cluster.primary.engine
  publicly_accessible = false

  tags = {
    Name = "aurora-primary-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# Secondary Cluster
resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "aurora-secondary-${var.environment_suffix}"
  engine                    = aws_rds_global_cluster.main.engine
  engine_version            = aws_rds_global_cluster.main.engine_version
  skip_final_snapshot       = true
  storage_encrypted         = true
  db_subnet_group_name      = aws_db_subnet_group.secondary.name
  vpc_security_group_ids    = [aws_security_group.secondary_database.id]
  global_cluster_identifier = aws_rds_global_cluster.main.id

  tags = {
    Name = "aurora-secondary-${var.environment_suffix}"
  }

  depends_on = [aws_rds_cluster_instance.primary]
}

# Secondary Instances
resource "aws_rds_cluster_instance" "secondary" {
  provider            = aws.secondary
  count               = 2
  identifier          = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier  = aws_rds_cluster.secondary.id
  instance_class      = var.db_instance_class
  engine              = aws_rds_cluster.secondary.engine
  publicly_accessible = false

  tags = {
    Name = "aurora-secondary-instance-${count.index + 1}-${var.environment_suffix}"
  }
}

# DB Subnet Groups
resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "db-subnet-group-primary-${var.environment_suffix}"
  subnet_ids = aws_subnet.primary_private[*].id

  tags = {
    Name = "db-subnet-group-primary-${var.environment_suffix}"
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "db-subnet-group-secondary-${var.environment_suffix}"
  subnet_ids = aws_subnet.secondary_private[*].id

  tags = {
    Name = "db-subnet-group-secondary-${var.environment_suffix}"
  }
}
