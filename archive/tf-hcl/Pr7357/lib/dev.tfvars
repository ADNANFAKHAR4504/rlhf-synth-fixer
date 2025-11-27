# Development Environment Configuration

environment        = "dev"
environment_suffix = "d01"
aws_region         = "us-east-1"
project_name       = "payment-processing"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Application Configuration
instance_type        = "t3.small"
asg_min_size         = 1
asg_max_size         = 2
asg_desired_capacity = 1

# Database Configuration
db_instance_class          = "db.t3.small"
db_allocated_storage       = 20
db_multi_az                = false
db_backup_retention_period = 7

# Cost Optimization for Dev
enable_multi_az_nat        = false
enable_enhanced_monitoring = false

# Optional: Email for alarms (leave empty to skip)
alarm_email = ""
