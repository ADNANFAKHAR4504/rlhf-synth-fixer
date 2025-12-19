output "primary_vpc_id" {
  description = "VPC ID in primary region"
  value       = module.primary_region.vpc_id
}

output "secondary_vpc_id" {
  description = "VPC ID in secondary region"
  value       = module.secondary_region.vpc_id
}

output "primary_rds_endpoint" {
  description = "RDS cluster endpoint in primary region"
  value       = module.primary_region.rds_cluster_endpoint
}

output "secondary_rds_endpoint" {
  description = "RDS cluster endpoint in secondary region"
  value       = module.secondary_region.rds_cluster_endpoint
}

output "global_cluster_id" {
  description = "Aurora global cluster identifier"
  value       = aws_rds_global_cluster.main.id
}

output "primary_s3_bucket" {
  description = "S3 bucket name in primary region"
  value       = module.s3_replication.primary_bucket_name
}

output "secondary_s3_bucket" {
  description = "S3 bucket name in secondary region"
  value       = module.s3_replication.secondary_bucket_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "route53_nameservers" {
  description = "Route 53 nameservers"
  value       = module.route53_failover.nameservers
}

output "failover_domain" {
  description = "Failover domain name"
  value       = module.route53_failover.failover_domain
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.cloudwatch_monitoring.sns_topic_arn
}
