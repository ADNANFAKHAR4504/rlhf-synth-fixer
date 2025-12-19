locals {
  common_tags = merge(
    var.project_tags,
    {
      Environment = var.environment
      Region      = var.region
      ManagedBy   = "terraform"
    }
  )
}

resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for ${var.environment} in ${var.region}"
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.tgw_name}-${var.environment_suffix}"
    }
  )

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_ec2_transit_gateway_route_table" "production" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    local.common_tags,
    {
      Name        = "${var.tgw_name}-production-rt-${var.environment_suffix}"
      Environment = "production"
    }
  )
}

resource "aws_ec2_transit_gateway_route_table" "non_production" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    local.common_tags,
    {
      Name        = "${var.tgw_name}-non-production-rt-${var.environment_suffix}"
      Environment = "non-production"
    }
  )
}
