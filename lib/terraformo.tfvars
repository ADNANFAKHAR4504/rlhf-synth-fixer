# Multi-region configuration
primary_region   = "us-east-1"
secondary_region = "us-west-2"

# Environment settings
environment  = "production"
project_name = "multi-region-webapp"

# Network configuration
primary_vpc_cidr   = "10.0.0.0/16"
secondary_vpc_cidr = "10.1.0.0/16"

# Compute configuration
instance_type        = "t3.micro"
asg_min_size        = 1
asg_max_size        = 3
asg_desired_capacity = 2

# DNS configuration
domain_name = "example.com"