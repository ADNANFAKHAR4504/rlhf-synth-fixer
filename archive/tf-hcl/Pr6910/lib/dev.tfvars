# Development Environment Configuration
environment        = "dev"
environment_suffix = "dev001"
aws_region         = "eu-west-1"
vpc_cidr           = "10.0.0.0/16"

availability_zones = [
  "eu-west-1a",
  "eu-west-1b",
  "eu-west-1c"
]

aurora_instance_class = "db.t3.medium"
aurora_instance_count = 1

lambda_memory_size = 256
lambda_timeout     = 60

log_retention_days = 7

# Optional features
enable_config_rules   = false
enable_step_functions = false
enable_eventbridge    = false
