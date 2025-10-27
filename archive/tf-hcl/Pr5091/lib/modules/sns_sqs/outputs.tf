output "topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.feature_flags.arn
}

output "queue_urls" {
  description = "SQS queue URLs"
  value       = aws_sqs_queue.microservice[*].id
}

output "queue_arns" {
  description = "SQS queue ARNs"
  value       = aws_sqs_queue.microservice[*].arn
}

output "dlq_arns" {
  description = "Dead letter queue ARNs"
  value       = aws_sqs_queue.dlq[*].arn
}
