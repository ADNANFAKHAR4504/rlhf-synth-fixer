# Staging Environment Configuration

environment        = "staging"
environment_suffix = "stg001"
aws_region         = "us-east-1"
project_name       = "payment-processing"

# VPC Configuration
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Application Configuration
instance_type        = "t3.medium"
asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

# Database Configuration
db_instance_class          = "db.t3.medium"
db_allocated_storage       = 50
db_multi_az                = true
db_backup_retention_period = 14

# High Availability
enable_multi_az_nat        = true
enable_enhanced_monitoring = false

# Optional: Email for alarms
alarm_email = "staging-alerts@example.com"
