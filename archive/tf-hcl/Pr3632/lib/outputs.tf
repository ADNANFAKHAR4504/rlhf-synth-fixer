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
  description = "Main application endpoint with Global Accelerator failover"
  value       = length(module.failover_mechanism) > 0 ? "http://${module.failover_mechanism[0].global_accelerator_dns_name}" : null
}

output "global_accelerator_ips" {
  description = "Global Accelerator IP addresses for direct access"
  value       = length(module.failover_mechanism) > 0 ? module.failover_mechanism[0].global_accelerator_ip_addresses : null
}

output "health_check_urls" {
  description = "Health check URLs"
  value = {
    primary   = "http://${module.primary_compute.alb_dns}/health"
    secondary = "http://${module.secondary_compute.alb_dns}/health"
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
