output "cloudtrail_id" {
  description = "ID of the CloudTrail"
  value       = aws_cloudtrail.this.id
}
