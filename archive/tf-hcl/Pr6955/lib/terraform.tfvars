aws_region         = "us-east-1"
environment_suffix = "dev5"
repository         = "payment-processing-migration"
team               = "FinOps"

# Database credentials - USE ENVIRONMENT VARIABLES OR SECRETS MANAGER
# export TF_VAR_db_master_password="your-secure-password"
# export TF_VAR_source_db_password="your-secure-password"

# ✅ NEW: Resource configuration
rds_instance_class  = "db.t4g.medium" # Smaller for dev
ecs_task_cpu        = 512
ecs_task_memory     = 1024
enable_multi_az_dms = false # Set to true for production

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# Container configuration
container_image    = "nginx:latest"
active_environment = "blue"
