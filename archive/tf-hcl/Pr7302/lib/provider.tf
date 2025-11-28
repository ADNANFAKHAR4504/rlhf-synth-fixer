# provider.tf - Updated to include Kubernetes and Helm providers

terraform {
  required_version = ">= 1.5.0" # Updated to match PROMPT requirement

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0" # Changed from ~> to >= for better compatibility
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

  # S3 backend configuration for state management
  # Prevents resource creation conflicts by isolating state per environment
  # Values are injected at terraform init time via -backend-config flags:
  #   -backend-config=bucket=iac-rlhf-tf-states-***
  #   -backend-config=key=prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate
  #   -backend-config=region=us-east-1
  #   -backend-config=encrypt=true
  backend "s3" {
    # All configuration provided via -backend-config during init
  }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region # Using aws_region instead of region

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

# Kubernetes and Helm providers
# These providers are configured to work with EKS after cluster creation
# The deployment script should handle the two-phase deployment:
# Phase 1: Create EKS cluster and infrastructure
# Phase 2: Deploy Kubernetes/Helm resources
