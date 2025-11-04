module "uswest_tgw" {
  source = "./modules/transit-gateway"

  providers = {
    aws = aws.us_west
  }

  environment        = var.environment
  region             = "us-west-2"
  amazon_side_asn    = var.uswest_tgw_asn
  tgw_name           = "uswest-spoke-tgw"
  environment_suffix = local.env_suffix
  project_tags       = merge(local.common_tags, { Purpose = "spoke" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "uswest" {
  provider = aws.us_west

  subnet_ids         = module.uswest_vpc.private_subnet_ids
  transit_gateway_id = module.uswest_tgw.transit_gateway_id
  vpc_id             = module.uswest_vpc.vpc_id
  dns_support        = "enable"

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(
    local.common_tags,
    {
      Name        = "uswest-spoke-vpc-attachment-${local.env_suffix}"
      Environment = var.environment
      Purpose     = "spoke"
    }
  )
}

resource "aws_ec2_transit_gateway_route_table_association" "uswest_production" {
  provider = aws.us_west

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.uswest.id
  transit_gateway_route_table_id = module.uswest_tgw.production_route_table_id
}

module "europe_tgw" {
  source = "./modules/transit-gateway"

  providers = {
    aws = aws.europe
  }

  environment        = var.environment
  region             = "eu-west-1"
  amazon_side_asn    = var.europe_tgw_asn
  tgw_name           = "europe-spoke-tgw"
  environment_suffix = local.env_suffix
  project_tags       = merge(local.common_tags, { Purpose = "spoke" })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "europe" {
  provider = aws.europe

  subnet_ids         = module.europe_vpc.private_subnet_ids
  transit_gateway_id = module.europe_tgw.transit_gateway_id
  vpc_id             = module.europe_vpc.vpc_id
  dns_support        = "enable"

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(
    local.common_tags,
    {
      Name        = "europe-spoke-vpc-attachment-${local.env_suffix}"
      Environment = var.environment
      Purpose     = "spoke"
    }
  )
}

resource "aws_ec2_transit_gateway_route_table_association" "europe_production" {
  provider = aws.europe

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.europe.id
  transit_gateway_route_table_id = module.europe_tgw.production_route_table_id
}
