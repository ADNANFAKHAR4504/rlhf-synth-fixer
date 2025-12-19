data "aws_vpc" "peer" {
  count = terraform.workspace == "production" ? 1 : 0

  filter {
    name   = "tag:Workspace"
    values = ["legacy"]
  }

  filter {
    name   = "tag:Suffix"
    values = [var.environment_suffix]
  }
}

resource "aws_vpc_peering_connection" "main" {
  count       = terraform.workspace == "production" ? 1 : 0
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = data.aws_vpc.peer[0].id
  auto_accept = true

  tags = merge(local.common_tags, {
    Name = "vpc-peering-${var.environment_suffix}"
  })
}

resource "aws_route" "to_legacy" {
  count                     = terraform.workspace == "production" ? 1 : 0
  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = var.legacy_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main[0].id
}

resource "aws_route" "to_production" {
  count                     = terraform.workspace == "legacy" ? 1 : 0
  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = var.production_vpc_cidr
  vpc_peering_connection_id = data.aws_vpc_peering_connection.existing[0].id
}

data "aws_vpc_peering_connection" "existing" {
  count = terraform.workspace == "legacy" ? 1 : 0

  filter {
    name   = "tag:Name"
    values = ["vpc-peering-${var.environment_suffix}"]
  }
}
