# data.tf - Data sources for existing infrastructure

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Use default VPC for Synthetics canaries
data "aws_vpc" "main" {
  default = true
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Get default security group for Synthetics
data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.main.id

  filter {
    name   = "group-name"
    values = ["default"]
  }
}
