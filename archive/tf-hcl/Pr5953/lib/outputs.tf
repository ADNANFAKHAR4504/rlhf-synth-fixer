# outputs.tf

# -----------------------------------------------------------------------------
# VPC PEERING CONNECTION OUTPUTS
# -----------------------------------------------------------------------------

output "vpc_peering_connection_id" {
  description = "The ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.production_to_partner.id
}

output "vpc_peering_connection_status" {
  description = "The status of the VPC peering connection"
  value       = aws_vpc_peering_connection.production_to_partner.accept_status
}

output "dns_resolution_enabled_requester" {
  description = "DNS resolution status for requester VPC"
  value       = aws_vpc_peering_connection.production_to_partner.requester[0].allow_remote_vpc_dns_resolution
}

output "dns_resolution_enabled_accepter" {
  description = "DNS resolution status for accepter VPC"
  value       = aws_vpc_peering_connection_accepter.partner_accept.accepter[0].allow_remote_vpc_dns_resolution
}

# -----------------------------------------------------------------------------
# VPC OUTPUTS
# -----------------------------------------------------------------------------

output "production_vpc_id" {
  description = "Production VPC ID"
  value       = aws_vpc.production.id
}

output "production_vpc_cidr" {
  description = "Production VPC CIDR block"
  value       = aws_vpc.production.cidr_block
}

output "partner_vpc_id" {
  description = "Partner VPC ID"
  value       = aws_vpc.partner.id
}

output "partner_vpc_cidr" {
  description = "Partner VPC CIDR block"
  value       = aws_vpc.partner.cidr_block
}

# -----------------------------------------------------------------------------
# ROUTE TABLE OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_route_table_ids" {
  description = "List of route table IDs for production application subnets"
  value       = aws_route_table.production_app[*].id
}

output "partner_app_route_table_ids" {
  description = "List of route table IDs for partner application subnets"
  value       = aws_route_table.partner_app[*].id
}

output "production_peering_route_count" {
  description = "Number of peering routes configured in production VPC"
  value       = length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)
}

output "partner_peering_route_count" {
  description = "Number of peering routes configured in partner VPC"
  value       = length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs)
}

output "total_configured_routes" {
  description = "Total number of peering routes configured across both VPCs"
  value       = (length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)) + (length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs))
}

# -----------------------------------------------------------------------------
# SECURITY GROUP OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_security_group_id" {
  description = "Security group ID for production application servers"
  value       = aws_security_group.production_app.id
}

output "partner_app_security_group_id" {
  description = "Security group ID for partner application servers"
  value       = aws_security_group.partner_app.id
}

# -----------------------------------------------------------------------------
# MONITORING OUTPUTS
# -----------------------------------------------------------------------------

output "flow_logs_bucket_name" {
  description = "S3 bucket name for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.bucket
}

output "flow_logs_bucket_arn" {
  description = "S3 bucket ARN for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "production_flow_log_id" {
  description = "Production VPC Flow Log ID"
  value       = aws_flow_log.production_vpc.id
}

output "partner_flow_log_id" {
  description = "Partner VPC Flow Log ID"
  value       = aws_flow_log.partner_vpc.id
}

output "alarm_topic_arn" {
  description = "SNS topic ARN for peering alarms"
  value       = aws_sns_topic.peering_alarms.arn
}

# -----------------------------------------------------------------------------
# IAM OUTPUTS
# -----------------------------------------------------------------------------

output "vpc_peering_role_arn" {
  description = "ARN of the IAM role for VPC peering operations"
  value       = aws_iam_role.vpc_peering.arn
}

output "flow_logs_role_arn" {
  description = "ARN of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.flow_logs.arn
}

# -----------------------------------------------------------------------------
# SUBNET OUTPUTS
# -----------------------------------------------------------------------------

output "production_app_subnet_ids" {
  description = "List of production application subnet IDs"
  value       = aws_subnet.production_app[*].id
}

output "partner_app_subnet_ids" {
  description = "List of partner application subnet IDs"
  value       = aws_subnet.partner_app[*].id
}

# -----------------------------------------------------------------------------
# CONFIGURATION SUMMARY
# -----------------------------------------------------------------------------

output "configuration_summary" {
  description = "Summary of the VPC peering configuration"
  value = {
    peering_connection_id         = aws_vpc_peering_connection.production_to_partner.id
    dns_resolution_enabled        = var.enable_dns_resolution
    production_vpc_cidr           = local.production_vpc_cidr
    partner_vpc_cidr              = local.partner_vpc_cidr
    allowed_ports                 = local.allowed_ports
    flow_log_aggregation_interval = "${local.flow_log_aggregation_interval} seconds"
    total_routes_configured       = (length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)) + (length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs))
  }
}