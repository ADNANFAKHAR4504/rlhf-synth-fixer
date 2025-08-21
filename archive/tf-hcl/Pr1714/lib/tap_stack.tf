module "kms_module" {
  source = "./modules/kms_module"
  environment = lookup(local.env_type, local.env)
  service = lookup(local.service, local.env)
  resource = lookup(local.resource, local.env)
  tags = local.common_tags
}

module "s3_module" {
  source = "./modules/s3_module"
  environment = lookup(local.env_type, local.env)
  service = lookup(local.service, local.env)
  resource = lookup(local.resource, local.env)
  kms_key_id = module.kms_module.key_id
  tags = local.common_tags
}


module "iam_module" {
  source = "./modules/iam_module"
  environment = lookup(local.env_type, local.env)
  service = lookup(local.service, local.env)
  s3_bucket_arn = module.s3_module.bucket_arn
  tags = local.common_tags

}

module "cloudfront_module" {
  source = "./modules/cloudfront_module"
  environment = lookup(local.env_type, local.env)
  s3_bucket_name = module.s3_module.bucket_name
  logging_bucket_domain_name = module.s3_module.log_bucket_domain
  cloudfront_access_identity_path = module.s3_module.cloudfront_access_identity_path
  tags = local.common_tags
}

module "monitoring_module" {
  source = "./modules/monitoring_module"
  environment = lookup(local.env_type, local.env)
  service = lookup(local.service, local.env)
  resource = lookup(local.resource, local.env)
  kms_key_id = module.kms_module.key_id
  kms_key_arn = module.kms_module.key_arn
  alert_email_addresses = ["ogunfowokan.e@turing.com"]
}

# module "logging_module" {
#   source = "./modules/logging_module"
#   environment = lookup(local.env_type, local.env)
#   service = lookup(local.service, local.env)
#   s3_bucket_arn = module.s3_module.log_bucket_arn
#   cloudwatch_log_group_arn = module.monitoring_module.log_group_arn 
# }





# Root level outputs
output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.kms_module.key_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3_module.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront_module.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront_module.domain_name
}