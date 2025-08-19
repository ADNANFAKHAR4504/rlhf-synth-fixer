# Default variable values for CI/CD and development
# These can be overridden by environment variables or command line
aws_region           = "us-east-1"
project_name         = "tap"
environment_name     = "dev"
environment_suffix   = "dev"
notification_email   = "devops@example.com"
allowed_ssh_cidrs    = []
instance_type        = "t3.micro"
enable_vpc_flow_logs = true
tags = {
  ManagedBy  = "Terraform"
  Repository = "iac-test-automations"
}