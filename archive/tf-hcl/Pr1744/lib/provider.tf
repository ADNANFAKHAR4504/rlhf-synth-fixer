terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    # Configuration provided during terraform init
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy         = "terraform"
      Project           = var.project_name
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

# Regional provider aliases for multi-region resources
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      ManagedBy         = "terraform"
      Project           = var.project_name
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  default_tags {
    tags = {
      ManagedBy         = "terraform"
      Project           = var.project_name
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      ManagedBy         = "terraform"
      Project           = var.project_name
      Environment       = var.environment
      EnvironmentSuffix = var.environment_suffix
    }
  }
}
