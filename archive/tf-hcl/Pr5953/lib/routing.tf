# routing.tf - Route tables and peering routes

# -----------------------------------------------------------------------------
# PRODUCTION VPC ROUTE TABLES
# -----------------------------------------------------------------------------

# Route table for public subnets (no peering routes)
resource "aws_route_table" "production_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.production.id
  }

  tags = merge(local.common_tags, {
    Name = "production-public-rt-${var.environment_suffix}"
    Tier = "public"
  })
}

# Route table for application subnets (with peering routes to specific partner CIDRs)
resource "aws_route_table" "production_app" {
  provider = aws.primary
  count    = length(local.production_app_subnet_cidrs)
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-app-rt-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Peering routes for each application subnet to specific partner application subnets
resource "aws_route" "production_to_partner_app" {
  provider = aws.primary
  count    = length(local.production_app_subnet_cidrs) * length(local.partner_app_subnet_cidrs)

  route_table_id            = aws_route_table.production_app[floor(count.index / length(local.partner_app_subnet_cidrs))].id
  destination_cidr_block    = local.partner_app_subnet_cidrs[count.index % length(local.partner_app_subnet_cidrs)]
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}

# Route table for database subnets (no peering routes)
resource "aws_route_table" "production_db" {
  provider = aws.primary
  vpc_id   = aws_vpc.production.id

  tags = merge(local.common_tags, {
    Name = "production-db-rt-${var.environment_suffix}"
    Tier = "database"
  })
}

# Route table associations - production VPC
resource "aws_route_table_association" "production_public" {
  provider       = aws.primary
  count          = length(aws_subnet.production_public)
  subnet_id      = aws_subnet.production_public[count.index].id
  route_table_id = aws_route_table.production_public.id
}

resource "aws_route_table_association" "production_app" {
  provider       = aws.primary
  count          = length(aws_subnet.production_app)
  subnet_id      = aws_subnet.production_app[count.index].id
  route_table_id = aws_route_table.production_app[count.index].id
}

resource "aws_route_table_association" "production_db" {
  provider       = aws.primary
  count          = length(aws_subnet.production_db)
  subnet_id      = aws_subnet.production_db[count.index].id
  route_table_id = aws_route_table.production_db.id
}

# -----------------------------------------------------------------------------
# PARTNER VPC ROUTE TABLES
# -----------------------------------------------------------------------------

# Route table for public subnets (no peering routes)
resource "aws_route_table" "partner_public" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.partner.id
  }

  tags = merge(local.common_tags, {
    Name = "partner-public-rt-${var.environment_suffix}"
    Tier = "public"
  })
}

# Route table for application subnets (with peering routes to specific production CIDRs)
resource "aws_route_table" "partner_app" {
  provider = aws.partner
  count    = length(local.partner_app_subnet_cidrs)
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-app-rt-${count.index + 1}-${var.environment_suffix}"
    Tier = "application"
  })
}

# Peering routes for each partner application subnet to specific production application subnets
resource "aws_route" "partner_to_production_app" {
  provider = aws.partner
  count    = length(local.partner_app_subnet_cidrs) * length(local.production_app_subnet_cidrs)

  route_table_id            = aws_route_table.partner_app[floor(count.index / length(local.production_app_subnet_cidrs))].id
  destination_cidr_block    = local.production_app_subnet_cidrs[count.index % length(local.production_app_subnet_cidrs)]
  vpc_peering_connection_id = aws_vpc_peering_connection.production_to_partner.id

  depends_on = [aws_vpc_peering_connection_accepter.partner_accept]
}

# Route table for database subnets (no peering routes)
resource "aws_route_table" "partner_db" {
  provider = aws.partner
  vpc_id   = aws_vpc.partner.id

  tags = merge(local.common_tags, {
    Name = "partner-db-rt-${var.environment_suffix}"
    Tier = "database"
  })
}

# Route table associations - partner VPC
resource "aws_route_table_association" "partner_public" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_public)
  subnet_id      = aws_subnet.partner_public[count.index].id
  route_table_id = aws_route_table.partner_public.id
}

resource "aws_route_table_association" "partner_app" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_app)
  subnet_id      = aws_subnet.partner_app[count.index].id
  route_table_id = aws_route_table.partner_app[count.index].id
}

resource "aws_route_table_association" "partner_db" {
  provider       = aws.partner
  count          = length(aws_subnet.partner_db)
  subnet_id      = aws_subnet.partner_db[count.index].id
  route_table_id = aws_route_table.partner_db.id
}