```hcl
# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"

  default_tags {
    tags = local.common_tags
  }
}

# Generate a unique random suffix for resource names
resource "random_string" "unique_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Generate timestamp for additional uniqueness
locals {
  timestamp     = formatdate("YYYYMMDD-HHmmss", timestamp())
  environment   = "dev"
  owner         = "platform-team"
  unique_suffix = random_string.unique_suffix.result
  deployment_id = "${local.environment}-${local.timestamp}-${local.unique_suffix}"

  # Simplified naming for resources that cause dependency cycles
  simple_suffix = "${local.environment}-${local.timestamp}"

  common_tags = {
    Environment  = local.environment
    Owner        = local.owner
    Project      = "multi-region-infrastructure"
    ManagedBy    = "terraform"
    UniqueSuffix = local.unique_suffix
    DeploymentId = local.deployment_id
    DeployedAt   = local.timestamp
  }
  naming = {
    short    = { pattern = "${local.environment}-${local.unique_suffix}" }
    standard = { pattern = "${local.environment}-${local.timestamp}-${local.unique_suffix}" }
    regional = { pattern = "${local.environment}-${local.unique_suffix}" }
    full     = { pattern = "${local.deployment_id}" }
    # Simple naming for resources that cause cycles
    simple = { pattern = "${local.simple_suffix}" }
  }

  regions = {
    us_east_1      = { name = "us-east-1", cidr = "10.0.0.0/16" }
    eu_west_1      = { name = "eu-west-1", cidr = "10.1.0.0/16" }
    ap_southeast_1 = { name = "ap-southeast-1", cidr = "10.2.0.0/16" }
  }
}

# US East 1 Infrastructure
module "vpc_us_east_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_east_1
  }

  vpc_cidr    = local.regions.us_east_1.cidr
  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_us_east_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_us_east_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.us_east_1
  }

  environment           = local.environment
  region                = local.regions.us_east_1.name
  vpc_id                = module.vpc_us_east_1.vpc_id
  subnet_ids            = module.vpc_us_east_1.private_subnet_ids
  public_subnet_ids     = module.vpc_us_east_1.public_subnet_ids
  security_group_id     = module.vpc_us_east_1.web_security_group_id
  instance_profile_name = module.iam_us_east_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_us_east_1" {
  source = "./modules/database"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration
  is_primary                 = true
  private_subnet_ids         = module.vpc_us_east_1.private_subnet_ids
  database_security_group_id = module.vpc_us_east_1.database_security_group_id
}

module "logging_us_east_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.us_east_1
  }

  region      = local.regions.us_east_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# EU West 1 Infrastructure
module "vpc_eu_west_1" {
  source = "./modules/vpc"
  providers = {
    aws = aws.eu_west_1
  }

  vpc_cidr    = local.regions.eu_west_1.cidr
  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "iam_eu_west_1" {
  source = "./modules/iam"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

module "compute_eu_west_1" {
  source = "./modules/compute"
  providers = {
    aws = aws.eu_west_1
  }

  environment           = local.environment
  region                = local.regions.eu_west_1.name
  vpc_id                = module.vpc_eu_west_1.vpc_id
  subnet_ids            = module.vpc_eu_west_1.private_subnet_ids
  public_subnet_ids     = module.vpc_eu_west_1.public_subnet_ids
  security_group_id     = module.vpc_eu_west_1.web_security_group_id
  instance_profile_name = module.iam_eu_west_1.ec2_instance_profile_name
  common_tags           = local.common_tags
}

module "database_eu_west_1" {
  source = "./modules/database"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags

  # Database configuration - Temporarily disabled read replica to avoid timing issues
  # Will be re-enabled after primary database is fully available
  is_primary                 = true # Temporarily set to true to avoid read replica creation
  private_subnet_ids         = module.vpc_eu_west_1.private_subnet_ids
  database_security_group_id = module.vpc_eu_west_1.database_security_group_id
  # source_db_identifier       = module.database_us_east_1.database_identifier  # Temporarily commented out

  # Ensure primary database is fully available before creating read replica
  depends_on = [module.database_us_east_1]
}

module "logging_eu_west_1" {
  source = "./modules/logging"
  providers = {
    aws = aws.eu_west_1
  }

  region      = local.regions.eu_west_1.name
  environment = local.environment
  common_tags = local.common_tags
}

# AP Southeast 1 Infrastructure - Commented out due to AWS limits
# module "vpc_ap_southeast_1" {
#   source = "./modules/vpc"
#   providers = {
#     aws = aws.ap_southeast_1
#   }
#
#   vpc_cidr    = local.regions.ap_southeast_1.cidr
#   region      = local.regions.ap_southeast_1.name
#   environment = local.environment
#   common_tags = local.common_tags
# }
#
# module "iam_ap_southeast_1" {
#   source = "./modules/iam"
#   providers = {
#     aws = aws.ap_southeast_1
#   }
#
#   region      = local.regions.ap_southeast_1.name
#   environment = local.environment
#   common_tags = local.common_tags
# }
#
# module "compute_ap_southeast_1" {
#   source = "./modules/compute"
#   providers = {
#     aws = aws.ap_southeast_1
#   }
#
#   environment           = local.environment
#   region                = local.regions.ap_southeast_1.name
#   vpc_id                = module.vpc_ap_southeast_1.vpc_id
#   subnet_ids            = module.vpc_ap_southeast_1.private_subnet_ids
#   public_subnet_ids     = module.vpc_ap_southeast_1.public_subnet_ids
#   security_group_id     = module.vpc_ap_southeast_1.web_security_group_id
#   instance_profile_name = module.iam_ap_southeast_1.ec2_instance_profile_name
#   common_tags           = local.common_tags
# }
#
# module "database_ap_southeast_1" {
#   source = "./modules/database"
#   providers = {
#     aws = aws.ap_southeast_1
#   }
#
#   region      = local.regions.ap_southeast_1.name
#   environment = local.environment
#   common_tags = local.common_tags
#
#   # Database configuration - Read replica
#   is_primary                 = false
#   private_subnet_ids         = module.vpc_ap_southeast_1.private_subnet_ids
#   database_security_group_id = module.vpc_ap_southeast_1.database_security_group_id
#   source_db_identifier       = null
# }
#
# module "logging_ap_southeast_1" {
#   source = "./modules/logging"
#   providers = {
#     aws = aws.ap_southeast_1
#   }
#
#   region      = local.regions.ap_southeast_1.name
#   environment = local.environment
#   common_tags = local.common_tags
# }

# VPC Peering Connections - Only between US East 1 and EU West 1
module "vpc_peering" {
  source = "./modules/vpc-peering"
  providers = {
    aws.us_east_1      = aws.us_east_1
    aws.eu_west_1      = aws.eu_west_1
    aws.ap_southeast_1 = aws.ap_southeast_1
  }

  vpc_us_east_1_id = module.vpc_us_east_1.vpc_id
  vpc_eu_west_1_id = module.vpc_eu_west_1.vpc_id

  vpc_us_east_1_cidr = local.regions.us_east_1.cidr
  vpc_eu_west_1_cidr = local.regions.eu_west_1.cidr

  environment = local.environment
  common_tags = local.common_tags
}

# Route 53 Multi-Regional DNS - Commented out for now due to zone ID issues
# module "route53" {
#   source = "./modules/route53"
#   providers = {
#     aws.us_east_1      = aws.us_east_1
#     aws.eu_west_1      = aws.eu_west_1
#     aws.ap_southeast_1 = aws.ap_southeast_1
#   }
#   domain_name = "myapp.com" # Replace with your actual domain
#   environment = local.environment
#   common_tags = local.common_tags
#   # Load balancer endpoints
#   us_east_1_lb_dns      = module.compute_us_east_1.load_balancer_dns_name
#   eu_west_1_lb_dns      = module.compute_eu_west_1.load_balancer_dns_name
#   ap_southeast_1_lb_dns = module.compute_ap_southeast_1.load_balancer_dns_name
#   # Health check configurations
#   us_east_1_region      = local.regions.us_east_1.name
#   eu_west_1_region      = local.regions.eu_west_1.name
#   ap_southeast_1_region = local.regions.ap_southeast_1.name
# }

# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc_us_east_1.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc_us_east_1.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc_us_east_1.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc_us_east_1.private_subnet_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc_us_east_1.internet_gateway_id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.vpc_us_east_1.web_security_group_id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = module.vpc_us_east_1.database_security_group_id
}

# IAM Outputs
output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = module.iam_us_east_1.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = module.iam_us_east_1.ec2_role_arn
}

output "rds_monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = module.iam_us_east_1.rds_monitoring_role_arn
}

# Compute Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = module.compute_us_east_1.launch_template_id
}

output "launch_template_name" {
  description = "Name of the launch template"
  value       = module.compute_us_east_1.launch_template_name
}

output "autoscaling_group_id" {
  description = "ID of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_id
}

output "autoscaling_group_name" {
  description = "Name of the autoscaling group"
  value       = module.compute_us_east_1.autoscaling_group_name
}

output "load_balancer_id" {
  description = "ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_id
}

output "load_balancer_arn" {
  description = "ARN of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the application load balancer"
  value       = module.compute_us_east_1.load_balancer_zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.compute_us_east_1.target_group_arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = module.compute_us_east_1.target_group_name
}

output "listener_arn" {
  description = "ARN of the load balancer listener"
  value       = module.compute_us_east_1.listener_arn
}

output "ami_id" {
  description = "ID of the Amazon Linux AMI used"
  value       = module.compute_us_east_1.ami_id
}

output "instance_type" {
  description = "Instance type used in the launch template"
  value       = module.compute_us_east_1.instance_type
}

# Database Outputs
output "database_instance_id" {
  description = "ID of the primary database instance"
  value       = module.database_us_east_1.database_instance_id
}

output "database_instance_arn" {
  description = "ARN of the primary database instance"
  value       = module.database_us_east_1.database_instance_arn
}

output "database_endpoint" {
  description = "Endpoint of the primary database instance"
  value       = module.database_us_east_1.database_endpoint
}

output "database_port" {
  description = "Port of the primary database instance"
  value       = module.database_us_east_1.database_port
}

output "database_name" {
  description = "Name of the primary database"
  value       = module.database_us_east_1.database_name
}

output "database_username" {
  description = "Username of the primary database"
  value       = module.database_us_east_1.database_username
}

output "database_identifier" {
  description = "Identifier of the primary database instance"
  value       = module.database_us_east_1.database_identifier
}

output "database_engine_version" {
  description = "Engine version of the database"
  value       = module.database_us_east_1.database_engine_version
}

output "database_instance_class" {
  description = "Instance class of the database"
  value       = module.database_us_east_1.database_instance_class
}

output "database_allocated_storage" {
  description = "Allocated storage of the database"
  value       = module.database_us_east_1.database_allocated_storage
}

output "database_encrypted" {
  description = "Whether the database storage is encrypted"
  value       = module.database_us_east_1.database_encrypted
}

output "subnet_group_id" {
  description = "ID of the database subnet group"
  value       = module.database_us_east_1.subnet_group_id
}

output "subnet_group_name" {
  description = "Name of the database subnet group"
  value       = module.database_us_east_1.subnet_group_name
}

output "parameter_group_id" {
  description = "ID of the database parameter group"
  value       = module.database_us_east_1.parameter_group_id
}

output "parameter_group_name" {
  description = "Name of the database parameter group"
  value       = module.database_us_east_1.parameter_group_name
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_name
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = module.database_us_east_1.ssm_parameter_arn
}

# Logging Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = module.logging_us_east_1.application_log_group_arn
}

output "rds_log_group_name" {
  description = "Name of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_name
}

output "rds_log_group_arn" {
  description = "ARN of the RDS CloudWatch log group"
  value       = module.logging_us_east_1.rds_log_group_arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = module.logging_us_east_1.dashboard_arn
}

output "log_retention_days" {
  description = "Log retention period in days"
  value       = module.logging_us_east_1.log_retention_days
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = local.environment
}

output "region" {
  description = "Primary region"
  value       = local.regions.us_east_1.name
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Summary Outputs
# Multi-Regional Infrastructure Outputs
output "eu_west_1_vpc_id" {
  description = "VPC ID for EU West 1"
  value       = module.vpc_eu_west_1.vpc_id
}

# output "ap_southeast_1_vpc_id" {
#   description = "VPC ID for AP Southeast 1"
#   value       = module.vpc_ap_southeast_1.vpc_id
# }

output "eu_west_1_load_balancer_dns" {
  description = "Load balancer DNS name for EU West 1"
  value       = module.compute_eu_west_1.load_balancer_dns_name
}

# output "ap_southeast_1_load_balancer_dns" {
#   description = "Load balancer DNS name for AP Southeast 1"
#   value       = module.compute_ap_southeast_1.load_balancer_dns_name
# }

output "eu_west_1_database_endpoint" {
  description = "Database endpoint for EU West 1 read replica"
  value       = module.database_eu_west_1.database_endpoint
}

# output "ap_southeast_1_database_endpoint" {
#   description = "Database endpoint for AP Southeast 1 read replica"
#   value       = module.database_ap_southeast_1.database_endpoint
# }

# VPC Peering Outputs
output "vpc_peering_connections" {
  description = "All VPC peering connection IDs"
  value       = module.vpc_peering.all_peering_connections
}

# Route 53 Outputs - Disabled for now
# output "route53_hosted_zone_id" {
#   description = "Route 53 hosted zone ID"
#   value       = module.route53.hosted_zone_id
# }
# 
# output "route53_name_servers" {
#   description = "Route 53 name servers"
#   value       = module.route53.hosted_zone_name_servers
# }
# 
# output "route53_primary_dns" {
#   description = "Primary DNS record"
#   value       = module.route53.primary_dns_record
# }
# 
# output "route53_regional_dns" {
#   description = "Regional DNS records"
#   value       = module.route53.regional_dns_records
# }

output "infrastructure_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    environment = local.environment
    regions = {
      us_east_1 = {
        region            = local.regions.us_east_1.name
        vpc_id            = module.vpc_us_east_1.vpc_id
        vpc_cidr          = module.vpc_us_east_1.vpc_cidr_block
        load_balancer_dns = module.compute_us_east_1.load_balancer_dns_name
        database_endpoint = module.database_us_east_1.database_endpoint
        autoscaling_group = module.compute_us_east_1.autoscaling_group_name
      }
      eu_west_1 = {
        region            = local.regions.eu_west_1.name
        vpc_id            = module.vpc_eu_west_1.vpc_id
        vpc_cidr          = module.vpc_eu_west_1.vpc_cidr_block
        load_balancer_dns = module.compute_eu_west_1.load_balancer_dns_name
        database_endpoint = module.database_eu_west_1.database_endpoint
        autoscaling_group = module.compute_eu_west_1.autoscaling_group_name
      }
      ap_southeast_1 = {
        region            = "disabled"
        vpc_id            = "disabled"
        vpc_cidr          = "disabled"
        load_balancer_dns = "disabled"
        database_endpoint = "disabled"
        autoscaling_group = "disabled"
      }
    }
    vpc_peering = module.vpc_peering.all_peering_connections
    route53 = {
      hosted_zone_id = "disabled"
      domain_name    = "myapp.com"
      primary_dns    = "disabled"
      regional_dns = {
        ap_southeast_1 = "disabled"
        eu_west_1      = "disabled"
        us_east_1      = "disabled"
      }
    }
    dashboard_name = module.logging_us_east_1.dashboard_name
  }
}


```

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}


```