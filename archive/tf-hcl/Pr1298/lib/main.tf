# Random suffix for resource uniqueness
resource "random_id" "resource_suffix" {
  byte_length = 4
}

# Locals for handling environment suffix
locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : (
    terraform.workspace != "default" ? terraform.workspace : "dev"
  )
  resource_prefix = "${var.project_name}-${local.environment_suffix}"
  unique_suffix   = random_id.resource_suffix.hex
}

# Data sources for existing infrastructure
data "aws_vpc" "existing" {
  default = var.vpc_id == "" ? true : null
  id      = var.vpc_id != "" ? var.vpc_id : null
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }

  tags = {
    Type = "Private"
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }

  tags = {
    Type = "Public"
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random password for database secrets
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "random_password" "api_key" {
  length  = 32
  special = false
}
