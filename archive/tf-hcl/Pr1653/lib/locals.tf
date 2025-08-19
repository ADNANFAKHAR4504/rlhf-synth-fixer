########################
# Local Values
########################
locals {
  # Append environment suffix to resource names if provided
  actual_bucket_name     = var.environment_suffix != "" ? "${var.bucket_name}-${var.environment_suffix}" : var.bucket_name
  actual_lambda_name     = var.environment_suffix != "" ? "${var.lambda_function_name}-${var.environment_suffix}" : var.lambda_function_name
  actual_iam_role_name   = var.environment_suffix != "" ? "corp-lambda-s3-processor-role-${var.environment_suffix}" : "corp-lambda-s3-processor-role"
  actual_iam_policy_name = var.environment_suffix != "" ? "corp-lambda-s3-policy-${var.environment_suffix}" : "corp-lambda-s3-policy"
  actual_log_group_name  = var.environment_suffix != "" ? "/aws/lambda/${var.lambda_function_name}-${var.environment_suffix}" : "/aws/lambda/${var.lambda_function_name}"
}