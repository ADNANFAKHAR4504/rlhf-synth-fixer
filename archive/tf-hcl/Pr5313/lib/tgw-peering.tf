module "hub_to_uswest_peering" {
  source = "./modules/transit-gateway-peering"

  providers = {
    aws = aws.hub
  }

  local_tgw_id       = module.hub_tgw.transit_gateway_id
  peer_tgw_id        = module.uswest_tgw.transit_gateway_id
  peer_region        = "us-west-2"
  peering_name       = "hub-to-uswest-peering"
  environment_suffix = local.env_suffix
  project_tags       = local.common_tags

  depends_on = [module.hub_tgw, module.uswest_tgw]
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "uswest" {
  provider = aws.us_west

  transit_gateway_attachment_id = module.hub_to_uswest_peering.peering_attachment_id

  tags = merge(
    local.common_tags,
    {
      Name = "uswest-accepts-hub-peering-${local.env_suffix}"
    }
  )
}

module "hub_to_europe_peering" {
  source = "./modules/transit-gateway-peering"

  providers = {
    aws = aws.hub
  }

  local_tgw_id       = module.hub_tgw.transit_gateway_id
  peer_tgw_id        = module.europe_tgw.transit_gateway_id
  peer_region        = "eu-west-1"
  peering_name       = "hub-to-europe-peering"
  environment_suffix = local.env_suffix
  project_tags       = local.common_tags

  depends_on = [module.hub_tgw, module.europe_tgw]
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "europe" {
  provider = aws.europe

  transit_gateway_attachment_id = module.hub_to_europe_peering.peering_attachment_id

  tags = merge(
    local.common_tags,
    {
      Name = "europe-accepts-hub-peering-${local.env_suffix}"
    }
  )
}

resource "aws_ec2_transit_gateway_route_table_association" "hub_uswest_peering" {
  provider = aws.hub

  transit_gateway_attachment_id  = module.hub_to_uswest_peering.peering_attachment_id
  transit_gateway_route_table_id = module.hub_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.uswest]
}

resource "aws_ec2_transit_gateway_route_table_association" "hub_europe_peering" {
  provider = aws.hub

  transit_gateway_attachment_id  = module.hub_to_europe_peering.peering_attachment_id
  transit_gateway_route_table_id = module.hub_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.europe]
}

resource "aws_ec2_transit_gateway_route_table_association" "uswest_hub_peering" {
  provider = aws.us_west

  transit_gateway_attachment_id  = module.hub_to_uswest_peering.peering_attachment_id
  transit_gateway_route_table_id = module.uswest_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.uswest]
}

resource "aws_ec2_transit_gateway_route_table_association" "europe_hub_peering" {
  provider = aws.europe

  transit_gateway_attachment_id  = module.hub_to_europe_peering.peering_attachment_id
  transit_gateway_route_table_id = module.europe_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.europe]
}
