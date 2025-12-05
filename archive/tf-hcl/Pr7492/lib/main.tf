terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      CostCenter         = var.cost_center
      Environment        = var.environment
      DataClassification = var.data_classification
      ManagedBy          = "Terraform"
      Project            = "CloudWatch-Observability"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

  default_tags {
    tags = {
      CostCenter         = var.cost_center
      Environment        = var.environment
      DataClassification = var.data_classification
      ManagedBy          = "Terraform"
      Project            = "CloudWatch-Observability"
    }
  }
}

# Local values for resource naming
locals {
  name_prefix = "cw-obs-${var.environment_suffix}"

  common_tags = {
    CostCenter         = var.cost_center
    Environment        = var.environment
    DataClassification = var.data_classification
  }
}
