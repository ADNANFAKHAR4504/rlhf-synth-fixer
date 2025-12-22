# dev.tfvars - Development Environment Configuration

environment        = "dev"
environment_suffix = "dev-001"
project_name       = "tap-multi-env"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
az_count           = 2
enable_nat_gateway = false # Cost optimization for dev

# EC2 and Auto Scaling Configuration
instance_type        = "t3.micro"
ami_id               = "ami-06124b567f8becfbd"
asg_min_size         = 1
asg_max_size         = 2
asg_desired_capacity = 1

# RDS Configuration
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_name                  = "appdb"
db_username              = "admin"
db_password              = "DevPassword123!"
db_multi_az              = false
db_backup_retention_days = 1

# S3 Configuration
s3_versioning_enabled = false

# CloudWatch Configuration
log_retention_days = 7
