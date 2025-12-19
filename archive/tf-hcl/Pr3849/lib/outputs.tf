output "api_gateway_url" {
  description = "API Gateway webhook URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/webhook"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for subscriptions"
  value       = aws_dynamodb_table.subscriptions.name
}

output "s3_bucket_name" {
  description = "S3 bucket name for receipts"
  value       = aws_s3_bucket.receipts.id
}

output "stepfunctions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.renewal_workflow.arn
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for payment gateway credentials"
  value       = aws_secretsmanager_secret.payment_gateway.arn
}

output "ses_configuration_set" {
  description = "SES configuration set name"
  value       = aws_ses_configuration_set.receipts.name
}
