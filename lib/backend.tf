terraform {
  backend "s3" {
    bucket         = "terraform-state-eks-cluster"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-eks"
  }
}
