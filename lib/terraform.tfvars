# terraform.tfvars - Environment-specific values

# Use environment variable if set, otherwise use default
environment_suffix = "prIAC291786"

# Multi-environment configuration
environment = "development"

# VPC configuration for development
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]

# Instance configurations
instance_type     = "t3.micro"
db_instance_class = "db.t3.micro"

# Multi-AZ and deletion protection settings
enable_multi_az            = false
enable_deletion_protection = false
enable_multi_az_nat        = false

# Auto Scaling configuration (for production)
asg_desired_capacity = 2
asg_max_size         = 4
asg_min_size         = 1

# RDS configuration
rds_allocated_storage       = 20
rds_max_allocated_storage   = 100
rds_backup_retention_period = 7

# CloudWatch configuration
cloudwatch_log_retention_days = 14

# SSH access restrictions
allowed_ssh_cidrs = ["10.0.0.0/8"]