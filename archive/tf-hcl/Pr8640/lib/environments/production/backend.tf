terraform {
  backend "s3" {
    bucket         = "terraform-state-multi-env-infra-prd001"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks-multi-env-infra-prd001"
    encrypt        = true
  }
}
