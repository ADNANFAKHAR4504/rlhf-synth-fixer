# Cluster parameter group for Aurora PostgreSQL
resource "aws_rds_cluster_parameter_group" "primary" {
  name        = "aurora-postgresql-cluster-${var.environment_suffix}"
  family      = "aurora-postgresql14"
  description = "Cluster parameter group for Aurora PostgreSQL with pg_stat_statements"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "ALL"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-cluster-params-${var.environment_suffix}"
    }
  )
}

# DB parameter group for Aurora PostgreSQL instances - Primary
resource "aws_db_parameter_group" "primary" {
  name        = "aurora-postgresql-instance-${var.environment_suffix}"
  family      = "aurora-postgresql14"
  description = "Instance parameter group for Aurora PostgreSQL"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-instance-params-${var.environment_suffix}"
    }
  )
}

# Cluster parameter group for Aurora PostgreSQL - Secondary
resource "aws_rds_cluster_parameter_group" "secondary" {
  provider    = aws.secondary
  name        = "aurora-postgresql-cluster-secondary-${var.environment_suffix}-${random_string.suffix.result}"
  family      = "aurora-postgresql14"
  description = "Cluster parameter group for Aurora PostgreSQL secondary region"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "pg_stat_statements.track"
    value = "ALL"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-cluster-params-secondary-${var.environment_suffix}-${random_string.suffix.result}"
    }
  )
}

# DB parameter group for Aurora PostgreSQL instances - Secondary
resource "aws_db_parameter_group" "secondary" {
  provider    = aws.secondary
  name        = "aurora-postgresql-instance-secondary-${var.environment_suffix}-${random_string.suffix.result}"
  family      = "aurora-postgresql14"
  description = "Instance parameter group for Aurora PostgreSQL secondary region"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "aurora-instance-params-secondary-${var.environment_suffix}-${random_string.suffix.result}"
    }
  )
}
