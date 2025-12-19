# Provider configuration only - terraform block is in main.tf
provider "aws" {
  region = var.aws_region
}