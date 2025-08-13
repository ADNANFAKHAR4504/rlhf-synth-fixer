########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}
# variable "bucket_region" {
#   description = "Region for the S3 bucket"
#   type        = string
#   default     = "us-west-2"
# }

# variable "bucket_name" {
#   description = "Name of the S3 bucket"
#   type        = string
#   default     = "devs3-bucket"
# }

# variable "bucket_tags" {
#   description = "Tags to apply to the S3 bucket"
#   type        = map(string)
#   default = {
#     Project     = "ExampleProject"
#     Environment = "dev"
#     ManagedBy   = "terraform"
#   }
# }


module "env_module" {
  source = "./modules/env_module"
}

module "vpc_module" {
  source = "./modules/vpc_module"
  environment = module.env_module.environment
  vpc_cidr = module.env_module.vpc_cidr
  availability_zones = module.env_module.availability_zones
  common_tags = module.env_module.common_tags
  project_name = module.env_module.project_name
}

module "security_group_module" {
  source = "./modules/securitygroup_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  vpc_id = module.vpc_module.vpc_id
  vpc_cidr_block = module.env_module.vpc_cidr
  common_tags = module.env_module.common_tags

  depends_on = [ module.vpc_module ]
}

module "lb_module" {
  source = "./modules/lb_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  vpc_id = module.vpc_module.vpc_id
  public_subnet_ids = module.vpc_module.public_subnet_ids
  security_group_id = module.security_group_module.alb_security_group_id
  common_tags = module.env_module.common_tags

  depends_on = [ module.security_group_module ]
}

module "ec2_module" {
  source = "./modules/ec2_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  private_subnet_ids = module.vpc_module.private_subnet_ids
  security_group_id = module.security_group_module.ec2_security_group_id
  instance_profile_name = module.security_group_module.ec2_instance_profile_name
  target_group_arn = module.lb_module.target_group_arn
  instance_type = module.env_module.instance_type
  min_size = module.env_module.as_group_min
  max_size = module.env_module.as_group_max
  desired_capacity = module.env_module.as_group_desired
  common_tags = module.env_module.common_tags

  depends_on = [ module.lb_module ]
}