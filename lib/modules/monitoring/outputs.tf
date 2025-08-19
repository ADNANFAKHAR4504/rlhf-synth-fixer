output "cloudtrail_arn" {
  description = "The ARN of the CloudTrail"
  value       = data.aws_cloudtrail.main.arn
}
