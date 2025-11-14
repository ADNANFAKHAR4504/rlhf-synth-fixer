# AWS Configuration
aws_region = "us-east-1"

# Environment Configuration
environment        = "production"
project_name       = "ecommerce-catalog-api"
environment_suffix = "synth-v4bg1"

# Network Configuration
vpc_cidr = "10.0.0.0/16"

# Instance Configuration
instance_type = "t3.medium"

# Auto Scaling Configuration
asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

# SSL Configuration
domain_name = "api.example.com"

# Database Configuration
rds_subnet_group_name = "prod-db-subnet-group"
