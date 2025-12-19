# outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = module.content_delivery.distribution_id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = module.content_delivery.distribution_domain_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for video storage"
  value       = module.storage.bucket_name
}

output "media_convert_queue_arn" {
  description = "The ARN of the MediaConvert queue"
  value       = module.media_processing.media_convert_queue_arn
}

output "waf_web_acl_id" {
  description = "The ID of the WAF Web ACL"
  value       = module.security.waf_web_acl_id
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}