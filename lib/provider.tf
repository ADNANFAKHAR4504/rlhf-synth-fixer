# =============================================================================
# Terraform and Provider Configuration
# =============================================================================
# This file defines the Terraform version constraints, provider configurations,
# and all input variables for the EKS cluster infrastructure. The providers
# include AWS for infrastructure resources, TLS for OIDC thumbprint extraction,
# and random for any unique naming requirements.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  backend "s3" {

  }
}

# =============================================================================
# AWS Provider Configuration
# =============================================================================
# Configure the AWS provider with default tags that will be applied to all
# resources. This ensures consistent tagging for cost tracking, compliance,
# and resource management across the entire infrastructure.
# =============================================================================

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment        = "production"
      ManagedBy          = "terraform"
      Project            = "fintech-microservices"
      CostCenter         = "engineering"
      DataClassification = "confidential"
    }
  }
}

# TLS provider for extracting OIDC thumbprint
provider "tls" {}

# Random provider for unique naming if needed
provider "random" {}

# =============================================================================
# Input Variables
# =============================================================================
# These variables allow customization of the infrastructure deployment while
# maintaining secure defaults. Each variable includes type constraints and
# descriptions for clarity.
# =============================================================================

variable "environment" {
  type        = string
  description = "Environment name for resource naming and tagging"
  default     = "dev"
}

variable "cluster_name" {
  type        = string
  description = "Base name for the EKS cluster, will be suffixed with environment"
  default     = "eks-production-cluster"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version for the EKS cluster"
  default     = "1.28"
}

variable "admin_access_cidr" {
  type        = string
  description = "CIDR block for administrative access to the EKS API endpoint"
  default     = "0.0.0.0/0" # Allow all IPs for testing AND TO GET THE APPLY SUCCESFULL. RESTRICT THIS ONCE DEPLOYMENT DONE
}