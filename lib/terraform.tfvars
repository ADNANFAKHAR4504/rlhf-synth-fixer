# Terraform variables for disaster recovery infrastructure

environment_suffix = "pr6650"
environment        = "prod"
cost_center        = "engineering"

# Database configuration
database_name      = "transactions"
db_master_username = "admin"
# db_master_password is now managed by AWS Secrets Manager (see modules/secrets)

# Route 53 configuration
domain_name = "dr-example.com"

# SNS notification
sns_email = "devops@example.com"

# Optional overrides (using defaults from variables.tf)
# primary_region               = "us-east-1"
# secondary_region             = "us-west-2"
# db_instance_class            = "db.r6g.large"
# replication_lag_threshold    = 300
# health_check_interval        = 30