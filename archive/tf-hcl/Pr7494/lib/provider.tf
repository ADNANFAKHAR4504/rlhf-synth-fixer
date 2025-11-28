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
  region = var.aws_region

  default_tags {
    tags = {
      Project        = "inventory-migration"
      Environment    = var.environment
      MigrationPhase = var.migration_phase
      CostCenter     = var.cost_center
      ManagedBy      = "terraform"
    }
  }
}
