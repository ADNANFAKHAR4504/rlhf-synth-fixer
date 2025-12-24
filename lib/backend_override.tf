# Override backend for LocalStack testing
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
