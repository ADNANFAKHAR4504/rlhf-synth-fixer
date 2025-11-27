output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "Secondary ALB DNS name"
  value       = aws_lb.secondary.dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
  sensitive   = true
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
  sensitive   = true
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

output "primary_backup_vault_arn" {
  description = "Primary backup vault ARN"
  value       = aws_backup_vault.primary.arn
}

output "secondary_backup_vault_arn" {
  description = "Secondary backup vault ARN"
  value       = aws_backup_vault.secondary.arn
}

output "primary_cloudwatch_dashboard_url" {
  description = "Primary CloudWatch dashboard URL"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/deeplink.js?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.primary.dashboard_name}"
}

output "secondary_cloudwatch_dashboard_url" {
  description = "Secondary CloudWatch dashboard URL"
  value       = "https://${var.secondary_region}.console.aws.amazon.com/cloudwatch/deeplink.js?region=${var.secondary_region}#dashboards:name=${aws_cloudwatch_dashboard.secondary.dashboard_name}"
}
