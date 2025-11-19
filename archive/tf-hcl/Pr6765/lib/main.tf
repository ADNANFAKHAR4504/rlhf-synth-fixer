# main.tf - Hub-and-Spoke Network Architecture with Transit Gateway

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

###########################################
# Transit Gateway
###########################################

resource "aws_ec2_transit_gateway" "main" {
  description                     = "Hub-and-spoke transit gateway for ${var.environment_suffix}"
  amazon_side_asn                 = var.transit_gateway_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = var.enable_dns_support ? "enable" : "disable"
  vpn_ecmp_support                = var.enable_vpn_ecmp_support ? "enable" : "disable"

  tags = {
    Name = "tgw-hub-spoke-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table for Hub
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-hub-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table for Spokes
resource "aws_ec2_transit_gateway_route_table" "spokes" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-spokes-${var.environment_suffix}"
  }
}

###########################################
# Hub VPC
###########################################

resource "aws_vpc" "hub" {
  cidr_block           = var.hub_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-hub-${var.environment_suffix}"
    Type = "hub"
  }
}

# Hub VPC Public Subnets (for NAT Gateway)
resource "aws_subnet" "hub_public" {
  count                   = 2
  vpc_id                  = aws_vpc.hub.id
  cidr_block              = cidrsubnet(var.hub_vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-hub-public-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Hub VPC Private Subnets (for Transit Gateway attachment)
resource "aws_subnet" "hub_private" {
  count             = 2
  vpc_id            = aws_vpc.hub.id
  cidr_block        = cidrsubnet(var.hub_vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-hub-private-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Internet Gateway for Hub VPC
resource "aws_internet_gateway" "hub" {
  vpc_id = aws_vpc.hub.id

  tags = {
    Name = "igw-hub-${var.environment_suffix}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eip-nat-hub-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.hub]
}

# NAT Gateway in Hub VPC
resource "aws_nat_gateway" "hub" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.hub_public[0].id

  tags = {
    Name = "nat-hub-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.hub]
}

# Route Table for Hub Public Subnets
resource "aws_route_table" "hub_public" {
  vpc_id = aws_vpc.hub.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hub.id
  }

  tags = {
    Name = "rt-hub-public-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "hub_public" {
  count          = length(aws_subnet.hub_public)
  subnet_id      = aws_subnet.hub_public[count.index].id
  route_table_id = aws_route_table.hub_public.id
}

# Route Table for Hub Private Subnets
resource "aws_route_table" "hub_private" {
  vpc_id = aws_vpc.hub.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.hub.id
  }

  tags = {
    Name = "rt-hub-private-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "hub_private" {
  count          = length(aws_subnet.hub_private)
  subnet_id      = aws_subnet.hub_private[count.index].id
  route_table_id = aws_route_table.hub_private.id
}

# Transit Gateway Attachment for Hub VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  subnet_ids         = aws_subnet.hub_private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.hub.id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name = "tgw-attach-hub-${var.environment_suffix}"
  }
}

# Associate Hub VPC attachment with Hub route table
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Propagate Hub routes to Spokes route table
resource "aws_ec2_transit_gateway_route_table_propagation" "hub_to_spokes" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

###########################################
# Spoke VPCs
###########################################

resource "aws_vpc" "spokes" {
  for_each = var.spoke_vpc_cidrs

  cidr_block           = each.value
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-spoke-${each.key}-${var.environment_suffix}"
    Type        = "spoke"
    Environment = each.key
  }
}

# Spoke VPC Private Subnets
resource "aws_subnet" "spokes_private" {
  for_each = {
    for pair in flatten([
      for env, cidr in var.spoke_vpc_cidrs : [
        for az in range(2) : {
          key = "${env}-${az}"
          env = env
          az  = az
        }
      ]
    ]) : pair.key => pair
  }

  vpc_id            = aws_vpc.spokes[each.value.env].id
  cidr_block        = cidrsubnet(var.spoke_vpc_cidrs[each.value.env], 8, each.value.az)
  availability_zone = data.aws_availability_zones.available.names[each.value.az]

  tags = {
    Name        = "subnet-spoke-${each.value.env}-${each.value.az + 1}-${var.environment_suffix}"
    Type        = "private"
    Environment = each.value.env
  }
}

# Transit Gateway Attachments for Spoke VPCs
resource "aws_ec2_transit_gateway_vpc_attachment" "spokes" {
  for_each = var.spoke_vpc_cidrs

  subnet_ids = [
    for key, subnet in aws_subnet.spokes_private :
    subnet.id if startswith(key, "${each.key}-")
  ]
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.spokes[each.key].id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name        = "tgw-attach-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}

# Associate Spoke VPC attachments with Spokes route table
resource "aws_ec2_transit_gateway_route_table_association" "spokes" {
  for_each = var.spoke_vpc_cidrs

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.spokes[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

# Propagate Spoke routes to Hub route table
resource "aws_ec2_transit_gateway_route_table_propagation" "spokes_to_hub" {
  for_each = var.spoke_vpc_cidrs

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.spokes[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Default route in Spokes route table pointing to Hub
resource "aws_ec2_transit_gateway_route" "spokes_default" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

# Route Tables for Spoke VPCs
resource "aws_route_table" "spokes" {
  for_each = var.spoke_vpc_cidrs

  vpc_id = aws_vpc.spokes[each.key].id

  tags = {
    Name        = "rt-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}

# Add routes to Transit Gateway in Spoke route tables
resource "aws_route" "spokes_to_tgw" {
  for_each = var.spoke_vpc_cidrs

  route_table_id         = aws_route_table.spokes[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.spokes]
}

# Associate subnets with route tables
resource "aws_route_table_association" "spokes" {
  for_each = aws_subnet.spokes_private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.spokes[split("-", each.key)[0]].id
}

# Add routes from Hub private subnets to spoke VPCs through Transit Gateway
resource "aws_route" "hub_to_spokes" {
  for_each = var.spoke_vpc_cidrs

  route_table_id         = aws_route_table.hub_private.id
  destination_cidr_block = each.value
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

###########################################
# Security Groups
###########################################

# Hub VPC Security Group
resource "aws_security_group" "hub" {
  name        = "hub-sg-${var.environment_suffix}"
  description = "Security group for hub VPC"
  vpc_id      = aws_vpc.hub.id

  ingress {
    description = "Allow all traffic from spoke VPCs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [for cidr in var.spoke_vpc_cidrs : cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hub-sg-${var.environment_suffix}"
  }
}

# Spoke VPC Security Groups
resource "aws_security_group" "spokes" {
  for_each = var.spoke_vpc_cidrs

  name        = "spoke-${each.key}-sg-${var.environment_suffix}"
  description = "Security group for spoke VPC ${each.key}"
  vpc_id      = aws_vpc.spokes[each.key].id

  ingress {
    description = "Allow traffic from hub VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.hub_vpc_cidr]
  }

  ingress {
    description = "Allow traffic from other spoke VPCs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [for cidr in var.spoke_vpc_cidrs : cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "spoke-${each.key}-sg-${var.environment_suffix}"
    Environment = each.key
  }
}

###########################################
# Network ACLs
###########################################

# Hub VPC Network ACL
resource "aws_network_acl" "hub" {
  vpc_id     = aws_vpc.hub.id
  subnet_ids = concat(aws_subnet.hub_public[*].id, aws_subnet.hub_private[*].id)

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "nacl-hub-${var.environment_suffix}"
  }
}

# Spoke VPC Network ACLs
resource "aws_network_acl" "spokes" {
  for_each = var.spoke_vpc_cidrs

  vpc_id = aws_vpc.spokes[each.key].id
  subnet_ids = [
    for key, subnet in aws_subnet.spokes_private :
    subnet.id if startswith(key, "${each.key}-")
  ]

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "nacl-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}
