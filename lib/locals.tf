locals {
  common_tags = {
    Environment = var.environment_suffix
    Project     = "transaction-processing"
    ManagedBy   = "terraform"
  }

  primary_azs   = ["${var.primary_region}a", "${var.primary_region}b", "${var.primary_region}c"]
  secondary_azs = ["${var.secondary_region}a", "${var.secondary_region}b", "${var.secondary_region}c"]

  primary_public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  primary_private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  primary_db_subnets      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  secondary_public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  secondary_private_subnets = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
  secondary_db_subnets      = ["10.1.21.0/24", "10.1.22.0/24", "10.1.23.0/24"]
}
