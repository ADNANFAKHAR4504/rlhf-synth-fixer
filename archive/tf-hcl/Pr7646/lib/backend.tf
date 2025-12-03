# Backend configuration
terraform {
  backend "s3" {
    bucket = "iac-rlhf-tf-states-us-east-1-342597974367"
    key    = "synth-101000930/terraform.tfstate"
    region = "us-east-1"
  }
}
