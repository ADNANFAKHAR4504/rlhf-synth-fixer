locals {
  workspace_config = {
    legacy = {
      vpc_cidr             = var.legacy_vpc_cidr
      public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"] # Two public subnets
      private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
      instance_type        = "t3.medium"
      availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
    }
    production = {
      vpc_cidr             = var.production_vpc_cidr
      public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"] # Two public subnets
      private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
      instance_type        = "t3.large"
      availability_zones   = ["${var.aws_region}a", "${var.aws_region}b"]
    }
  }

  config = lookup(local.workspace_config, terraform.workspace != "" ? terraform.workspace : "production", local.workspace_config["production"])

  common_tags = {
    Workspace = terraform.workspace
    Suffix    = var.environment_suffix
  }
}
