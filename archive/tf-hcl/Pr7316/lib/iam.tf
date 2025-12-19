# IAM role for RDS Enhanced Monitoring in primary region
resource "aws_iam_role" "rds_monitoring" {
  name               = "rds-monitoring-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume.json

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-monitoring-role-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# IAM role for RDS Enhanced Monitoring in secondary region
resource "aws_iam_role" "rds_monitoring_secondary" {
  provider           = aws.secondary
  name               = "rds-monitoring-role-secondary-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume.json

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-monitoring-role-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# Assume role policy for RDS Enhanced Monitoring
data "aws_iam_policy_document" "rds_monitoring_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

# Attach AWS managed policy for RDS Enhanced Monitoring (primary)
resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Attach AWS managed policy for RDS Enhanced Monitoring (secondary)
resource "aws_iam_role_policy_attachment" "rds_monitoring_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.rds_monitoring_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
