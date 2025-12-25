# Networking module
module "networking" {
  source = "./modules/networking"

  resource_prefix   = local.resource_prefix
  vpc_id            = local.vpc_id
  public_subnet_ids = local.public_subnet_ids
  common_tags       = local.common_tags

  depends_on = [aws_vpc.main, aws_subnet.public]
}

# Compute module
module "compute" {
  source = "./modules/compute"

  resource_prefix       = local.resource_prefix
  environment           = var.environment
  ami_id                = data.aws_ami.amazon_linux_2023.id
  instance_type         = var.instance_type
  instance_count        = var.instance_count
  private_subnet_ids    = local.private_subnet_ids
  ec2_security_group_id = module.networking.ec2_security_group_id
  target_group_arn      = module.networking.target_group_arn
  common_tags           = local.common_tags

  depends_on = [module.networking, aws_subnet.private, aws_nat_gateway.main]
}

# Database module
module "database" {
  source = "./modules/database"

  resource_prefix       = local.resource_prefix
  private_subnet_ids    = local.private_subnet_ids
  rds_security_group_id = module.networking.rds_security_group_id
  db_instance_class     = var.db_instance_class
  backup_retention_days = var.db_backup_retention_days
  common_tags           = local.common_tags

  depends_on = [module.networking, aws_subnet.private]
}
