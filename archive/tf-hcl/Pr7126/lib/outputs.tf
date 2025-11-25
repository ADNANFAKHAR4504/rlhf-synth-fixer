# VPC Outputs
output "hub_vpc_id" {
  description = "Hub VPC ID"
  value       = module.hub_vpc.vpc_id
}

output "prod_vpc_id" {
  description = "Production VPC ID"
  value       = module.prod_vpc.vpc_id
}

output "dev_vpc_id" {
  description = "Development VPC ID"
  value       = module.dev_vpc.vpc_id
}

output "hub_vpc_cidr" {
  description = "Hub VPC CIDR block"
  value       = module.hub_vpc.vpc_cidr
}

output "prod_vpc_cidr" {
  description = "Production VPC CIDR block"
  value       = module.prod_vpc.vpc_cidr
}

output "dev_vpc_cidr" {
  description = "Development VPC CIDR block"
  value       = module.dev_vpc.vpc_cidr
}

# Transit Gateway Outputs
output "transit_gateway_id" {
  description = "Transit Gateway ID"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "Transit Gateway ARN"
  value       = aws_ec2_transit_gateway.main.arn
}

output "hub_tgw_attachment_id" {
  description = "Hub VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.hub.id
}

output "prod_tgw_attachment_id" {
  description = "Production VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.prod.id
}

output "dev_tgw_attachment_id" {
  description = "Development VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.dev.id
}

# NAT Gateway Outputs
output "hub_nat_gateway_ids" {
  description = "Hub VPC NAT Gateway IDs"
  value       = module.hub_vpc.nat_gateway_ids
}

# Flow Logs Outputs
output "flow_logs_s3_bucket" {
  description = "S3 bucket for VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].s3_bucket_id : null
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 Private Hosted Zone ID"
  value       = aws_route53_zone.internal.zone_id
}

output "route53_zone_name" {
  description = "Route53 Private Hosted Zone name"
  value       = aws_route53_zone.internal.name
}

# Subnet Outputs
output "hub_private_subnet_ids" {
  description = "Hub VPC private subnet IDs"
  value       = module.hub_vpc.private_subnet_ids
}

output "prod_private_subnet_ids" {
  description = "Production VPC private subnet IDs"
  value       = module.prod_vpc.private_subnet_ids
}

output "dev_private_subnet_ids" {
  description = "Development VPC private subnet IDs"
  value       = module.dev_vpc.private_subnet_ids
}
