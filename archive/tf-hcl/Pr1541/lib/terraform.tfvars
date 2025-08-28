# Terraform variables for production-ready deployment
# These values can be overridden via environment variables or CLI flags

aws_region         = "us-east-1"
environment_suffix = "dev"
project_name       = "secure-web-app"
environment        = "Production"
vpc_cidr           = "10.0.0.0/16"
instance_type      = "t3.micro"
min_size           = 2
max_size           = 5
desired_capacity   = 2

# EIP optimization - set to true if hitting EIP limits
use_single_nat = true
