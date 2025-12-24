# Override backend for LocalStack testing - use local backend
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
