# VPC Peering Connections between all regions

# US East 1 <-> EU West 1 Peering
resource "aws_vpc_peering_connection" "us_east_1_to_eu_west_1" {
  provider = aws.us_east_1

  vpc_id      = var.vpc_us_east_1_id
  peer_vpc_id = var.vpc_eu_west_1_id
  peer_region = "eu-west-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-us-east-1-to-eu-west-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_vpc_peering_connection_accepter" "eu_west_1_accept_us_east_1" {
  provider = aws.eu_west_1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_eu_west_1.id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-eu-west-1-accept-us-east-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# US East 1 <-> AP Southeast 1 Peering (only if AP Southeast 1 VPC is provided)
resource "aws_vpc_peering_connection" "us_east_1_to_ap_southeast_1" {
  count    = var.vpc_ap_southeast_1_id != null ? 1 : 0
  provider = aws.us_east_1

  vpc_id      = var.vpc_us_east_1_id
  peer_vpc_id = var.vpc_ap_southeast_1_id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-us-east-1-to-ap-southeast-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_vpc_peering_connection_accepter" "ap_southeast_1_accept_us_east_1" {
  count    = var.vpc_ap_southeast_1_id != null ? 1 : 0
  provider = aws.ap_southeast_1

  vpc_peering_connection_id = aws_vpc_peering_connection.us_east_1_to_ap_southeast_1[0].id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-ap-southeast-1-accept-us-east-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# EU West 1 <-> AP Southeast 1 Peering (only if AP Southeast 1 VPC is provided)
resource "aws_vpc_peering_connection" "eu_west_1_to_ap_southeast_1" {
  count    = var.vpc_ap_southeast_1_id != null ? 1 : 0
  provider = aws.eu_west_1

  vpc_id      = var.vpc_eu_west_1_id
  peer_vpc_id = var.vpc_ap_southeast_1_id
  peer_region = "ap-southeast-1"
  auto_accept = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-eu-west-1-to-ap-southeast-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

resource "aws_vpc_peering_connection_accepter" "ap_southeast_1_accept_eu_west_1" {
  count    = var.vpc_ap_southeast_1_id != null ? 1 : 0
  provider = aws.ap_southeast_1

  vpc_peering_connection_id = aws_vpc_peering_connection.eu_west_1_to_ap_southeast_1[0].id
  auto_accept               = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-peering-ap-southeast-1-accept-eu-west-1-${var.common_tags.UniqueSuffix}"
  })

  # Add lifecycle rule to handle tag inconsistencies
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}

# Note: Route table associations will be handled by the VPC modules
# VPC peering connections are established but routing is managed separately
# to avoid circular dependencies and data source issues
