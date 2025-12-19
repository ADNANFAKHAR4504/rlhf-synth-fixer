# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment_suffix}"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "rds-subnet-group-${var.environment_suffix}"
  }
}

# RDS Aurora Cluster Parameter Group
resource "aws_rds_cluster_parameter_group" "main" {
  name        = "aurora-mysql-cluster-pg-${var.environment_suffix}"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL cluster parameter group"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = {
    Name = "aurora-mysql-cluster-pg-${var.environment_suffix}"
  }
}

# RDS Aurora Instance Parameter Group
resource "aws_db_parameter_group" "main" {
  name        = "aurora-mysql-instance-pg-${var.environment_suffix}"
  family      = "aurora-mysql8.0"
  description = "Aurora MySQL instance parameter group"

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  tags = {
    Name = "aurora-mysql-instance-pg-${var.environment_suffix}"
  }
}

# RDS Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "aurora-cluster-${var.environment_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  database_name                   = var.db_name
  master_username                 = var.db_master_username
  master_password                 = var.db_master_password
  db_subnet_group_name            = aws_db_subnet_group.main.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]

  enabled_cloudwatch_logs_exports = ["audit", "error", "slowquery"]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "aurora-cluster-${var.environment_suffix}-final"

  storage_encrypted = true

  tags = {
    Name        = "aurora-cluster-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# RDS Aurora Cluster Instances (Writer)
resource "aws_rds_cluster_instance" "writer" {
  identifier              = "aurora-writer-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.main.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.main.engine
  engine_version          = aws_rds_cluster.main.engine_version
  db_parameter_group_name = aws_db_parameter_group.main.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "aurora-writer-${var.environment_suffix}"
    Environment = "Shared"
    Role        = "Writer"
  }
}

# RDS Aurora Cluster Instances (Reader)
resource "aws_rds_cluster_instance" "reader" {
  count = 2

  identifier              = "aurora-reader-${count.index + 1}-${var.environment_suffix}"
  cluster_identifier      = aws_rds_cluster.main.id
  instance_class          = "db.r6g.large"
  engine                  = aws_rds_cluster.main.engine
  engine_version          = aws_rds_cluster.main.engine_version
  db_parameter_group_name = aws_db_parameter_group.main.name

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "aurora-reader-${count.index + 1}-${var.environment_suffix}"
    Environment = "Shared"
    Role        = "Reader"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "rds-monitoring-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Proxy IAM Role
resource "aws_iam_role" "rds_proxy" {
  name = "rds-proxy-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "rds-proxy-role-${var.environment_suffix}"
  }
}

# Secrets Manager Secret for RDS Credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "rds-credentials-${var.environment_suffix}"
  description             = "RDS Aurora cluster credentials for RDS Proxy"
  recovery_window_in_days = 0

  tags = {
    Name = "rds-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = var.db_master_password
  })
}

# IAM Policy for RDS Proxy to access Secrets Manager
resource "aws_iam_policy" "rds_proxy_secrets" {
  name        = "rds-proxy-secrets-${var.environment_suffix}"
  description = "Allow RDS Proxy to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_proxy_secrets" {
  role       = aws_iam_role.rds_proxy.name
  policy_arn = aws_iam_policy.rds_proxy_secrets.arn
}

# RDS Proxy
resource "aws_db_proxy" "main" {
  name          = "rds-proxy-${var.environment_suffix}"
  debug_logging = false
  engine_family = "MYSQL"
  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.rds_credentials.arn
  }
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.db_subnet_ids
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]

  require_tls = true

  tags = {
    Name        = "rds-proxy-${var.environment_suffix}"
    Environment = "Shared"
  }
}

# RDS Proxy Target Group
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 100
    max_idle_connections_percent = 50
  }
}

# RDS Proxy Target
resource "aws_db_proxy_target" "main" {
  db_proxy_name         = aws_db_proxy.main.name
  target_group_name     = aws_db_proxy_default_target_group.main.name
  db_cluster_identifier = aws_rds_cluster.main.cluster_identifier
}
