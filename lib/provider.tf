terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }

  backend "s3" {
    # These values will be provided via backend config file or -backend-config flags
    # bucket         = "terraform-state-bucket-name"
    # key            = "terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-locks"
    # encrypt        = true
    # kms_key_id     = "alias/terraform-state-key"
  }
}

# Primary provider for us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = var.common_tags
  }
}

# Secondary provider for eu-central-1
provider "aws" {
  alias  = "eu_central_1"
  region = "eu-central-1"

  default_tags {
    tags = var.common_tags
  }
}

# Default provider (us-east-1 for global resources)
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = var.common_tags
  }
}

provider "random" {}