terraform {
  backend "s3" {
    bucket         = "terraform-state-multi-env-infra-stg001"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks-multi-env-infra-stg001"
    encrypt        = true
  }
}
