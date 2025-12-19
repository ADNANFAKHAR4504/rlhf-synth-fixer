output "media_convert_queue_arn" {
  description = "ARN of the MediaConvert queue"
  value       = aws_media_convert_queue.main.arn
}

output "media_convert_role_arn" {
  description = "ARN of the MediaConvert IAM role"
  value       = aws_iam_role.media_convert.arn
}
