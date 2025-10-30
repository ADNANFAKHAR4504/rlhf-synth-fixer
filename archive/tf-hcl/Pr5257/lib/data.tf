# Data Sources

# Current AWS account information
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {}

# Available AWS availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# AWS partition for constructing ARNs
data "aws_partition" "current" {}
