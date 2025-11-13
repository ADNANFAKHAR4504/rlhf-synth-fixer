terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary provider for replication region
provider "aws" {
  alias  = "replication"
  region = var.replication_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  vpc_cidr = var.environment == "dev" ? "10.0.0.0/16" : "172.16.0.0/16"
  azs      = ["${var.region}a", "${var.region}b", "${var.region}c"]

  api_throttle_rate_limit  = var.environment == "dev" ? 100 : 1000
  api_throttle_burst_limit = var.environment == "dev" ? 200 : 2000

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
  }
}