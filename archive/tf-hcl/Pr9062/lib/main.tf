module "env_module" {
  source = "./modules/env_module"
}

module "vpc_module" {
  source             = "./modules/vpc_module"
  environment        = module.env_module.environment
  vpc_cidr           = module.env_module.vpc_cidr
  availability_zones = module.env_module.availability_zones
  common_tags        = module.env_module.common_tags
  project_name       = module.env_module.project_name
}

module "security_group_module" {
  source         = "./modules/securitygroup_module"
  environment    = module.env_module.environment
  project_name   = module.env_module.project_name
  vpc_id         = module.vpc_module.vpc_id
  vpc_cidr_block = module.env_module.vpc_cidr
  common_tags    = module.env_module.common_tags

  depends_on = [module.vpc_module]
}

module "lb_module" {
  source            = "./modules/lb_module"
  environment       = module.env_module.environment
  project_name      = module.env_module.project_name
  vpc_id            = module.vpc_module.vpc_id
  public_subnet_ids = module.vpc_module.public_subnet_ids
  security_group_id = module.security_group_module.alb_security_group_id
  common_tags       = module.env_module.common_tags
  enable_alb        = module.env_module.enable_alb

  depends_on = [module.security_group_module]
}

module "ec2_module" {
  source                = "./modules/ec2_module"
  environment           = module.env_module.environment
  project_name          = module.env_module.project_name
  private_subnet_ids    = module.vpc_module.private_subnet_ids
  security_group_id     = module.security_group_module.ec2_security_group_id
  instance_profile_name = module.security_group_module.ec2_instance_profile_name
  target_group_arn      = module.lb_module.target_group_arn
  instance_type         = module.env_module.instance_type
  min_size              = module.env_module.as_group_min
  max_size              = module.env_module.as_group_max
  desired_capacity      = module.env_module.as_group_desired
  common_tags           = module.env_module.common_tags
  enable_asg            = module.env_module.enable_asg
  enable_ec2            = module.env_module.enable_ec2

  depends_on = [module.lb_module, module.security_group_module]
}


output "lb_domain" {
  description = "ALB DNS name (empty if ALB disabled for LocalStack)"
  value       = module.lb_module.alb_dns_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc_module.vpc_id
}

output "lb_arn" {
  description = "ALB ARN (empty if ALB disabled for LocalStack)"
  value       = module.lb_module.alb_arn
}

output "enable_alb" {
  description = "Whether ALB is enabled"
  value       = module.env_module.enable_alb
}

output "enable_asg" {
  description = "Whether Auto Scaling Group is enabled"
  value       = module.env_module.enable_asg
}

output "enable_ec2" {
  description = "Whether EC2 instance creation is enabled"
  value       = module.env_module.enable_ec2
}

output "instance_id" {
  description = "EC2 instance ID (used when ASG disabled for LocalStack)"
  value       = module.ec2_module.instance_id
}