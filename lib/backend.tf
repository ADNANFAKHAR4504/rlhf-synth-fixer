terraform {
  backend "s3" {
    bucket         = "terraform-state-financial-services"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
