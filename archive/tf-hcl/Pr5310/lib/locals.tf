# locals.tf

locals {
  # Environment suffix for unique resource naming
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  # Resource name prefix
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags applied to all resources
  common_tags = merge(
    {
      Environment = var.environment
      Application = var.application
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    },
    var.additional_tags
  )

  # Account ID for resource naming
  account_id = data.aws_caller_identity.current.account_id

  # S3 bucket names
  raw_payloads_bucket_name   = "${local.account_id}-webhook-payloads-${var.environment}-${local.env_suffix}"
  processed_logs_bucket_name = "${local.account_id}-transaction-logs-${var.environment}-${local.env_suffix}"

  # DynamoDB table name
  dynamodb_table_name = "webhook-transactions-${local.env_suffix}"

  # SQS queue names
  dlq_name = "webhook-processing-dlq-${local.env_suffix}"

  # Lambda function names
  lambda_stripe_validator_name = "${local.name_prefix}-stripe-validator-${local.env_suffix}"
  lambda_paypal_validator_name = "${local.name_prefix}-paypal-validator-${local.env_suffix}"
  lambda_square_validator_name = "${local.name_prefix}-square-validator-${local.env_suffix}"
  lambda_processor_name        = "${local.name_prefix}-processor-${local.env_suffix}"
  lambda_query_name            = "${local.name_prefix}-query-${local.env_suffix}"

  # IAM role names
  iam_validator_role_name   = "${local.name_prefix}-validator-role-${local.env_suffix}"
  iam_processor_role_name   = "${local.name_prefix}-processor-role-${local.env_suffix}"
  iam_query_role_name       = "${local.name_prefix}-query-role-${local.env_suffix}"
  iam_api_gateway_role_name = "${local.name_prefix}-api-gateway-role-${local.env_suffix}"

  # API Gateway names
  api_gateway_name = "${local.name_prefix}-api-${local.env_suffix}"

  # CloudWatch log group names
  log_group_stripe_validator = "/aws/lambda/${local.lambda_stripe_validator_name}"
  log_group_paypal_validator = "/aws/lambda/${local.lambda_paypal_validator_name}"
  log_group_square_validator = "/aws/lambda/${local.lambda_square_validator_name}"
  log_group_processor        = "/aws/lambda/${local.lambda_processor_name}"
  log_group_query            = "/aws/lambda/${local.lambda_query_name}"
  log_group_api_gateway      = "/aws/apigateway/${local.api_gateway_name}"

  # SNS topic name
  sns_topic_name = "${local.name_prefix}-alarms-${local.env_suffix}"

  # Secrets Manager secret names
  secret_stripe_name = "webhook-processor/${var.environment}/stripe/secret-${local.env_suffix}"
  secret_paypal_name = "webhook-processor/${var.environment}/paypal/secret-${local.env_suffix}"
  secret_square_name = "webhook-processor/${var.environment}/square/secret-${local.env_suffix}"
}
