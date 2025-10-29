# Outputs for the multi-region VPC infrastructure

output "vpc_ids" {
  description = "VPC IDs for all regions"
  value = {
    "us-east-1"    = module.vpc_us_east_1.vpc_id
    "us-west-2"    = module.vpc_us_west_2.vpc_id
    "eu-central-1" = module.vpc_eu_central_1.vpc_id
  }
}

output "vpc_cidr_blocks" {
  description = "CIDR blocks for all VPCs"
  value = {
    "us-east-1"    = module.vpc_us_east_1.vpc_cidr_block
    "us-west-2"    = module.vpc_us_west_2.vpc_cidr_block
    "eu-central-1" = module.vpc_eu_central_1.vpc_cidr_block
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs for all regions"
  value = {
    "us-east-1"    = module.vpc_us_east_1.public_subnet_ids
    "us-west-2"    = module.vpc_us_west_2.public_subnet_ids
    "eu-central-1" = module.vpc_eu_central_1.public_subnet_ids
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for all regions"
  value = {
    "us-east-1"    = module.vpc_us_east_1.private_subnet_ids
    "us-west-2"    = module.vpc_us_west_2.private_subnet_ids
    "eu-central-1" = module.vpc_eu_central_1.private_subnet_ids
  }
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs for regions with NAT Gateways"
  value = {
    "us-east-1"    = contains(var.nat_gateway_regions, "us-east-1") ? module.vpc_us_east_1.nat_gateway_ids : []
    "us-west-2"    = contains(var.nat_gateway_regions, "us-west-2") ? module.vpc_us_west_2.nat_gateway_ids : []
    "eu-central-1" = contains(var.nat_gateway_regions, "eu-central-1") ? module.vpc_eu_central_1.nat_gateway_ids : []
  }
}

output "internet_gateway_ids" {
  description = "Internet Gateway IDs for all regions"
  value = {
    "us-east-1"    = module.vpc_us_east_1.internet_gateway_id
    "us-west-2"    = module.vpc_us_west_2.internet_gateway_id
    "eu-central-1" = module.vpc_eu_central_1.internet_gateway_id
  }
}

output "vpc_peering_connections" {
  description = "VPC peering connection IDs and status"
  value = {
    "us-east-1-to-us-west-2" = {
      id     = aws_vpc_peering_connection.us_east_1_to_us_west_2.id
      status = aws_vpc_peering_connection_accepter.us_east_1_to_us_west_2.accept_status
    }
    "us-west-2-to-eu-central-1" = {
      id     = aws_vpc_peering_connection.us_west_2_to_eu_central_1.id
      status = aws_vpc_peering_connection_accepter.us_west_2_to_eu_central_1.accept_status
    }
    "us-east-1-to-eu-central-1" = {
      id     = aws_vpc_peering_connection.us_east_1_to_eu_central_1.id
      status = aws_vpc_peering_connection_accepter.us_east_1_to_eu_central_1.accept_status
    }
  }
}

output "route53_resolver_endpoints" {
  description = "Route53 Resolver endpoint IDs (if enabled)"
  value = var.enable_route53_resolver ? {
    "us-east-1" = {
      inbound_endpoint_id  = module.route53_resolver_us_east_1[0].inbound_endpoint_id
      outbound_endpoint_id = module.route53_resolver_us_east_1[0].outbound_endpoint_id
    }
    "us-west-2" = {
      inbound_endpoint_id  = module.route53_resolver_us_west_2[0].inbound_endpoint_id
      outbound_endpoint_id = module.route53_resolver_us_west_2[0].outbound_endpoint_id
    }
    "eu-central-1" = {
      inbound_endpoint_id  = module.route53_resolver_eu_central_1[0].inbound_endpoint_id
      outbound_endpoint_id = module.route53_resolver_eu_central_1[0].outbound_endpoint_id
    }
  } : {}
}

# Cost optimization metrics
output "nat_gateway_count" {
  description = "Total number of NAT Gateways deployed"
  value = (
    (contains(var.nat_gateway_regions, "us-east-1") ? length(module.vpc_us_east_1.nat_gateway_ids) : 0) +
    (contains(var.nat_gateway_regions, "us-west-2") ? length(module.vpc_us_west_2.nat_gateway_ids) : 0) +
    (contains(var.nat_gateway_regions, "eu-central-1") ? length(module.vpc_eu_central_1.nat_gateway_ids) : 0)
  )
}

output "estimated_monthly_nat_cost" {
  description = "Estimated monthly NAT Gateway cost in USD (hourly rate + data processing estimate)"
  value = (
    (contains(var.nat_gateway_regions, "us-east-1") ? length(module.vpc_us_east_1.nat_gateway_ids) * 45 : 0) +
    (contains(var.nat_gateway_regions, "us-west-2") ? length(module.vpc_us_west_2.nat_gateway_ids) * 45 : 0) +
    (contains(var.nat_gateway_regions, "eu-central-1") ? length(module.vpc_eu_central_1.nat_gateway_ids) * 45 : 0)
  )
}

output "availability_zones_used" {
  description = "Availability zones used in each region"
  value = {
    "us-east-1"    = module.vpc_us_east_1.availability_zones
    "us-west-2"    = module.vpc_us_west_2.availability_zones
    "eu-central-1" = module.vpc_eu_central_1.availability_zones
  }
}
