# outputs.tf - Payment Processing Infrastructure Outputs

output "vpc_id" {
  description = "ID of the payment processing VPC"
  value       = aws_vpc.payment_vpc.id
}

output "api_gateway_url" {
  description = "URL of the payment processing API Gateway"
  value       = "https://${aws_api_gateway_rest_api.payment_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment_suffix}"
}

output "api_gateway_endpoints" {
  description = "Payment processing API endpoints"
  value = {
    process  = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/POST/process"
    validate = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/POST/validate"
    status   = "${aws_api_gateway_rest_api.payment_api.execution_arn}/${var.environment_suffix}/GET/status"
  }
}

output "dynamodb_tables" {
  description = "DynamoDB table information"
  value = {
    transactions = {
      name = aws_dynamodb_table.transactions.name
      arn  = aws_dynamodb_table.transactions.arn
    }
    audit_logs = {
      name = aws_dynamodb_table.audit_logs.name
      arn  = aws_dynamodb_table.audit_logs.arn
    }
  }
}

output "lambda_functions" {
  description = "Lambda function information"
  value = {
    validation = {
      name = aws_lambda_function.payment_validation.function_name
      arn  = aws_lambda_function.payment_validation.arn
    }
    processing = {
      name = aws_lambda_function.payment_processing.function_name
      arn  = aws_lambda_function.payment_processing.arn
    }
    notification = {
      name = aws_lambda_function.payment_notification.function_name
      arn  = aws_lambda_function.payment_notification.arn
    }
  }
}

output "s3_bucket" {
  description = "S3 bucket for payment logs"
  value = {
    name = aws_s3_bucket.payment_logs.bucket
    arn  = aws_s3_bucket.payment_logs.arn
  }
}

output "kms_key" {
  description = "KMS key for encryption"
  value = {
    id    = aws_kms_key.payment_key.key_id
    arn   = aws_kms_key.payment_key.arn
    alias = aws_kms_alias.payment_key.name
  }
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_dashboard.dashboard_name}"
}

output "environment_configuration" {
  description = "Current environment configuration"
  value       = local.current_config
}

output "configuration_manifest_file" {
  description = "Path to the configuration manifest file"
  value       = local_file.configuration_manifest.filename
}