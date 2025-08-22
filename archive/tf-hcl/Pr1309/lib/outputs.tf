output "primary_alb_dns" {
  description = "DNS name of the primary Application Load Balancer"
  value       = aws_lb.primary.dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of the secondary Application Load Balancer"
  value       = aws_lb.secondary.dns_name
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "primary_db_endpoint" {
  description = "Primary RDS instance endpoint"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "secondary_db_endpoint" {
  description = "Secondary RDS read replica endpoint"
  value       = aws_db_instance.secondary_replica.endpoint
  sensitive   = true
}

output "arc_cluster_arn" {
  description = "Application Recovery Controller cluster ARN"
  value       = aws_route53recoverycontrolconfig_cluster.main.arn
}

output "arc_control_panel_arn" {
  description = "Application Recovery Controller control panel ARN"
  value       = aws_route53recoverycontrolconfig_control_panel.main.arn
}

output "primary_routing_control_arn" {
  description = "Primary region routing control ARN"
  value       = aws_route53recoverycontrolconfig_routing_control.primary.arn
}

output "secondary_routing_control_arn" {
  description = "Secondary region routing control ARN"
  value       = aws_route53recoverycontrolconfig_routing_control.secondary.arn
}

output "sns_topic_arn_primary" {
  description = "SNS topic ARN for primary region alerts"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_arn_secondary" {
  description = "SNS topic ARN for secondary region alerts"
  value       = aws_sns_topic.alerts_secondary.arn
}

output "application_url" {
  description = "Main application URL using Route 53"
  value       = "http://${aws_route53_zone.main.name}"
}

output "secrets_manager_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_rds_endpoint" {
  description = "Primary RDS instance endpoint"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}