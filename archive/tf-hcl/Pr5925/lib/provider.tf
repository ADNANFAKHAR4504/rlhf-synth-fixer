terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Environment = "production"
      DR-Role     = "primary"
      ManagedBy   = "terraform"
      Project     = "payment-processing-dr"
    }
  }
}

# DR region provider (us-east-2)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Environment = "production"
      DR-Role     = "secondary"
      ManagedBy   = "terraform"
      Project     = "payment-processing-dr"
    }
  }
}
