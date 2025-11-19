# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  # backend "s3" {}  # Commented for local testing - use local state
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

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "primary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "secondary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}
