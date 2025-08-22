output "flow_log_ids" {
  description = "VPC Flow Log IDs for both regions"
  value = {
    primary   = aws_flow_log.vpc_flow_logs_primary.id
    secondary = aws_flow_log.vpc_flow_logs_secondary.id
  }
}

output "flow_log_group_arns" {
  description = "CloudWatch Log Group ARNs for VPC Flow Logs"
  value = {
    primary   = data.aws_cloudwatch_log_group.vpc_flow_logs_primary.arn
    secondary = data.aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn
  }
}