locals {
  # Select the required number of availability zones
  azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zones_count)

  # Calculate subnet CIDRs
  public_subnet_cidrs   = [for i in range(var.availability_zones_count) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnet_cidrs  = [for i in range(var.availability_zones_count) : cidrsubnet(var.vpc_cidr, 8, i + 10)]
  database_subnet_cidrs = [for i in range(var.availability_zones_count) : cidrsubnet(var.vpc_cidr, 8, i + 20)]

  # Common naming prefix
  name_prefix = "payment-app-${var.environment_suffix}"

  # Common tags
  common_tags = {
    Environment = var.environment_suffix
    Project     = "payment-processing-app"
    ManagedBy   = "terraform"
  }
}
