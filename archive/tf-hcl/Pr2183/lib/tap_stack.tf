# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam_module"
  
  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# Networking Module
module "networking" {
  source = "./modules/networking_module"
  
  name_prefix         = local.name_prefix
  vpc_cidr           = local.current_network_config.vpc_cidr
  availability_zones = local.effective_azs
  public_subnets     = local.current_network_config.public_subnets
  private_subnets    = local.current_network_config.private_subnets
  database_subnets   = local.current_network_config.database_subnets
  tags               = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database_module"
  
  name_prefix           = local.name_prefix
  db_subnet_group_name  = module.networking.db_subnet_group_name
  vpc_security_group_ids = [module.networking.database_security_group_id]
  
  instance_class              = local.current_db_config.instance_class
  allocated_storage          = local.current_db_config.allocated_storage
  backup_retention           = local.current_db_config.backup_retention
  multi_az                   = local.current_db_config.multi_az
  deletion_protection        = local.current_db_config.deletion_protection
  auto_minor_version_upgrade = local.current_db_config.auto_minor_version_upgrade
  engine_version             = local.current_db_config.engine_version
  
  db_username = var.db_username
  db_password = var.db_password
  
  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute_module"
  
  name_prefix                = local.name_prefix
  vpc_id                    = module.networking.vpc_id
  public_subnet_ids         = module.networking.public_subnet_ids
  private_subnet_ids        = module.networking.private_subnet_ids
  alb_security_group_id     = module.networking.alb_security_group_id
  instance_security_group_id = module.networking.instance_security_group_id
  
  ami_id           = data.aws_ami.amazon_linux.id
  instance_type    = local.current_instance_config.instance_type
  min_size         = local.current_instance_config.min_size
  max_size         = local.current_instance_config.max_size
  desired_capacity = local.current_instance_config.desired_capacity
  volume_size      = local.current_instance_config.volume_size
  
  instance_profile_name = module.iam.instance_profile_name
  db_endpoint          = module.database.db_endpoint
  
  tags = local.common_tags
}

output "lb_domain" {
    value = module.compute.alb_dns_name
}

output "target_group_arn" {
    value = module.compute.target_group_arn
}

output "rds_endpoint" {
    value = module.database.db_endpoint
}