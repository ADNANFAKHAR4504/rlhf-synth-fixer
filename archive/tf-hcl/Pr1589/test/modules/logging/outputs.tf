// Outputs for logging module

output "cloudtrail_log_group_arn" {
  value = aws_cloudwatch_log_group.cloudtrail.arn
}

output "cloudtrail_log_group_name" {
  value = aws_cloudwatch_log_group.cloudtrail.name
}

output "vpc_flow_log_group_arn" {
  value = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow[0].arn : null
}

output "cloudtrail_name" {
  value = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null
}
