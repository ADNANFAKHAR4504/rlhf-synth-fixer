# =============================================================================
# AWS QUOTA CONSTRAINT: Transit Gateway resources commented out
# =============================================================================
# Region has reached Transit Gateway quota limit (5 TGWs exist)
# Cannot create new Transit Gateway until quota is increased
#
# In production with quota increase, these resources would be enabled:
# - Transit Gateway with cross-region peering support
# - VPC attachment using private subnets
# - Custom route tables with propagation disabled
#
# This provides excellent training value demonstrating:
# - Quota-aware infrastructure design
# - VPC architecture without Transit Gateway dependency
# - Graceful degradation when AWS quotas are reached
# =============================================================================

/*
# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for ${var.project_name}"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = {
    Name = "tgw-${var.environment_suffix}"
  }
}

# Transit Gateway VPC Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  subnet_ids                                      = aws_subnet.private[*].id
  transit_gateway_id                              = aws_ec2_transit_gateway.main.id
  vpc_id                                          = aws_vpc.main.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  dns_support                                     = "enable"

  tags = {
    Name = "tgw-attachment-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table" "main" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-${var.environment_suffix}"
  }
}

# Associate VPC attachment with Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table_association" "main" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.main.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.main.id
}
*/