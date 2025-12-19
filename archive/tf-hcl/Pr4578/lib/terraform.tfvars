# terraform.tfvars
aws_region            = "us-east-1"
project_name          = "enterprise-monitoring"
environment           = "production"
alert_email_addresses = ["ops-team@company.com", "oncall@company.com"]

# Existing resources to monitor
api_gateway_name        = "my-api-gateway"
lambda_function_names   = ["order-processor", "payment-handler", "notification-service"]
rds_instance_identifier = "production-db"

# Alarm thresholds
api_latency_threshold     = 1000 # milliseconds
api_error_rate_threshold  = 5    # percentage
lambda_error_threshold    = 10   # count
lambda_duration_threshold = 3000 # milliseconds
rds_cpu_threshold         = 80   # percentage
rds_connection_threshold  = 100  # count

common_tags = {
  Environment = "production"
  Team        = "DevOps"
  Project     = "CloudWatch Analytics"
  CostCenter  = "Engineering"
  ManagedBy   = "Terraform"
}