# EventBridge Module Outputs

output "rule_name" {
  description = "Name of EventBridge rule"
  value       = aws_cloudwatch_event_rule.health_check.name
}

output "rule_arn" {
  description = "ARN of EventBridge rule"
  value       = aws_cloudwatch_event_rule.health_check.arn
}

output "rule_id" {
  description = "ID of EventBridge rule"
  value       = aws_cloudwatch_event_rule.health_check.id
}

