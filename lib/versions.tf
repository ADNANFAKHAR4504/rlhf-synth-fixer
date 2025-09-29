terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Remote state configuration example
  backend "s3" {
    # These values should be configured during terraform init
    # terraform init -backend-config="bucket=my-terraform-state" \
    #               -backend-config="key=secure-env/terraform.tfstate" \
    #               -backend-config="region=ap-southeast-1"
    # bucket         = "my-terraform-state-bucket"
    # key            = "secure-env/terraform.tfstate"
    # region         = "ap-southeast-1"
    # encrypt        = true
    # dynamodb_table = "terraform-state-lock"
  }
}


