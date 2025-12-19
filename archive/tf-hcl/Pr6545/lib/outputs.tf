# outputs.tf
# Output values for the compliance checking system

output "config_bucket_name" {
  description = "Name of the S3 bucket storing Config snapshots"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket storing Config snapshots"
  value       = aws_s3_bucket.config_bucket.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_recorder_arn" {
  description = "ARN of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "compliance_lambda_function_name" {
  description = "Name of the compliance checker Lambda function"
  value       = aws_lambda_function.compliance_checker.function_name
}

output "compliance_lambda_function_arn" {
  description = "ARN of the compliance checker Lambda function"
  value       = aws_lambda_function.compliance_checker.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.name
}

output "config_rules" {
  description = "List of Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_public_access.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.ec2_detailed_monitoring.name
  ]
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Groups for monitoring"
  value = {
    config_logs          = aws_cloudwatch_log_group.config_logs.name
    lambda_logs          = aws_cloudwatch_log_group.lambda_logs.name
    config_delivery_logs = aws_cloudwatch_log_group.config_delivery_logs.name
  }
}

output "eventbridge_rules" {
  description = "EventBridge rules for compliance monitoring"
  value = {
    compliance_change_rule = aws_cloudwatch_event_rule.config_compliance.name
    periodic_check_rule    = aws_cloudwatch_event_rule.periodic_check.name
  }
}

output "iam_roles" {
  description = "IAM roles created for the compliance system"
  value = {
    config_role = aws_iam_role.config_role.arn
    lambda_role = aws_iam_role.lambda_role.arn
  }
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
