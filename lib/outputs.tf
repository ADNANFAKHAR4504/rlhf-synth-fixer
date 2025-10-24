output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = module.dynamodb.table_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = module.sns_sqs.topic_arn
}

output "sqs_queue_urls" {
  description = "SQS queue URLs"
  value       = module.sns_sqs.queue_urls
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.endpoint
}

output "opensearch_endpoint" {
  description = "OpenSearch endpoint"
  value       = module.opensearch.endpoint
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}
