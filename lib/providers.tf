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


# Primary AWS provider for general resources
provider "aws" {
  alias  = "global"
  region = var.primary_region
}

provider "aws" {
  alias  = "dr"
  region = var.dr_region
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}
