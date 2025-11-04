resource "aws_ec2_transit_gateway_route" "hub_to_uswest" {
  provider = aws.hub

  destination_cidr_block         = var.uswest_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_uswest_peering.peering_attachment_id
  transit_gateway_route_table_id = module.hub_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.hub_uswest_peering]
}

resource "aws_ec2_transit_gateway_route" "hub_to_europe" {
  provider = aws.hub

  destination_cidr_block         = var.europe_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_europe_peering.peering_attachment_id
  transit_gateway_route_table_id = module.hub_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.hub_europe_peering]
}

resource "aws_ec2_transit_gateway_route" "uswest_to_hub" {
  provider = aws.us_west

  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_uswest_peering.peering_attachment_id
  transit_gateway_route_table_id = module.uswest_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.uswest_hub_peering]
}

resource "aws_ec2_transit_gateway_route" "uswest_to_europe" {
  provider = aws.us_west

  destination_cidr_block         = var.europe_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_uswest_peering.peering_attachment_id
  transit_gateway_route_table_id = module.uswest_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.uswest_hub_peering]
}

resource "aws_ec2_transit_gateway_route" "europe_to_hub" {
  provider = aws.europe

  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_europe_peering.peering_attachment_id
  transit_gateway_route_table_id = module.europe_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.europe_hub_peering]
}

resource "aws_ec2_transit_gateway_route" "europe_to_uswest" {
  provider = aws.europe

  destination_cidr_block         = var.uswest_vpc_cidr
  transit_gateway_attachment_id  = module.hub_to_europe_peering.peering_attachment_id
  transit_gateway_route_table_id = module.europe_tgw.production_route_table_id

  depends_on = [aws_ec2_transit_gateway_route_table_association.europe_hub_peering]
}

resource "aws_route" "hub_public_to_uswest" {
  provider = aws.hub

  route_table_id         = module.hub_vpc.public_route_table_id
  destination_cidr_block = var.uswest_vpc_cidr
  transit_gateway_id     = module.hub_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "hub_public_to_europe" {
  provider = aws.hub

  route_table_id         = module.hub_vpc.public_route_table_id
  destination_cidr_block = var.europe_vpc_cidr
  transit_gateway_id     = module.hub_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "hub_private_to_uswest" {
  provider = aws.hub
  count    = length(module.hub_vpc.private_route_table_ids)

  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.uswest_vpc_cidr
  transit_gateway_id     = module.hub_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "hub_private_to_europe" {
  provider = aws.hub
  count    = length(module.hub_vpc.private_route_table_ids)

  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.europe_vpc_cidr
  transit_gateway_id     = module.hub_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "uswest_public_to_hub" {
  provider = aws.us_west

  route_table_id         = module.uswest_vpc.public_route_table_id
  destination_cidr_block = var.hub_vpc_cidr
  transit_gateway_id     = module.uswest_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.uswest]
}

resource "aws_route" "uswest_public_to_europe" {
  provider = aws.us_west

  route_table_id         = module.uswest_vpc.public_route_table_id
  destination_cidr_block = var.europe_vpc_cidr
  transit_gateway_id     = module.uswest_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.uswest]
}

resource "aws_route" "uswest_private_to_hub" {
  provider = aws.us_west
  count    = length(module.uswest_vpc.private_route_table_ids)

  route_table_id         = module.uswest_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.hub_vpc_cidr
  transit_gateway_id     = module.uswest_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.uswest]
}

resource "aws_route" "uswest_private_to_europe" {
  provider = aws.us_west
  count    = length(module.uswest_vpc.private_route_table_ids)

  route_table_id         = module.uswest_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.europe_vpc_cidr
  transit_gateway_id     = module.uswest_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.uswest]
}

resource "aws_route" "europe_public_to_hub" {
  provider = aws.europe

  route_table_id         = module.europe_vpc.public_route_table_id
  destination_cidr_block = var.hub_vpc_cidr
  transit_gateway_id     = module.europe_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.europe]
}

resource "aws_route" "europe_public_to_uswest" {
  provider = aws.europe

  route_table_id         = module.europe_vpc.public_route_table_id
  destination_cidr_block = var.uswest_vpc_cidr
  transit_gateway_id     = module.europe_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.europe]
}

resource "aws_route" "europe_private_to_hub" {
  provider = aws.europe
  count    = length(module.europe_vpc.private_route_table_ids)

  route_table_id         = module.europe_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.hub_vpc_cidr
  transit_gateway_id     = module.europe_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.europe]
}

resource "aws_route" "europe_private_to_uswest" {
  provider = aws.europe
  count    = length(module.europe_vpc.private_route_table_ids)

  route_table_id         = module.europe_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.uswest_vpc_cidr
  transit_gateway_id     = module.europe_tgw.transit_gateway_id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.europe]
}
