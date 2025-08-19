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

locals {
  environment = "dev"
  owner       = "platform-team"

  common_tags = {
    Environment = local.environment
    Owner       = local.owner
    Project     = "multi-region-infrastructure"
    ManagedBy   = "terraform"
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
}
