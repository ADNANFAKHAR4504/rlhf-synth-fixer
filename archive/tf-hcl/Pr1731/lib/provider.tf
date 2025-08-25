########################
# provider.tf
########################

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Primary AWS provider (use for main region resources)
provider "aws" {
  alias  = "primary"
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "secure-env"
    }
  }
}

# Secondary AWS provider (use for cross-region resources)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "secure-env"
    }
  }
}

# Best practices:
# - Use provider aliases for multi-region resources.
# - Reference providers in resources using `provider = aws.primary` or `provider = aws.secondary`.
# - Use proper .tf files for logical separation (e.g., kms.tf, vpc.tf, iam.tf, etc.).
# - Use environment suffixes for resource names to avoid conflicts.
# - Ensure all resource names start with a letter and use only letters/numbers for DBs.