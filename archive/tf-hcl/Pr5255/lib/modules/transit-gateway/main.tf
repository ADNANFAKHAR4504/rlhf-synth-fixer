# Create Transit Gateway
resource "aws_ec2_transit_gateway" "this" {
  description                     = "Transit Gateway for hub-and-spoke architecture"
  amazon_side_asn                 = var.amazon_side_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-hubspoke-${var.name_suffix}"
  })
}

# Create hub route table
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-rt-hub-${var.name_suffix}"
    Type = "hub"
  })
}

# Create spoke route table
resource "aws_ec2_transit_gateway_route_table" "spoke" {
  transit_gateway_id = aws_ec2_transit_gateway.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-rt-spoke-${var.name_suffix}"
    Type = "spoke"
  })
}

# Create VPC attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "attachments" {
  for_each = var.vpc_attachments

  subnet_ids                                      = each.value.subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.this.id
  vpc_id                                          = each.value.vpc_id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  dns_support                                     = "enable"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tgw-attach-${each.key}-${var.name_suffix}"
  })
}

# Associate hub attachment with hub route table
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Associate spoke attachments with spoke route table
resource "aws_ec2_transit_gateway_route_table_association" "spoke" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Create routes in hub route table (to reach spokes)
resource "aws_ec2_transit_gateway_route" "hub_to_spoke" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  destination_cidr_block         = each.value.cidr_block
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Create routes in spoke route table
# Default route to hub for internet access
resource "aws_ec2_transit_gateway_route" "spoke_default" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Route to hub VPC
resource "aws_ec2_transit_gateway_route" "spoke_to_hub" {
  destination_cidr_block         = var.vpc_attachments["hub"].cidr_block
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attachments["hub"].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}

# Blackhole routes for spoke isolation (CRITICAL for security)
resource "aws_ec2_transit_gateway_route" "spoke_isolation" {
  for_each = { for k, v in var.vpc_attachments : k => v if k != "hub" }

  destination_cidr_block         = each.value.cidr_block
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spoke.id
}
