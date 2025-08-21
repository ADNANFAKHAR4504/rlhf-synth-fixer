# module "networking_module" {
#   source = "./modules/networking_module"
#   environment = var.environment
#   vpc_cidr = var.vpc_cidr
#   public_subnet_cidrs = var.public_subnet_cidrs
#   private_subnet_cidrs = var.private_subnet_cidrs
#   tags = local.common_tags
# }

# module "security_module" {
#   source = "./modules/security_module"
#   environment = var.environment
#   vpc_id = module.networking_module.vpc_id
#   vpc_cidr_block = var.vpc_cidr

#   depends_on = [ 
#     module.networking_module 
#   ]
# }

# module "iam_module" {
#   source = "./modules/iam_module"
#   environment = var.environment
#   s3_bucket_arn = module.security_module.s3_bucket_arn
#   kms_key_arns = [module.security_module.kms_key_arn]
#   tags = local.common_tags

#   depends_on = [ module.security_module ]
# }

# module "compute_module" {
#   source = "./modules/compute_module"
#   depends_on = [ 
#     module.networking_module,
#     module.security_module
#   ]
# }