locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "multi-region-infrastructure"
      Timestamp   = timestamp()
    }
  )

  name_prefix = "${var.environment}-${random_string.suffix.result}"

  regions_padded = length(var.regions) > 0 ? var.regions : [var.aws_region]

  region0 = try(local.regions_padded[0], null)
  region1 = try(local.regions_padded[1], null)
  region2 = try(local.regions_padded[2], null)

  # Per-region computed subnet cidrs for multi-region deployments
  subnet_cidrs = {
    for region in var.regions : region => {
      public = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i)
      ]
      private = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i + var.availability_zones_per_region)
      ]
      database = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i + (2 * var.availability_zones_per_region))
      ]
    }
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "rds_master" {
  length  = 32
  special = true
}


