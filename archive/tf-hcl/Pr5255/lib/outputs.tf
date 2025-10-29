# VPC outputs
output "vpc_ids" {
  description = "IDs of all VPCs"
  value = {
    hub         = module.vpc_hub.vpc_id
    production  = module.vpc_production.vpc_id
    development = module.vpc_development.vpc_id
  }
}

output "vpc_cidrs" {
  description = "CIDR blocks of all VPCs"
  value = {
    hub         = module.vpc_hub.vpc_cidr
    production  = module.vpc_production.vpc_cidr
    development = module.vpc_development.vpc_cidr
  }
}

# Subnet outputs
output "subnet_ids" {
  description = "IDs of all subnets"
  value = {
    hub = {
      public  = module.vpc_hub.public_subnet_ids
      private = module.vpc_hub.private_subnet_ids
      tgw     = module.vpc_hub.tgw_attachment_subnet_ids
    }
    production = {
      public  = module.vpc_production.public_subnet_ids
      private = module.vpc_production.private_subnet_ids
      tgw     = module.vpc_production.tgw_attachment_subnet_ids
    }
    development = {
      public  = module.vpc_development.public_subnet_ids
      private = module.vpc_development.private_subnet_ids
      tgw     = module.vpc_development.tgw_attachment_subnet_ids
    }
  }
}

# Transit Gateway outputs
output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = module.transit_gateway.transit_gateway_id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = module.transit_gateway.transit_gateway_arn
}

output "transit_gateway_route_table_ids" {
  description = "IDs of Transit Gateway route tables"
  value = {
    hub   = module.transit_gateway.hub_route_table_id
    spoke = module.transit_gateway.spoke_route_table_id
  }
}

# NAT Gateway outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = var.enable_nat_gateway ? { for idx, gw in aws_nat_gateway.hub : idx => gw.id } : {}
}

output "nat_gateway_public_ips" {
  description = "Public IPs of NAT Gateways"
  value       = var.enable_nat_gateway ? { for idx, eip in aws_eip.nat : idx => eip.public_ip } : {}
}

# Route53 Resolver outputs
output "resolver_inbound_endpoint_ips" {
  description = "IP addresses of the inbound resolver endpoint"
  value       = var.enable_route53_resolver ? [for ip in aws_route53_resolver_endpoint.inbound[0].ip_address : ip.ip] : []
}

output "resolver_endpoint_ids" {
  description = "IDs of Route53 Resolver endpoints"
  value = var.enable_route53_resolver ? {
    inbound  = aws_route53_resolver_endpoint.inbound[0].id
    outbound = aws_route53_resolver_endpoint.outbound[0].id
  } : {}
}

# Systems Manager endpoints outputs
output "ssm_endpoint_dns_names" {
  description = "DNS names of Systems Manager VPC endpoints"
  value = var.enable_vpc_endpoints ? {
    hub = {
      ssm          = try(module.vpc_endpoints_hub[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_hub[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_hub[0].ec2_messages_endpoint_dns, "")
    }
    production = {
      ssm          = try(module.vpc_endpoints_production[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_production[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_production[0].ec2_messages_endpoint_dns, "")
    }
    development = {
      ssm          = try(module.vpc_endpoints_development[0].ssm_endpoint_dns, "")
      ssm_messages = try(module.vpc_endpoints_development[0].ssm_messages_endpoint_dns, "")
      ec2_messages = try(module.vpc_endpoints_development[0].ec2_messages_endpoint_dns, "")
    }
  } : {}
}

# Flow logs outputs
output "flow_logs_s3_bucket" {
  description = "Name of the S3 bucket for VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].s3_bucket_id : null
}

output "flow_log_ids" {
  description = "IDs of VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].flow_log_ids : {}
}

# Environment suffix output
output "environment_suffix" {
  description = "The environment suffix used for resource naming"
  value       = local.name_suffix
}

# Selected availability zones output
output "availability_zones" {
  description = "List of availability zones used"
  value       = local.selected_azs
}
