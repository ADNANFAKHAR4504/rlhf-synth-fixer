# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.27"
    }
    time = {
      source  = "hashicorp/time"
      version = ">= 0.11"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}


# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.current.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.current.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.current.token
}
