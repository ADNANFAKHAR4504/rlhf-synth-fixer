output "primary_alb_dns" {
  description = "DNS name of primary ALB"
  value       = module.primary_compute.alb_dns
}

output "secondary_alb_dns" {
  description = "DNS name of secondary ALB"
  value       = module.secondary_compute.alb_dns
}

output "primary_db_endpoint" {
  description = "Primary database endpoint"
  value       = module.primary_database.endpoint
  sensitive   = true
}

output "secondary_db_endpoint" {
  description = "Secondary database endpoint"
  value       = module.secondary_database.endpoint
  sensitive   = true
}

output "failover_endpoint" {
  description = "Main application endpoint with failover"
  value       = "https://${var.application_name}.${var.company_name}.com"
}

output "health_check_urls" {
  description = "Health check URLs"
  value = {
    primary   = "https://${module.primary_compute.alb_dns}/health"
    secondary = "https://${module.secondary_compute.alb_dns}/health"
  }
}

output "primary_region" {
  description = "Primary region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary region"
  value       = var.secondary_region
}

output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = module.primary_networking.vpc_id
    secondary = module.secondary_networking.vpc_id
  }
}
