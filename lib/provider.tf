terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Organization  = "FinancialServices"
      ManagedBy     = "Terraform"
      Compliance    = "SOX-PCI-DSS"
    }
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Organization  = "FinancialServices"
      ManagedBy     = "Terraform"
      Compliance    = "SOX-PCI-DSS"
    }
  }
}