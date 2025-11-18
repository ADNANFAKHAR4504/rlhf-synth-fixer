# provider.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment     = var.environment_suffix
      Repository      = var.repository
      Author          = var.commit_author
      PRNumber        = var.pr_number
      Team            = var.team
      Owner           = "security-team"
      ComplianceScope = "PCI-DSS"
    }
  }
}

# Secondary AWS provider for multi-region resources (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment     = var.environment_suffix
      Repository      = var.repository
      Author          = var.commit_author
      PRNumber        = var.pr_number
      Team            = var.team
      Owner           = "security-team"
      ComplianceScope = "PCI-DSS"
    }
  }
}
