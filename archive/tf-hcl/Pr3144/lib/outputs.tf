output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "s3_bucket_main" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_cloudtrail" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "kms_key_main_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_cloudtrail_id" {
  description = "ID of the CloudTrail KMS key"
  value       = aws_kms_key.cloudtrail.id
}

output "lambda_function_arn" {
  description = "ARN of the main Lambda function"
  value       = aws_lambda_function.main.arn
}

output "lambda_edge_function_arn" {
  description = "ARN of the Lambda@Edge function"
  value       = aws_lambda_function.edge.qualified_arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_password_parameter" {
  description = "SSM Parameter Store path for RDS password"
  value       = aws_ssm_parameter.rds_password.name
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.main.id
}

output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "flow_logs_log_group" {
  description = "CloudWatch Logs group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "iam_mfa_policy_arn" {
  description = "ARN of the MFA enforcement policy"
  value       = aws_iam_policy.mfa_enforcement.arn
}

output "lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS database"
  value       = aws_security_group.rds.id
}

output "current_arn" {
  value = data.aws_caller_identity.current.arn
}

