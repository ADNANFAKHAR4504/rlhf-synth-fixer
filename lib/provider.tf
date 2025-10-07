terraform {# provider.tf

  required_version = ">= 1.2.0"

  required_providers {terraform {

    aws = {  required_version = ">= 1.2.0"

      source  = "hashicorp/aws"

      version = "~> 5.0"  required_providers {

    }    aws = {

    random = {      source  = "hashicorp/aws"

      source  = "hashicorp/random"      version = "~> 5.0"

      version = "~> 3.1"    }

    }    random = {

  }      source  = "hashicorp/random"

}      version = "~> 3.1"

    }

provider "aws" {  }

  region = var.aws_region}

}

# Primary AWS provider for general resources

provider "random" {}provider "aws" {
  region = var.aws_region
}
