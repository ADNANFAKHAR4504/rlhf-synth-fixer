# Outputs

output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = aws_lb.primary.dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.bucket
}

output "secondary_vpc_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "secondary_alb_dns" {
  description = "Secondary ALB DNS name"
  value       = aws_lb.secondary.dns_name
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_s3_bucket" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.bucket
}

output "global_cluster_id" {
  description = "Aurora Global Cluster ID"
  value       = aws_rds_global_cluster.main.id
}

output "route53_record_fqdn" {
  description = "Route 53 failover record FQDN (empty if domain_name not provided)"
  value       = var.domain_name != "" ? aws_route53_record.primary[0].fqdn : ""
}

output "primary_sns_topic_arn" {
  description = "Primary SNS topic ARN"
  value       = aws_sns_topic.primary_alarms.arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary SNS topic ARN"
  value       = aws_sns_topic.secondary_alarms.arn
}
