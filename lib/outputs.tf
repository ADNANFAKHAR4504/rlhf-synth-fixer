output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "rds_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "rds_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = try(aws_lb.main.dns_name, "")
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = try(aws_cloudfront_distribution.main.domain_name, "")
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.key_id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = length(aws_guardduty_detector.main) > 0 ? aws_guardduty_detector.main[0].id : data.aws_guardduty_detector.existing.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}