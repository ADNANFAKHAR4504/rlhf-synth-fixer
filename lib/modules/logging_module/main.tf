## Use existing CloudWatch Log Groups (lookup by name)
data "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  name = "${var.name_prefix}-vpc-flow-logs-primary"
}

data "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  provider = aws.eu_west_1
  name     = "${var.name_prefix}-vpc-flow-logs-secondary"
}

# VPC Flow Log - Primary Region
resource "aws_flow_log" "vpc_flow_logs_primary" {
  iam_role_arn    = var.flow_logs_role_primary_arn
  log_destination = data.aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
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
  log_destination = data.aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id_secondary

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc-flow-log-secondary"
  })
}