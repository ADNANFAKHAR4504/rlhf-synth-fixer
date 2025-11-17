# Terraform variables for QA deployment
aws_region         = "us-east-1"
environment_suffix = "synthomii5"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
onprem_cidr        = "192.168.0.0/16"

# Database Configuration
db_master_username = "admin"
db_master_password = "TestPassword123!ChangeMe"

# On-Premises Configuration (test values for deployment)
onprem_db_endpoint     = "test-onprem-db.example.com"
onprem_db_username     = "migration_user"
onprem_db_password     = "TestOnPremPassword123!"
onprem_syslog_endpoint = "syslog.onprem.example.com"

# Application Configuration
payment_app_image = "nginx:latest"
payment_app_port  = 80

# Traffic Distribution (Blue-Green)
blue_target_weight  = 100
green_target_weight = 0

# Tags
cost_center     = "FinTech-Payments"
migration_phase = "preparation"

# Direct Connect (empty for QA - optional)
direct_connect_gateway_id = ""
direct_connect_vif_id     = ""
