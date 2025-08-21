## Use existing CloudWatch Log Groups (lookup by name) or create them if requested
locals {
  log_group_name_primary   = "${var.name_prefix}-vpc-flow-logs-primary"
  log_group_name_secondary = "${var.name_prefix}-vpc-flow-logs-secondary"
}

data "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  count = var.create_log_groups ? 0 : 1
  name  = local.log_group_name_primary
}

data "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  count    = var.create_log_groups ? 0 : 1
  provider = aws.eu_west_1
  name     = local.log_group_name_secondary
}

resource "aws_cloudwatch_log_group" "primary" {
  count             = var.create_log_groups ? 1 : 0
  name              = local.log_group_name_primary
  retention_in_days = var.log_group_retention_days

  tags = merge(var.tags, {
    Name = local.log_group_name_primary
  })
}

resource "aws_cloudwatch_log_group" "secondary" {
  count             = var.create_log_groups ? 1 : 0
  provider          = aws.eu_west_1
  name              = local.log_group_name_secondary
  retention_in_days = var.log_group_retention_days

  tags = merge(var.tags, {
    Name = local.log_group_name_secondary
  })
}

locals {
  log_group_arn_primary   = var.create_log_groups ? aws_cloudwatch_log_group.primary[0].arn : data.aws_cloudwatch_log_group.vpc_flow_logs_primary[0].arn
  log_group_arn_secondary = var.create_log_groups ? aws_cloudwatch_log_group.secondary[0].arn : data.aws_cloudwatch_log_group.vpc_flow_logs_secondary[0].arn
}

# VPC Flow Log - Primary Region
resource "aws_flow_log" "vpc_flow_logs_primary" {
  iam_role_arn    = var.flow_logs_role_primary_arn
  log_destination = local.log_group_arn_primary
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id_primary

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc-flow-log-primary"
  })
}

# VPC Flow Log - Secondary Region
resource "aws_flow_log" "vpc_flow_logs_secondary" {
  provider        = aws.eu_west_1
  iam_role_arn    = var.flow_logs_role_secondary_arn
  log_destination = local.log_group_arn_secondary
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id_secondary

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc-flow-log-secondary"
  })
}