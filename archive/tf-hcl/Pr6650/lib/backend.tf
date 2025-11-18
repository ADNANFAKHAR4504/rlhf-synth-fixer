terraform {
  backend "s3" {
    # These values will be provided via -backend-config during init
    # bucket = "iac-rlhf-tf-states-***"
    # key    = "prs/pr6650/terraform.tfstate"
    # region = "us-east-1"
    encrypt = true
  }
}