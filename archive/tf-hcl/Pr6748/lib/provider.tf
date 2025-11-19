# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
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
      Environment        = var.environment_suffix
      Repository         = var.repository
      Author             = var.commit_author
      PRNumber           = var.pr_number
      Team               = var.team
      DataClassification = var.data_classification
      ComplianceScope    = "PCI-DSS"
      ManagedBy          = "Terraform"
      SecurityProfile    = "High"
      CostCenter         = var.cost_center
    }
  }
}
