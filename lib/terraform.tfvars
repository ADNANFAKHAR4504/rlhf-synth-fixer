# Terraform variables for task 101912498
environment_suffix = "synth101912498"
region             = "us-east-1"
vpc_cidr           = "10.0.0.0/16"

# Database credentials
db_username = "postgres"
db_password = "TuringTest2024!SecurePass"

# Container configuration
container_image = "public.ecr.aws/docker/library/nginx:latest"
container_port  = 80

# Scaling configuration
min_tasks_per_az         = 2
availability_zones_count = 3

# Monitoring
alarm_email = "test@example.com"

# Route 53 domain (empty as not using custom domain)
domain_name = ""

# Tags
tags = {
  Environment      = "production"
  DisasterRecovery = "enabled"
  ManagedBy        = "Terraform"
  Project          = "TransactionProcessing"
  TaskId           = "101912498"
}
