module "networking" {
  source = "./modules/networking"
  
  vpc_cidr_block       = var.vpc_cidr_block
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "storage" {
  source = "./modules/storage"
  
  bucket_name = var.s3_bucket_name
}

module "compute" {
  source = "./modules/compute"
  
  vpc_id              = module.networking.vpc_id
  public_subnet_ids   = module.networking.public_subnet_ids
  private_subnet_ids  = module.networking.private_subnet_ids
  instance_type       = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
}

module "content_delivery" {
  source = "./modules/content_delivery"
  
  alb_dns_name       = module.compute.alb_dns_name
  s3_bucket_domain   = module.storage.s3_domain_name
  domain_name        = var.domain_name
  geo_restrictions   = var.geo_restrictions
  ttl_settings       = var.ttl_settings
  regions            = var.regions
}

module "media_processing" {
  source = "./modules/media_processing"
  
  source_bucket_arn      = module.storage.bucket_arn
  source_bucket_id       = module.storage.bucket_id
  destination_bucket_arn = module.storage.bucket_arn
  destination_bucket     = var.s3_bucket_name
}

module "security" {
  source = "./modules/security"
  
  vpc_id                     = module.networking.vpc_id
  vpc_cidr_block             = var.vpc_cidr_block
  public_subnet_ids          = module.networking.public_subnet_ids
  private_subnet_ids         = module.networking.private_subnet_ids
  alb_arn                    = module.compute.alb_arn
  cloudfront_distribution_id = module.content_delivery.distribution_id
  waf_rate_limits            = var.waf_rate_limits
}

module "monitoring" {
  source = "./modules/monitoring"
  
  vpc_id                     = module.networking.vpc_id
  alb_arn                    = module.compute.alb_arn
  asg_name                   = module.compute.asg_name
  cloudfront_distribution_id = module.content_delivery.distribution_id
}