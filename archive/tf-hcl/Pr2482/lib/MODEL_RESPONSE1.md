```hcl
output "vpc_ids" {
  description = "VPC IDs for all regions"
  value = {
    us_east_1    = module.vpc_us_east_1.vpc_id
    us_west_2    = module.vpc_us_west_2.vpc_id
    eu_central_1 = module.vpc_eu_central_1.vpc_id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for all regions"
  value = {
    us_east_1    = module.vpc_us_east_1.private_subnet_id
    us_west_2    = module.vpc_us_west_2.private_subnet_id
    eu_central_1 = module.vpc_eu_central_1.private_subnet_id
  }
}

output "database_subnet_ids" {
  description = "Database subnet IDs for all regions"
  value = {
    us_east_1    = module.vpc_us_east_1.database_subnet_id
    us_west_2    = module.vpc_us_west_2.database_subnet_id
    eu_central_1 = module.vpc_eu_central_1.database_subnet_id
  }
}

output "central_logging_bucket" {
  description = "Central logging S3 bucket name"
  value       = module.central_logging.bucket_name
}

output "secrets_arns" {
  description = "ARNs of secrets in each region"
  value = {
    us_east_1 = {
      db_password = module.secrets_us_east_1.db_password_secret_arn
      api_keys    = module.secrets_us_east_1.api_keys_secret_arn
    }
    us_west_2 = {
      db_password = module.secrets_us_west_2.db_password_secret_arn
      api_keys    = module.secrets_us_west_2.api_keys_secret_arn
    }
    eu_central_1 = {
      db_password = module.secrets_eu_central_1.db_password_secret_arn
      api_keys    = module.secrets_eu_central_1.api_keys_secret_arn
    }
  }
}
```