# Production environment configuration
environment        = "prod"
aws_region         = "us-east-1"
environment_suffix = "prod"

# Network Configuration
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database Configuration
aurora_instance_class = "db.r5.large"
aurora_instance_count = 3

# Lambda Configuration
lambda_memory_size = 1024
lambda_timeout     = 120

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 90

# ALB Configuration
alb_instance_type = "t3.large"

# Tags
project_id = "payment-proc"
