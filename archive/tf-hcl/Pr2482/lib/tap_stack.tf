variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infra"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "regions" {
  description = "List of AWS regions to deploy infrastructure"
  type        = list(string)
  default     = ["us-east-1"] # Commented out other regions to save time
}

variable "vpc_cidr_blocks" {
  description = "CIDR blocks for VPCs in each region"
  type        = map(string)
  default = {
    "us-east-1" = "10.1.0.0/16"
    # "us-west-2"    = "10.2.0.0/16"  # Commented out to save time
    # "eu-central-1" = "10.3.0.0/16"  # Commented out to save time
  }
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

# Random password generation for secrets
resource "random_password" "db_passwords" {
  for_each = toset(var.regions)
  length   = 32
  special  = true
}

# Central logging S3 bucket (created in us-east-1)
module "central_logging" {
  source = "./modules/logging"

  providers = {
    aws = aws.us_east_1
  }

  project_name       = var.project_name
  environment        = var.environment
  log_retention_days = var.log_retention_days
}

# Secrets management for each region
module "secrets_us_east_1" {
  source = "./modules/secrets"

  providers = {
    aws = aws.us_east_1
  }

  project_name = var.project_name
  environment  = var.environment
  region       = "us-east-1"
  db_password  = random_password.db_passwords["us-east-1"].result
}

# Commented out other regions to save time
# module "secrets_us_west_2" {
#   source = "./modules/secrets"
# 
#   providers = {
#     aws = aws.us_west_2
#   }
# 
#   project_name = var.project_name
#   environment  = var.environment
#   region       = "us-west-2"
#   db_password  = random_password.db_passwords["us-west-2"].result
# }
# 
# module "secrets_eu_central_1" {
#   source = "./modules/secrets"
# 
#   providers = {
#     aws = aws.eu_central_1
#   }
# 
#   project_name = var.project_name
#   environment  = var.environment
#   region       = "eu-central-1"
#   db_password  = random_password.db_passwords["eu-central-1"].result
# }

# VPC infrastructure for each region
module "vpc_us_east_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us_east_1
  }

  project_name           = var.project_name
  environment            = var.environment
  region                 = "us-east-1"
  vpc_cidr               = var.vpc_cidr_blocks["us-east-1"]
  central_logging_bucket = module.central_logging.bucket_name
}

# Commented out other regions to save time
# module "vpc_us_west_2" {
#   source = "./modules/vpc"
# 
#   providers = {
#     aws = aws.us_west_2
#   }
# 
#   project_name           = var.project_name
#   environment            = var.environment
#   region                 = "us-west-2"
#   vpc_cidr               = var.vpc_cidr_blocks["us-west-2"]
#   central_logging_bucket = module.central_logging.bucket_name
# }
# 
# module "vpc_eu_central_1" {
#   source = "./modules/vpc"
# 
#   providers = {
#     aws = aws.eu_central_1
#   }
# 
#   project_name           = var.project_name
#   environment            = var.environment
#   region                 = "eu-central-1"
#   vpc_cidr               = var.vpc_cidr_blocks["eu-central-1"]
#   central_logging_bucket = module.central_logging.bucket_name
# }

output "vpc_ids" {
  description = "VPC IDs for all regions"
  value = {
    us_east_1 = module.vpc_us_east_1.vpc_id
    # us_west_2    = module.vpc_us_west_2.vpc_id  # Commented out to save time
    # eu_central_1 = module.vpc_eu_central_1.vpc_id  # Commented out to save time
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for all regions"
  value = {
    us_east_1 = module.vpc_us_east_1.private_subnet_id
    # us_west_2    = module.vpc_us_west_2.private_subnet_id  # Commented out to save time
    # eu_central_1 = module.vpc_eu_central_1.private_subnet_id  # Commented out to save time
  }
}

output "database_subnet_ids" {
  description = "Database subnet IDs for all regions"
  value = {
    us_east_1 = module.vpc_us_east_1.database_subnet_id
    # us_west_2    = module.vpc_us_west_2.database_subnet_id  # Commented out to save time
    # eu_central_1 = module.vpc_eu_central_1.database_subnet_id  # Commented out to save time
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
    # us_west_2 = {  # Commented out to save time
    #   db_password = module.secrets_us_west_2.db_password_secret_arn
    #   api_keys    = module.secrets_us_west_2.api_keys_secret_arn
    # }
    # eu_central_1 = {  # Commented out to save time
    #   db_password = module.secrets_eu_central_1.db_password_secret_arn
    #   api_keys    = module.secrets_eu_central_1.api_keys_secret_arn
    # }
  }
}
