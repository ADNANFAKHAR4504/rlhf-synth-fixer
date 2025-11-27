# Terraform variables for loan processing infrastructure
# Environment: synthz4a8u2v3 (from metadata)

environment_suffix = "synthz4a8u2v3"
aws_region         = "us-east-1"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database Configuration
db_master_username = "dbadmin"

# Auto Scaling Configuration
instance_types   = ["t3.medium", "t3a.medium"]
min_capacity     = 2
max_capacity     = 6
desired_capacity = 3

# S3 Lifecycle Configuration
logs_retention_days      = 30
documents_retention_days = 90
documents_glacier_days   = 60

# Tags
tags = {
  Project    = "LoanProcessing"
  ManagedBy  = "Terraform"
  Compliance = "PCI-DSS"
  Team       = "synth-2"
}
