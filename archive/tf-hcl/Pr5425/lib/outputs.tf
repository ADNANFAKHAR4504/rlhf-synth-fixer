# Hub VPC Outputs
output "hub_vpc_id" {
  description = "ID of the hub VPC"
  value       = module.hub_vpc.vpc_id
}

output "hub_vpc_cidr" {
  description = "CIDR block of the hub VPC"
  value       = module.hub_vpc.vpc_cidr
}

output "hub_private_subnet_ids" {
  description = "Private subnet IDs in the hub VPC"
  value       = module.hub_vpc.private_subnet_ids
}

output "hub_public_subnet_ids" {
  description = "Public subnet IDs in the hub VPC"
  value       = module.hub_vpc.public_subnet_ids
}

# Spoke VPC Outputs
output "us_west_spoke_vpc_id" {
  description = "ID of the AP-Northeast-1 spoke VPC"
  value       = module.us_west_spoke_vpc.vpc_id
}

output "eu_west_spoke_vpc_id" {
  description = "ID of the US-West-1 spoke VPC"
  value       = module.eu_west_spoke_vpc.vpc_id
}

# Transit Gateway Outputs
output "hub_transit_gateway_id" {
  description = "ID of the hub Transit Gateway"
  value       = aws_ec2_transit_gateway.hub.id
}

output "hub_transit_gateway_arn" {
  description = "ARN of the hub Transit Gateway"
  value       = aws_ec2_transit_gateway.hub.arn
}

output "transit_gateway_route_table_ids" {
  description = "Transit Gateway route table IDs"
  value = {
    hub           = aws_ec2_transit_gateway_route_table.hub.id
    us_west_spoke = aws_ec2_transit_gateway_route_table.us_west_spoke.id
    eu_west_spoke = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
  }
}

# Route53 Outputs (conditional)
output "private_hosted_zone_id" {
  description = "ID of the private hosted zone"
  value       = var.enable_route53 ? aws_route53_zone.private[0].zone_id : null
}

output "private_hosted_zone_name" {
  description = "Name of the private hosted zone"
  value       = var.enable_route53 ? aws_route53_zone.private[0].name : null
}

# Flow Logs Outputs
output "flow_logs_s3_bucket" {
  description = "S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_logs_s3_bucket_arn" {
  description = "ARN of S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

# VPC Endpoints Outputs
output "ssm_endpoint_ids" {
  description = "IDs of Systems Manager VPC endpoints"
  value = {
    hub = {
      for k, v in aws_vpc_endpoint.ssm_hub : k => v.id
    }
    us_west = {
      for k, v in aws_vpc_endpoint.ssm_us_west : k => v.id
    }
    eu_west = {
      for k, v in aws_vpc_endpoint.ssm_eu_west : k => v.id
    }
  }
}

output "ssm_endpoint_dns_names" {
  description = "DNS names of Systems Manager VPC endpoints"
  value = {
    hub = {
      for k, v in aws_vpc_endpoint.ssm_hub : k => v.dns_entry[0].dns_name
    }
    us_west = {
      for k, v in aws_vpc_endpoint.ssm_us_west : k => v.dns_entry[0].dns_name
    }
    eu_west = {
      for k, v in aws_vpc_endpoint.ssm_eu_west : k => v.dns_entry[0].dns_name
    }
  }
}