# outputs.tf

output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "ARN of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.arn
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = local.cloudfront_distribution.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = local.cloudfront_distribution.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = local.cloudfront_distribution.arn
}

output "website_url" {
  description = "URL of the website"
  value       = var.domain_name != "" && var.create_dns_records ? "https://${var.domain_name}" : "https://${local.cloudfront_distribution.domain_name}"
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = var.domain_name != "" && var.create_dns_records ? aws_acm_certificate.website[0].arn : null
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = var.domain_name != "" && var.create_dns_records ? data.aws_route53_zone.main[0].zone_id : null
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.website.dashboard_name}"
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alerts"
  value       = aws_sns_topic.alerts.arn
}