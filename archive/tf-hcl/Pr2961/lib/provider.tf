# provider.tf
# Terraform providers and backend configuration for enterprise security infrastructure
# Project #166 - IaC AWS Nova Model Breaking Initiative

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.4"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project             = "Nova-166"
      SecurityLevel       = "Enterprise"
      ComplianceFramework = "SOC2-PCI-HIPAA"
      DataClassification  = "Sensitive"
      ManagedBy           = "Terraform"
      LastUpdated         = timestamp()
    }
  }
}
