# Override backend for local testing
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
