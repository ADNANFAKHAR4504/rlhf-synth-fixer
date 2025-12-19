output "environment_suffix" {
  description = "The environment suffix used for resource naming"
  value       = local.env_suffix
}

output "hub_vpc_id" {
  description = "ID of the hub VPC"
  value       = module.hub_vpc.vpc_id
}

output "hub_vpc_cidr" {
  description = "CIDR block of the hub VPC"
  value       = module.hub_vpc.vpc_cidr
}

output "hub_public_subnet_ids" {
  description = "List of hub VPC public subnet IDs"
  value       = module.hub_vpc.public_subnet_ids
}

output "hub_private_subnet_ids" {
  description = "List of hub VPC private subnet IDs"
  value       = module.hub_vpc.private_subnet_ids
}

output "uswest_vpc_id" {
  description = "ID of the US West spoke VPC"
  value       = module.uswest_vpc.vpc_id
}

output "uswest_vpc_cidr" {
  description = "CIDR block of the US West spoke VPC"
  value       = module.uswest_vpc.vpc_cidr
}

output "uswest_public_subnet_ids" {
  description = "List of US West VPC public subnet IDs"
  value       = module.uswest_vpc.public_subnet_ids
}

output "uswest_private_subnet_ids" {
  description = "List of US West VPC private subnet IDs"
  value       = module.uswest_vpc.private_subnet_ids
}

output "europe_vpc_id" {
  description = "ID of the Europe spoke VPC"
  value       = module.europe_vpc.vpc_id
}

output "europe_vpc_cidr" {
  description = "CIDR block of the Europe spoke VPC"
  value       = module.europe_vpc.vpc_cidr
}

output "europe_public_subnet_ids" {
  description = "List of Europe VPC public subnet IDs"
  value       = module.europe_vpc.public_subnet_ids
}

output "europe_private_subnet_ids" {
  description = "List of Europe VPC private subnet IDs"
  value       = module.europe_vpc.private_subnet_ids
}

output "hub_tgw_id" {
  description = "ID of the hub Transit Gateway"
  value       = module.hub_tgw.transit_gateway_id
}

output "hub_tgw_arn" {
  description = "ARN of the hub Transit Gateway"
  value       = module.hub_tgw.transit_gateway_arn
}

output "uswest_tgw_id" {
  description = "ID of the US West Transit Gateway"
  value       = module.uswest_tgw.transit_gateway_id
}

output "uswest_tgw_arn" {
  description = "ARN of the US West Transit Gateway"
  value       = module.uswest_tgw.transit_gateway_arn
}

output "europe_tgw_id" {
  description = "ID of the Europe Transit Gateway"
  value       = module.europe_tgw.transit_gateway_id
}

output "europe_tgw_arn" {
  description = "ARN of the Europe Transit Gateway"
  value       = module.europe_tgw.transit_gateway_arn
}

output "hub_to_uswest_peering_id" {
  description = "ID of the hub to US West peering attachment"
  value       = module.hub_to_uswest_peering.peering_attachment_id
}

output "hub_to_europe_peering_id" {
  description = "ID of the hub to Europe peering attachment"
  value       = module.hub_to_europe_peering.peering_attachment_id
}

output "route53_zone_id" {
  description = "ID of the Route53 private hosted zone"
  value       = module.route53_zone.zone_id
}

output "route53_zone_name" {
  description = "Name of the Route53 private hosted zone"
  value       = module.route53_zone.zone_name
}

output "flow_logs_bucket_name" {
  description = "Name of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_logs_bucket_arn" {
  description = "ARN of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "hub_ssm_endpoint_id" {
  description = "ID of the hub SSM VPC endpoint"
  value       = module.hub_vpc_endpoints.ssm_endpoint_id
}

output "uswest_ssm_endpoint_id" {
  description = "ID of the US West SSM VPC endpoint"
  value       = module.uswest_vpc_endpoints.ssm_endpoint_id
}

output "europe_ssm_endpoint_id" {
  description = "ID of the Europe SSM VPC endpoint"
  value       = module.europe_vpc_endpoints.ssm_endpoint_id
}

output "hub_nat_gateway_ids" {
  description = "List of hub NAT Gateway IDs"
  value       = module.hub_vpc.nat_gateway_ids
}

output "uswest_nat_gateway_ids" {
  description = "List of US West NAT Gateway IDs"
  value       = module.uswest_vpc.nat_gateway_ids
}

output "europe_nat_gateway_ids" {
  description = "List of Europe NAT Gateway IDs"
  value       = module.europe_vpc.nat_gateway_ids
}

output "hub_flow_log_id" {
  description = "ID of the hub VPC Flow Log"
  value       = module.hub_flow_logs.flow_log_id
}

output "uswest_flow_log_id" {
  description = "ID of the US West VPC Flow Log"
  value       = module.uswest_flow_logs.flow_log_id
}

output "europe_flow_log_id" {
  description = "ID of the Europe VPC Flow Log"
  value       = module.europe_flow_logs.flow_log_id
}
