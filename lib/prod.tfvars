# prod.tfvars - Production Environment Configuration

environment        = "prod"
environment_suffix = "prod-001"
project_name       = "tap-multi-env"

# Network Configuration
vpc_cidr           = "10.2.0.0/16"
az_count           = 3
enable_nat_gateway = true

# EC2 and Auto Scaling Configuration
instance_type        = "t3.medium"
ami_id               = "ami-06124b567f8becfbd"
asg_min_size         = 2
asg_max_size         = 6
asg_desired_capacity = 3

# RDS Configuration (commented out: RDS not deployed in LocalStack)
db_instance_class        = "db.t3.medium"
db_allocated_storage     = 100
db_name                  = "appdb"
db_username              = "admin"
# db_password            = "PLACEHOLDER" # Set via environment variable or secrets manager
db_multi_az              = true
db_backup_retention_days = 30

# S3 Configuration
s3_versioning_enabled = true

# CloudWatch Configuration
log_retention_days = 30
