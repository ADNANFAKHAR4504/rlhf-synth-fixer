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
      version = "~> 3.1"
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
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

# Multi-region providers for payment platform
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "PaymentPlatform"
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

provider "aws" {
  alias  = "eu-west-1"
  region = "eu-west-1"
  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "PaymentPlatform"
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}

provider "aws" {
  alias  = "ap-southeast-1"
  region = "ap-southeast-1"
  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "PaymentPlatform"
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    }
  }
}
