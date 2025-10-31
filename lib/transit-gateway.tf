# Transit Gateway in Hub Region
resource "aws_ec2_transit_gateway" "hub" {
  provider                        = aws.hub
  description                     = "Hub Transit Gateway for Trading Platform"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(var.common_tags, {
    Name = "hub-tgw"
    Type = "hub"
  })
}

# Transit Gateway Route Table for Hub
resource "aws_ec2_transit_gateway_route_table" "hub" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-tgw-rtb"
  })
}

# Transit Gateway Route Tables for Spokes
resource "aws_ec2_transit_gateway_route_table" "us_west_spoke" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "ap-northeast-1-spoke-tgw-rtb"
  })
}

resource "aws_ec2_transit_gateway_route_table" "eu_west_spoke" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "ap-southeast-2-spoke-tgw-rtb"
  })
}

# Transit Gateway attachment for Hub VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  provider                                        = aws.hub
  subnet_ids                                      = module.hub_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.hub.id
  vpc_id                                          = module.hub_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "hub-vpc-tgw-attachment"
  })
}

# Transit Gateway Peering for AP-Northeast-1
resource "aws_ec2_transit_gateway_peering_attachment" "us_west" {
  provider                = aws.hub
  peer_region             = var.spoke_regions["ap-northeast-1"]
  peer_transit_gateway_id = aws_ec2_transit_gateway.us_west_spoke.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-to-ap-northeast-1-peering"
  })
}

# Transit Gateway in AP-Northeast-1 Spoke
resource "aws_ec2_transit_gateway" "us_west_spoke" {
  provider                        = aws.us_west
  description                     = "AP-Northeast-1 Spoke Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"

  tags = merge(var.common_tags, {
    Name = "ap-northeast-1-spoke-tgw"
    Type = "spoke"
  })
}

# Transit Gateway attachment for AP-Northeast-1 Spoke VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "us_west_spoke" {
  provider                                        = aws.us_west
  subnet_ids                                      = module.us_west_spoke_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.us_west_spoke.id
  vpc_id                                          = module.us_west_spoke_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "ap-northeast-1-vpc-tgw-attachment"
  })
}

# Transit Gateway Peering for US-West-1
resource "aws_ec2_transit_gateway_peering_attachment" "eu_west" {
  provider                = aws.hub
  peer_region             = var.spoke_regions["ap-southeast-2"]
  peer_transit_gateway_id = aws_ec2_transit_gateway.eu_west_spoke.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-to-ap-southeast-2-peering"
  })
}

# Transit Gateway in US-West-1 Spoke
resource "aws_ec2_transit_gateway" "eu_west_spoke" {
  provider                        = aws.eu_west
  description                     = "US-West-1 Spoke Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"

  tags = merge(var.common_tags, {
    Name = "ap-southeast-2-spoke-tgw"
    Type = "spoke"
  })
}

# Transit Gateway attachment for US-West-1 Spoke VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "eu_west_spoke" {
  provider                                        = aws.eu_west
  subnet_ids                                      = module.eu_west_spoke_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.eu_west_spoke.id
  vpc_id                                          = module.eu_west_spoke_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "ap-southeast-2-vpc-tgw-attachment"
  })
}

# Accept peering attachments
resource "aws_ec2_transit_gateway_peering_attachment_accepter" "us_west" {
  provider                      = aws.us_west
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.us_west.id

  tags = merge(var.common_tags, {
    Name = "ap-northeast-1-peering-accepter"
  })
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "eu_west" {
  provider                      = aws.eu_west
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.eu_west.id

  tags = merge(var.common_tags, {
    Name = "ap-southeast-2-peering-accepter"
  })
}

# Route table associations
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route_table_association" "us_west_peering" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.us_west]
}

resource "aws_ec2_transit_gateway_route_table_association" "eu_west_peering" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.eu_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_peering_attachment_accepter.eu_west]
}

# Routes - Hub can reach all spokes
resource "aws_ec2_transit_gateway_route" "hub_to_us_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["ap-northeast-1"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.us_west_peering]
}

resource "aws_ec2_transit_gateway_route" "hub_to_eu_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["ap-southeast-2"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.eu_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.eu_west_peering]
}

# Routes - Spokes to hub and other spoke (through hub)
resource "aws_ec2_transit_gateway_route" "us_west_to_hub" {
  provider                       = aws.hub
  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.us_west_peering]
}

resource "aws_ec2_transit_gateway_route" "us_west_to_eu_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["ap-southeast-2"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.us_west_peering]
}

resource "aws_ec2_transit_gateway_route" "eu_west_to_hub" {
  provider                       = aws.hub
  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.eu_west_peering]
}

resource "aws_ec2_transit_gateway_route" "eu_west_to_us_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["ap-northeast-1"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_route_table_association.eu_west_peering]
}

# Blackhole routes for unused RFC1918 ranges
locals {
  rfc1918_ranges = ["172.16.0.0/12", "192.168.0.0/16"]
}

resource "aws_ec2_transit_gateway_route" "blackhole_hub" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route" "blackhole_us_west" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id
}

resource "aws_ec2_transit_gateway_route" "blackhole_eu_west" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
}

# Update VPC route tables to use Transit Gateway
resource "aws_route" "hub_to_tgw" {
  provider               = aws.hub
  route_table_id         = module.hub_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.hub.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "us_west_to_tgw" {
  provider               = aws.us_west
  route_table_id         = module.us_west_spoke_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.us_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.us_west_spoke]
}

resource "aws_route" "eu_west_to_tgw" {
  provider               = aws.eu_west
  route_table_id         = module.eu_west_spoke_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.eu_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.eu_west_spoke]
}