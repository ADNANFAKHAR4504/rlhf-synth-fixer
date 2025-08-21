# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# VPC Module - Primary Region
module "vpc_primary" {
  source = "./modules/vpc_module"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_cidr             = var.primary_vpc_cidr
  availability_zones   = data.aws_availability_zones.primary.names
  environment         = var.environment
  region_name         = "primary"
}

# VPC Module - Secondary Region
module "vpc_secondary" {
  source = "./modules/vpc_module"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_cidr             = var.secondary_vpc_cidr
  availability_zones   = data.aws_availability_zones.secondary.names
  environment         = var.environment
  region_name         = "secondary"
}

# Load Balancer Module - Primary Region
module "load_balancer_primary" {
  source = "./modules/loadbalancer_module"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id              = module.vpc_primary.vpc_id
  public_subnet_ids   = module.vpc_primary.public_subnet_ids
  environment        = var.environment
  region_name        = "primary"
}

# Load Balancer Module - Secondary Region
module "load_balancer_secondary" {
  source = "./modules/loadbalancer_module"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_id              = module.vpc_secondary.vpc_id
  public_subnet_ids   = module.vpc_secondary.public_subnet_ids
  environment        = var.environment
  region_name        = "secondary"
}

# Compute Module - Primary Region
module "compute_primary" {
  source = "./modules/compute_module"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id                = module.vpc_primary.vpc_id
  private_subnet_ids    = module.vpc_primary.private_subnet_ids
  alb_target_group_arn  = module.load_balancer_primary.target_group_arn
  alb_security_group_id = module.load_balancer_primary.alb_security_group_id
  environment          = var.environment
  region_name          = "primary"
  instance_type        = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
}

# Compute Module - Secondary Region
module "compute_secondary" {
  source = "./modules/compute_module"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_id                = module.vpc_secondary.vpc_id
  private_subnet_ids    = module.vpc_secondary.private_subnet_ids
  alb_target_group_arn  = module.load_balancer_secondary.target_group_arn
  alb_security_group_id = module.load_balancer_secondary.alb_security_group_id
  environment          = var.environment
  region_name          = "secondary"
  instance_type        = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
}

# DNS Module for Route 53 failover routing
# This module sets up health checks and failover routing between regions
# module "dns" {
#   source = "./modules/route53_module"
  
#   # DNS is a global service, so we use the primary provider
#   providers = {
#     aws = aws.primary
#   }
  
#   domain_name                = var.domain_name
#   primary_alb_dns_name       = module.load_balancer_primary.alb_dns_name
#   primary_alb_zone_id        = module.load_balancer_primary.alb_zone_id
#   secondary_alb_dns_name     = module.load_balancer_secondary.alb_dns_name
#   secondary_alb_zone_id      = module.load_balancer_secondary.alb_zone_id
#   environment               = var.environment
# }


output "primary_alb_dns_name" {
  description = "DNS name of the primary region ALB"
  value       = module.load_balancer_primary.alb_dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary region ALB"
  value       = module.load_balancer_secondary.alb_dns_name
}

# output "route53_record_name" {
#   description = "Route 53 record name for the application"
#   value       = module.dns.record_name
# }

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = module.vpc_secondary.vpc_id
}