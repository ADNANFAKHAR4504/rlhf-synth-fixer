# Generate unique suffix for resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.suffix.result

  common_tags = {
    Environment        = var.environment
    DataClassification = "Confidential"
    ManagedBy          = "Terraform"
    Project            = "SecurityFoundation"
  }

  resource_prefix = "${var.environment}-security"
}

# Create VPC for endpoints (if not provided)
resource "aws_vpc" "security" {
  count = var.vpc_id == "" ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-vpc-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "security_private" {
  count = var.vpc_id == "" ? 2 : 0

  vpc_id            = aws_vpc.security[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name               = "${local.resource_prefix}-subnet-${count.index + 1}-${local.suffix}"
    DataClassification = "Confidential"
  })

  lifecycle {
    prevent_destroy = false
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  vpc_id     = var.vpc_id != "" ? var.vpc_id : aws_vpc.security[0].id
  subnet_ids = length(var.subnet_ids) > 0 ? var.subnet_ids : aws_subnet.security_private[*].id
}

