# Parameter group for primary
resource "aws_db_parameter_group" "primary" {
  name   = "rds-primary-params-${var.environment_suffix}"
  family = "postgres18"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-params-${var.environment_suffix}"
    }
  )
}

# Parameter group for DR
resource "aws_db_parameter_group" "dr" {
  provider = aws.us-west-2
  name     = "rds-dr-params-${var.environment_suffix}"
  family   = "postgres18"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-params-${var.environment_suffix}"
    }
  )
}
