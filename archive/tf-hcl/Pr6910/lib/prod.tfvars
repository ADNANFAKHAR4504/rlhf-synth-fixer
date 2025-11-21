# Production Environment Configuration
environment        = "prod"
environment_suffix = "prd001"
aws_region         = "us-east-1"
vpc_cidr           = "10.2.0.0/16"

availability_zones = [
  "us-east-1a",
  "us-east-1b",
  "us-east-1c"
]

aurora_instance_class = "db.r6g.xlarge"
aurora_instance_count = 3

lambda_memory_size = 1024
lambda_timeout     = 300

log_retention_days = 90

# Optional features
enable_config_rules   = true
enable_step_functions = true
enable_eventbridge    = true
