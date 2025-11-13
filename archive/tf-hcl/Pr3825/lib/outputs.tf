# ============================================================================
# OUTPUTS
# ============================================================================

output "primary_alb_dns" {
  description = "DNS name of primary ALB"
  value       = module.alb_primary.alb_dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of secondary ALB"
  value       = module.alb_secondary.alb_dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster writer endpoint"
  value       = module.rds.primary_endpoint
}

output "primary_aurora_reader_endpoint" {
  description = "Primary Aurora cluster reader endpoint (Multi-AZ)"
  value       = module.rds.primary_reader_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB Global Table name"
  value       = module.dynamodb.table_name
}

output "lambda_failover_function" {
  description = "Lambda failover function ARN"
  value       = module.lambda.function_arn
}

output "sns_alerts_topic" {
  description = "SNS topic for DR alerts"
  value       = module.monitoring.sns_topic_arn
}

output "rto_rpo_summary" {
  description = "DR configuration summary"
  value = {
    rto_target           = "15 minutes"
    rpo_target           = "5 minutes"
    primary_region       = var.aws_region
    secondary_region     = var.secondary_region
    aurora_configuration = "Multi-AZ deployment with 2 instances across availability zones"
    dynamodb_replication = "Sub-second global replication"
    failover_automation  = "Lambda-based automated failover"
  }
}

output "route53_health_checks" {
  description = "Route53 health check IDs"
  value       = module.route53.health_checks
}

output "monitoring_alarms" {
  description = "CloudWatch alarm ARNs"
  value       = module.monitoring.alarm_arns
}

output "cost_optimization_notes" {
  description = "Cost optimization recommendations"
  value = {
    aurora_note          = "Using db.t3.medium instances for cost-effective Multi-AZ deployment"
    asg_standby_note     = "Secondary ASG starts with 0 capacity (warm standby pattern)"
    dynamodb_billing     = "PAY_PER_REQUEST billing mode - scales automatically"
    nat_gateway_note     = "Consider single NAT Gateway per region for cost savings in non-prod"
  }
}

output "backup_configuration" {
  description = "AWS Backup configuration details"
  value       = module.backup.backup_configuration
}

output "security_configuration" {
  description = "Security and WAF configuration"
  value = {
    waf_enabled           = "Yes - Primary ALB protected by WAFv2"
    waf_rules             = "Rate limiting (10k req/min), AWS Managed Common Rules, Known Bad Inputs"
    encryption_at_rest    = "Enabled for Aurora, DynamoDB, EBS volumes"
    encryption_in_transit = "TLS/SSL enforced for all data transfer"
  }
}

