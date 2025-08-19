# provider.tf

terraform {
  required_version = ">= 1.4.0"

   
  # Partial backend config: values are injected at `terraform init` time
backend "s3" {}

}
  
# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
