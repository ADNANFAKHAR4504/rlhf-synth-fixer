data "aws_vpc" "selected" {
  # Use ENVIRONMENT_SUFFIX to filter VPC by tag if vpc_id not provided
  count = var.vpc_id == "" ? 1 : 0
  filter {
    name   = "tag:EnvironmentSuffix"
    values = [var.environment_suffix]
  }
}

data "aws_subnets" "selected" {
  count = var.vpc_id == "" && length(var.private_subnet_ids) == 0 ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected[0].id]
  }
  filter {
    name   = "tag:Type"
    values = ["private"]
  }
}

locals {
  effective_vpc_id = var.vpc_id != "" ? var.vpc_id : (length(data.aws_vpc.selected) > 0 ? data.aws_vpc.selected[0].id : "")
  effective_private_subnet_ids = length(var.private_subnet_ids) == 3 ? var.private_subnet_ids : (length(data.aws_subnets.selected) > 0 ? slice(data.aws_subnets.selected[0].ids, 0, 3) : [])
}