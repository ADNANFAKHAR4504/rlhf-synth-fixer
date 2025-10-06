# Example terraform.tfvars file
# Copy this to terraform.tfvars and fill in your values

# Database credentials
db_username = "dbadmin"
db_password = "SecurePassword123!"  # Use AWS Secrets Manager in production

# Environment configuration
environment = "production"
company_name = "finserv"
application_name = "webapp"

# AWS regions
primary_region = "eu-west-1"
secondary_region = "eu-west-2"

# Compute configuration
instance_type = "t3.large"
min_size = 2
max_size = 10
desired_capacity = 4

# Database configuration
db_instance_class = "db.r5.xlarge"

# Network configuration
vpc_cidr = {
  primary   = "10.0.0.0/16"
  secondary = "10.1.0.0/16"
}

# Failover configuration
health_check_interval = 10
failover_threshold = 3

# Tags
tags = {
  Environment = "production"
  Owner       = "platform-team@company.com"
  CostCentre  = "CC-FIN-001"
  Project     = "disaster-recovery"
  Compliance  = "PCI-DSS"
  ManagedBy   = "terraform"
}
