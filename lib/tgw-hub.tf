module "hub_tgw" {
  source = "./modules/transit-gateway"

  providers = {
    aws = aws.hub
  }

  environment        = var.environment
  region             = "us-east-1"
  amazon_side_asn    = var.hub_tgw_asn
  tgw_name           = "hub-tgw"
  environment_suffix = local.env_suffix
  project_tags       = merge(local.common_tags, { Purpose = "hub" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  provider = aws.hub

  subnet_ids         = module.hub_vpc.private_subnet_ids
  transit_gateway_id = module.hub_tgw.transit_gateway_id
  vpc_id             = module.hub_vpc.vpc_id
  dns_support        = "enable"

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(
    local.common_tags,
    {
      Name        = "hub-vpc-attachment-${local.env_suffix}"
      Environment = var.environment
      Purpose     = "hub"
    }
  )
}

resource "aws_ec2_transit_gateway_route_table_association" "hub_production" {
  provider = aws.hub

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = module.hub_tgw.production_route_table_id
}
