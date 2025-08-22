terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
      configuration_aliases = [aws.eu_west_1]
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}