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
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.common_tags
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "zone-name"
    values = ["${var.region}a", "${var.region}b", "${var.region}c"]
  }
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  cluster_name = "eks-cluster-${var.environment_suffix}"
  azs          = slice(data.aws_availability_zones.available.names, 0, 3)

  tags = merge(
    var.common_tags,
    {
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
}
