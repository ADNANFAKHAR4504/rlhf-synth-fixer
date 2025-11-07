aws_region         = "us-east-1"
environment        = "dev"
project_name       = "ecommerce"
environment_suffix = "synth2jdat"

# Network Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# ACM Certificate
acm_certificate_arn = "arn:aws:acm:us-east-1:342597974367:certificate/5fb950aa-3de8-451e-bcf8-b5b7399419da"

# Compute Configuration
instance_type        = "t3.medium"
asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

# Database Configuration
db_engine_version    = "8.0.39"
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100
db_username          = "admin"
db_password          = "TestPassword123!SecureDb"
db_name              = "ecommercedb"

# Auto Scaling Configuration
cpu_scale_up_threshold   = 70
cpu_scale_down_threshold = 30
