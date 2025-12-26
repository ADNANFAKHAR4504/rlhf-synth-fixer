# LocalStack Configuration
# Disable features not fully supported in LocalStack

aws_region           = "us-east-1"
project_name         = "secure-webapp"
environment          = "dev"
environment_suffix   = "dev"
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

# LocalStack feature flags - disable unsupported features
enable_waf             = false
enable_nat_gateway     = false
enable_alb_access_logs = false
enable_alb             = false
