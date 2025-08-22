module "networking_module" {
  source = "./modules/networking_module"
  environment = var.environment
  vpc_cidr = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags = local.common_tags
}

module "security_module" {
  source = "./modules/security_module"
  environment = var.environment
  vpc_id = module.networking_module.vpc_id
  vpc_cidr_block = var.vpc_cidr
  tags = local.common_tags

  depends_on = [ 
    module.networking_module 
  ]
}

module "compute_module" {
  source = "./modules/compute_module"
  environment = var.environment
  instance_type = var.instance_type
  security_group_id = module.security_module.uniform_security_group_id
  instance_profile_name = module.security_module.ec2_instance_profile_name
  kms_key_id = module.security_module.kms_key_id
  kms_key_arn = module.security_module.kms_key_arn
  private_subnet_ids = module.networking_module.private_subnet_ids
  public_subnet_ids = module.networking_module.public_subnet_ids
  min_size = var.min_size
  max_size = var.max_size
  desired_capacity = var.desired_capacity
  alb_security_group_id = module.security_module.alb_security_group_id
  vpc_id = module.networking_module.vpc_id
  tags = local.common_tags
  
  depends_on = [ 
    module.networking_module,
    module.security_module
  ]
}



output "lb_domain_name" {
  value = module.compute_module.lb_domain_name
}

output "s3_policy_arn" {
  description = "ARN of the S3 limited access policy"
  value       = module.security_module.s3_policy_arn
}

output "kms_policy_arn" {
  description = "ARN of the KMS limited access policy"
  value       = module.security_module.kms_policy_arn
}

output "uniform_security_group_id" {
  description = "ID of the uniform security group for EC2 instances"
  value       = module.security_module.uniform_security_group_id
}