# Create hub VPC
module "vpc_hub" {
  source = "./modules/vpc"

  vpc_cidr           = var.hub_vpc_cidr
  environment        = "hub"
  region             = var.region
  purpose            = "network"
  name_suffix        = local.name_suffix
  availability_zones = local.selected_azs

  create_igw                    = true
  create_public_subnets         = true
  create_tgw_attachment_subnets = true

  tags = local.hub_tags
}
