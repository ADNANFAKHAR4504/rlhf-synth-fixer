# Main configuration file for the payment-app module
# This file can be used for any additional resources or locals

locals {
  common_tags = {
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}