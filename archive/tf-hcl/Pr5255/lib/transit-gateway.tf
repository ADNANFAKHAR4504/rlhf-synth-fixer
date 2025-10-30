# Create Transit Gateway
module "transit_gateway" {
  source = "./modules/transit-gateway"

  name_prefix     = "shared-${var.region}"
  name_suffix     = local.name_suffix
  amazon_side_asn = var.transit_gateway_asn

  vpc_attachments = {
    hub = {
      vpc_id     = module.vpc_hub.vpc_id
      subnet_ids = module.vpc_hub.tgw_attachment_subnet_ids
      cidr_block = var.hub_vpc_cidr
    }
    production = {
      vpc_id     = module.vpc_production.vpc_id
      subnet_ids = module.vpc_production.tgw_attachment_subnet_ids
      cidr_block = var.production_vpc_cidr
    }
    development = {
      vpc_id     = module.vpc_development.vpc_id
      subnet_ids = module.vpc_development.tgw_attachment_subnet_ids
      cidr_block = var.development_vpc_cidr
    }
  }

  tags = merge(local.common_tags, {
    Environment = "shared"
    Purpose     = "connectivity"
  })

  depends_on = [
    module.vpc_hub,
    module.vpc_production,
    module.vpc_development
  ]
}

# Add routes in VPC route tables to Transit Gateway
# Hub VPC routes to spokes
resource "aws_route" "hub_to_production" {
  count = length(module.vpc_hub.private_route_table_ids)

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = var.production_vpc_cidr
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "hub_to_development" {
  count = length(module.vpc_hub.private_route_table_ids)

  route_table_id         = module.vpc_hub.private_route_table_ids[count.index]
  destination_cidr_block = var.development_vpc_cidr
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

# Spoke VPC routes to Transit Gateway (default route)
resource "aws_route" "production_default" {
  route_table_id         = module.vpc_production.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "production_public_default" {
  route_table_id         = module.vpc_production.public_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "development_default" {
  route_table_id         = module.vpc_development.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}

resource "aws_route" "development_public_default" {
  route_table_id         = module.vpc_development.public_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = module.transit_gateway.transit_gateway_id

  depends_on = [module.transit_gateway]
}
