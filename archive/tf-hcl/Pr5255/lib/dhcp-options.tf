# DHCP options for hub VPC
resource "aws_vpc_dhcp_options" "hub" {
  domain_name         = "hub.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.hub_tags, {
    Name = "hub-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "hub" {
  vpc_id          = module.vpc_hub.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.hub.id
}

# DHCP options for production VPC
resource "aws_vpc_dhcp_options" "production" {
  domain_name         = "prod.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.production_tags, {
    Name = "production-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "production" {
  vpc_id          = module.vpc_production.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.production.id
}

# DHCP options for development VPC
resource "aws_vpc_dhcp_options" "development" {
  domain_name         = "dev.company.internal"
  domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(local.development_tags, {
    Name = "development-${var.region}-dhcp-options-${local.name_suffix}"
  })
}

resource "aws_vpc_dhcp_options_association" "development" {
  vpc_id          = module.vpc_development.vpc_id
  dhcp_options_id = aws_vpc_dhcp_options.development.id
}
