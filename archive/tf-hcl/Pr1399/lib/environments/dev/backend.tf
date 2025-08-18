# Development backend configuration
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "tap-stack/dev/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
