resource "aws_ec2_transit_gateway_peering_attachment" "main" {
  peer_region             = var.peer_region
  peer_transit_gateway_id = var.peer_tgw_id
  transit_gateway_id      = var.local_tgw_id

  tags = merge(
    var.project_tags,
    {
      Name      = "${var.peering_name}-${var.environment_suffix}"
      ManagedBy = "terraform"
    }
  )
}
