data "aws_caller_identity" "current" {
  provider = aws.hub
}

data "aws_availability_zones" "hub" {
  provider = aws.hub
  state    = "available"
}

data "aws_availability_zones" "uswest" {
  provider = aws.us_west
  state    = "available"
}

data "aws_availability_zones" "europe" {
  provider = aws.europe
  state    = "available"
}

locals {
  hub_azs    = slice(data.aws_availability_zones.hub.names, 0, var.az_count)
  uswest_azs = slice(data.aws_availability_zones.uswest.names, 0, var.az_count)
  europe_azs = slice(data.aws_availability_zones.europe.names, 0, var.az_count)

  common_tags = {
    Project    = var.project_name
    CostCenter = var.cost_center
    ManagedBy  = "terraform"
  }
}

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result
}
