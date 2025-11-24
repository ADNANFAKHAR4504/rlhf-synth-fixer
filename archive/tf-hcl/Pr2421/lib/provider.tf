# provider.tf

terraform {
  required_version = ">= 1.4.0"

required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
  }
}

# Primary provider for us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
  
  default_tags {
    tags = local.common_tags
  }
}

# Secondary provider for us-west-2
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "random" {}
