// Module: logging
// Contains CloudTrail (toggled), CloudWatch log groups, and optional VPC flow logs

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 90
  tags              = var.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 90
  tags              = var.common_tags
}
