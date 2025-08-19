terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for ap-south-1
provider "aws" {
  region = "ap-south-1"
}

# Secondary provider for ap-southeast-2
provider "aws" {
  alias  = "ap_southeast_2"
  region = "ap-southeast-2"
}