# Encryption Module
module "encryption" {
  source = "./modules/encryption_module"

  enable_ebs_encryption = true

  providers = {
    aws.eu_west_1 = aws.eu_west_1
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam_module"

  name_prefix        = local.name_prefix
  vpc_cidr_primary   = var.vpc_cidr_primary
  vpc_cidr_secondary = var.vpc_cidr_secondary

  providers = {
    aws.eu_west_1 = aws.eu_west_1
  }
}

# Networking Module
module "networking" {
  source = "./modules/networking_module"

  name_prefix           = local.name_prefix
  vpc_cidr_primary      = var.vpc_cidr_primary
  vpc_cidr_secondary    = var.vpc_cidr_secondary
  allowed_ingress_cidrs = var.allowed_ingress_cidrs
  allowed_ports         = var.allowed_ports
  tags                  = local.common_tags

  providers = {
    aws.eu_west_1 = aws.eu_west_1
  }
}

# Logging Module
module "logging" {
  source = "./modules/logging_module"

  name_prefix                  = local.name_prefix
  vpc_id_primary               = module.networking.vpc_ids.primary
  vpc_id_secondary             = module.networking.vpc_ids.secondary
  flow_logs_role_primary_arn   = module.iam.flow_logs_role_primary_arn
  flow_logs_role_secondary_arn = module.iam.flow_logs_role_secondary_arn
  tags                         = local.common_tags

  providers = {
    aws.eu_west_1 = aws.eu_west_1
  }
}

# S3 Module
module "s3" {
  source = "./modules/s3_module"

  name_prefix = local.name_prefix
  tags        = local.common_tags

  providers = {
    aws.eu_west_1 = aws.eu_west_1
  }
}

# Outputs
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value       = module.networking.vpc_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs for both regions"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs for both regions"
  value       = module.networking.private_subnet_ids
}

output "flow_log_ids" {
  description = "VPC Flow Log IDs for both regions"
  value       = module.logging.flow_log_ids
}

output "flow_log_group_arns" {
  description = "CloudWatch Log Group ARNs for VPC Flow Logs"
  value       = module.logging.flow_log_group_arns
}

output "security_group_ids" {
  description = "Security Group IDs for bastion/app access"
  value       = module.networking.security_group_ids
}

output "s3_audit_bucket_names" {
  description = "S3 bucket names for audit logs"
  value       = module.s3.s3_audit_bucket_names
}