# provider.tf - Updated to include Kubernetes and Helm providers

terraform {
  required_version = ">= 1.5.0"  # Updated to match PROMPT requirement

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"  # Changed from ~> to >= for better compatibility
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region  # Using aws_region instead of region

  default_tags {
    tags = merge(var.tags, {
      Environment = var.environment_suffix
      Repository  = var.repository
      Author      = var.commit_author
      PRNumber    = var.pr_number
      Team        = var.team
    })
  }
}

# Note: Kubernetes and Helm providers will be configured after EKS cluster creation
# They require the EKS cluster endpoint and authentication token
provider "kubernetes" {
  host                   = try(aws_eks_cluster.main.endpoint, "")
  cluster_ca_certificate = try(base64decode(aws_eks_cluster.main.certificate_authority[0].data), "")
  token                  = try(data.aws_eks_cluster_auth.main.token, "")
}

provider "helm" {
  kubernetes {
    host                   = try(aws_eks_cluster.main.endpoint, "")
    cluster_ca_certificate = try(base64decode(aws_eks_cluster.main.certificate_authority[0].data), "")
    token                  = try(data.aws_eks_cluster_auth.main.token, "")
  }
}
