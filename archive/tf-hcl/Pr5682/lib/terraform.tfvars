# Environment configuration
environment_suffix = "synth101000811"
aws_region         = "us-east-1"

# Network configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# Security configuration
allowed_ssh_cidr = "10.0.0.0/8"

# Resource tags
tags = {
  Project     = "payment-processing"
  Environment = "production"
  Compliance  = "PCI-DSS"
  ManagedBy   = "terraform"
  CostCenter  = "fintech-ops"
}
