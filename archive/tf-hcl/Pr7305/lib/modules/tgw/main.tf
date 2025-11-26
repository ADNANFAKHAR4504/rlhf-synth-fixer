resource "aws_ec2_transit_gateway" "main" {
  description                     = var.description
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = var.default_route_table_association
  default_route_table_propagation = var.default_route_table_propagation
  dns_support                     = var.enable_dns_support ? "enable" : "disable"
  vpn_ecmp_support                = var.enable_vpn_ecmp_support ? "enable" : "disable"
  multicast_support               = var.enable_multicast_support ? "enable" : "disable"

  tags = merge(var.tags, {
    Name = var.tgw_name
  })
}