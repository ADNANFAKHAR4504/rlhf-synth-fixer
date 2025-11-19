# staging.tfvars - Staging Environment Configuration

environment        = "staging"
environment_suffix = "staging-001"
project_name       = "tap-multi-env"

# Network Configuration
vpc_cidr           = "10.1.0.0/16"
az_count           = 2
enable_nat_gateway = true

# EC2 and Auto Scaling Configuration
instance_type        = "t3.small"
ami_id               = "ami-06124b567f8becfbd"
asg_min_size         = 1
asg_max_size         = 4
asg_desired_capacity = 2

# RDS Configuration
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_name                  = "appdb"
db_username              = "admin"
db_password              = "StagingPassword123!"
db_multi_az              = true
db_backup_retention_days = 7

# S3 Configuration
s3_versioning_enabled = true

# CloudWatch Configuration
log_retention_days = 14
