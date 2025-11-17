# Security group for VPC endpoints
module "endpoints_sg_hub" {
  source = "./modules/sg"
  providers = {
    aws = aws.hub
  }

  name        = "hub-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.hub_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.hub_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

module "endpoints_sg_us_west" {
  source = "./modules/sg"
  providers = {
    aws = aws.us_west
  }

  name        = "us-west-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.us_west_spoke_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.us_west_spoke_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

module "endpoints_sg_eu_west" {
  source = "./modules/sg"
  providers = {
    aws = aws.eu_west
  }

  name        = "eu-west-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.eu_west_spoke_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.eu_west_spoke_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

# Systems Manager endpoints for Hub VPC
locals {
  ssm_endpoints = ["ssm", "ssmmessages", "ec2messages"]
}

resource "aws_vpc_endpoint" "ssm_hub" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.hub
  vpc_id              = module.hub_vpc.vpc_id
  service_name        = "com.amazonaws.${var.hub_region}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.hub_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_hub.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "hub-${each.key}-endpoint"
  })
}

# Systems Manager endpoints for AP-Northeast-1 Spoke
resource "aws_vpc_endpoint" "ssm_us_west" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.us_west
  vpc_id              = module.us_west_spoke_vpc.vpc_id
  service_name        = "com.amazonaws.${var.spoke_regions["ap-northeast-1"]}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.us_west_spoke_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_us_west.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "us-west-${each.key}-endpoint"
  })
}

# Systems Manager endpoints for US-West-1 Spoke
resource "aws_vpc_endpoint" "ssm_eu_west" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.eu_west
  vpc_id              = module.eu_west_spoke_vpc.vpc_id
  service_name        = "com.amazonaws.${var.spoke_regions["ap-southeast-2"]}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.eu_west_spoke_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_eu_west.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "eu-west-${each.key}-endpoint"
  })
}