output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = module.vpc_dr.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
}

output "dr_cluster_endpoint" {
  description = "DR Aurora cluster endpoint"
  value       = module.aurora_global.dr_cluster_endpoint
}

output "primary_ecs_cluster_name" {
  description = "Primary ECS cluster name"
  value       = module.ecs_primary.cluster_name
}

output "dr_ecs_cluster_name" {
  description = "DR ECS cluster name"
  value       = module.ecs_dr.cluster_name
}

output "primary_lb_dns_name" {
  description = "Primary load balancer DNS name"
  value       = module.ecs_primary.lb_dns_name
}

output "dr_lb_dns_name" {
  description = "DR load balancer DNS name"
  value       = module.ecs_dr.lb_dns_name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "failover_domain" {
  description = "Failover domain name"
  value       = module.route53_failover.failover_domain
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
