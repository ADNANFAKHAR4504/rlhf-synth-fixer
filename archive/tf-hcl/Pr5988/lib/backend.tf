# Backend configuration without variable interpolation
# Use partial configuration via CLI or backend config file
terraform {
  backend "s3" {
    key    = "migration/terraform.tfstate"
    region = "ap-southeast-1"
  }
}
