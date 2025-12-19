# Terraform Variables for TAP Stack
# This file contains variable values to avoid quota and naming conflicts

# Email for notifications
notification_email = "test@example.com"

# DB Subnet Group Settings - Set to false if you hit the 100 subnet group quota
create_db_subnet_group   = false
existing_db_subnet_group = "default"

# VPC and Networking
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

# EC2 and Auto Scaling
instance_type          = "t3.medium"
asg_min_size           = 2
asg_max_size           = 10
asg_desired_capacity   = 2
target_cpu_utilization = 70

# RDS Database
db_engine         = "mysql"
db_engine_version = "8.0.39"
db_instance_class = "db.t3.medium"
db_name           = "webapp"
db_username       = "admin"
db_password       = "ChangeMe123!"

# Logging and Lifecycle
log_lifecycle_days  = 90
log_transition_days = 30

# CloudFront Certificate (optional)
acm_certificate_arn = ""
