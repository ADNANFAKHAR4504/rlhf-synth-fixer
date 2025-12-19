# Regular routes
resource "aws_ec2_transit_gateway_route" "routes" {
  for_each = { for idx, route in var.routes : "${route.destination_cidr_block}-${idx}" => route }

  destination_cidr_block         = each.value.destination_cidr_block
  transit_gateway_route_table_id = var.transit_gateway_route_table_id
  transit_gateway_attachment_id  = each.value.attachment_id
}

# Blackhole routes
resource "aws_ec2_transit_gateway_route" "blackhole" {
  for_each = toset(var.blackhole_routes)

  destination_cidr_block         = each.value
  transit_gateway_route_table_id = var.transit_gateway_route_table_id
  blackhole                      = true
}