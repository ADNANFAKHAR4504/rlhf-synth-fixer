# outputs.tf
# Output values for the secure content delivery system

output "test_url" {
  description = "Test URL for the content delivery system - always provides a valid endpoint for testing"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.content.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.content.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.content.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.content.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for content storage"
  value       = aws_s3_bucket.content.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for content storage"
  value       = aws_s3_bucket.content.arn
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.content.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.content.bucket_regional_domain_name
}

output "kms_key_id" {
  description = "KMS key ID for content encryption"
  value       = aws_kms_key.content_encryption.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for content encryption"
  value       = aws_kms_key.content_encryption.arn
}

output "kms_alias_name" {
  description = "KMS alias name for content encryption"
  value       = aws_kms_alias.content_encryption.name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID (only if domain is provided)"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].zone_id : null
}

output "route53_name_servers" {
  description = "Route 53 name servers (only if domain is provided)"
  value       = var.domain_name != "" ? aws_route53_zone.main[0].name_servers : null
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN (only if domain is provided)"
  value       = var.domain_name != "" ? aws_acm_certificate.content[0].arn : null
}

output "cloudfront_origin_access_identity_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.content.id
}

output "cloudfront_origin_access_identity_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.content.iam_arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.content_delivery.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN for audit logging"
  value       = var.enable_cloudtrail ? aws_cloudtrail.content_delivery[0].arn : null
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
}

output "website_url" {
  description = "Website URL (uses custom domain if provided, otherwise CloudFront default domain)"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.content.domain_name}"
}

output "content_delivery_summary" {
  description = "Summary of the content delivery system"
  value = {
    domain_name        = var.domain_name != "" ? var.domain_name : "No custom domain (using CloudFront default)"
    test_url           = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.content.domain_name}"
    cloudfront_domain  = aws_cloudfront_distribution.content.domain_name
    s3_bucket          = aws_s3_bucket.content.id
    encryption_enabled = true
    waf_enabled        = var.enable_waf
    cloudtrail_enabled = var.enable_cloudtrail
    monitoring_enabled = true
    cost_optimization  = "Lifecycle policies configured for S3 storage classes"
  }
}