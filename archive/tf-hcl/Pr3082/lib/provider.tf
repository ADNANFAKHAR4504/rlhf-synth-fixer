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


# Primary AWS provider for general resources

provider "aws" {
  alias  = "us_east_2"
  region = var.primary_region
  #access_key = var.aws_access_key
  #secret_key = var.aws_secret_key

  #skip_metadata_api_check     = true
  #skip_region_validation      = true
  #skip_credentials_validation = true
  #skip_requesting_account_id  = true
}

provider "aws" {
  alias  = "us_west_1"
  region = var.secondary_region
  #access_key = var.aws_access_key
  #secret_key = var.aws_secret_key

  #skip_metadata_api_check     = true
  #skip_region_validation      = true
  #skip_credentials_validation = true
  #skip_requesting_account_id  = true
}
