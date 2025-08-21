output "us_east_1_to_eu_west_1_peering_id" {
  description = "VPC peering connection ID between US East 1 and EU West 1"
  value       = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
}

output "us_east_1_to_ap_southeast_1_peering_id" {
  description = "VPC peering connection ID between US East 1 and AP Southeast 1"
  value       = var.vpc_ap_southeast_1_id != null ? aws_vpc_peering_connection.us_east_1_to_ap_southeast_1[0].id : null
}

output "eu_west_1_to_ap_southeast_1_peering_id" {
  description = "VPC peering connection ID between EU West 1 and AP Southeast 1"
  value       = var.vpc_ap_southeast_1_id != null ? aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1[0].id : null
}

output "all_peering_connections" {
  description = "All VPC peering connection IDs"
  value = {
    us_east_1_to_eu_west_1      = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
    us_east_1_to_ap_southeast_1 = var.vpc_ap_southeast_1_id != null ? aws_vpc_peering_connection.us_east_1_to_ap_southeast_1[0].id : null
    eu_west_1_to_ap_southeast_1 = var.vpc_ap_southeast_1_id != null ? aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1[0].id : null
  }
}
