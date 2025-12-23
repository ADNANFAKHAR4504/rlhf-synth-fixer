# Staging Environment Configuration
environment        = "staging"
environment_suffix = "stg001"
aws_region         = "us-west-2"
vpc_cidr           = "10.1.0.0/16"

availability_zones = [
  "us-west-2a",
  "us-west-2b",
  "us-west-2c"
]

aurora_instance_class = "db.r6g.large"
aurora_instance_count = 2

lambda_memory_size = 512
lambda_timeout     = 180

log_retention_days = 30

# Optional features
enable_config_rules   = false
enable_step_functions = false
enable_eventbridge    = false
