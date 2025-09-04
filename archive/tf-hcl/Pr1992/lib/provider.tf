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
  backend "s3" {}
}

provider "aws" {
  region = var.primary_region
}

# Secondary provider (e.g., us-west-2)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
