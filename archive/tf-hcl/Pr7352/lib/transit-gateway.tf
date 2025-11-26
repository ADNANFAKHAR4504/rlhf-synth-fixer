# transit-gateway.tf - Transit Gateway Configuration for On-Premises Connectivity

# Transit Gateway VPC Attachment
# Only create if transit_gateway_id is not the placeholder value
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  count              = var.transit_gateway_id != "tgw-00000000000000000" ? 1 : 0
  subnet_ids         = aws_subnet.private[*].id
  transit_gateway_id = var.transit_gateway_id
  vpc_id             = aws_vpc.main.id

  transit_gateway_default_route_table_association = true
  transit_gateway_default_route_table_propagation = true

  tags = {
    Name = "tgw-attachment-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table Association (if needed)
# This assumes the Transit Gateway already exists and is shared between environments
# The transit_gateway_id is passed as a variable

# Note: The actual Transit Gateway resource and Direct Connect setup
# are assumed to be managed separately as they are shared infrastructure
# between blue and green environments
