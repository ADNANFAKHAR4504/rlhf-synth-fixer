terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment       = var.environment
      Project           = var.project_name
      ManagedBy         = "Terraform"
      Author            = var.author
      User              = "ngwakoleslieelijah"
      CreatedDate       = var.created_date
      DeployTime        = local.timestamp
      ComplianceLevel   = var.compliance_level
      DataClassification = "Internal"
      BackupRequired    = "true"
      LastAudit         = "2025-08-17"
    }
  }
}

provider "random" {}

