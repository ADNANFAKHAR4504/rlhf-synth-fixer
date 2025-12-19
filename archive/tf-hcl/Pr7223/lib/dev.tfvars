# Development environment configuration
environment        = "dev"
aws_region         = "eu-west-1"
environment_suffix = "dev"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# Database Configuration
aurora_instance_class = "db.t3.small"
aurora_instance_count = 1

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 7

# ALB Configuration
alb_instance_type = "t3.small"

# Tags
project_id = "payment-proc"
