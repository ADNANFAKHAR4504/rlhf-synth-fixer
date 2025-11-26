# Staging environment configuration
environment        = "staging"
aws_region         = "us-west-2"
environment_suffix = "staging"

# Network Configuration
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

# Database Configuration
aurora_instance_class = "db.t3.medium"
aurora_instance_count = 2

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout     = 60

# S3 Configuration
s3_bucket_count = 3

# CloudWatch Configuration
log_retention_days = 30

# ALB Configuration
alb_instance_type = "t3.medium"

# Tags
project_id = "payment-proc"
