# provider.tf

terraform {
  required_version = ">= 1.4.0"


}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
