# Production Environment Configuration

environment        = "prod"
environment_suffix = "prd001"
aws_region         = "us-east-1"
project_name       = "payment-processing"

# VPC Configuration
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Application Configuration
instance_type        = "c5.xlarge"
asg_min_size         = 3
asg_max_size         = 10
asg_desired_capacity = 3

# Database Configuration
db_instance_class          = "db.r5.xlarge"
db_allocated_storage       = 100
db_multi_az                = true
db_backup_retention_period = 30

# High Availability and Performance
enable_multi_az_nat        = true
enable_enhanced_monitoring = true

# Production Alerts
alarm_email = "prod-alerts@example.com"
