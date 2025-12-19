# Example terraform.tfvars file
# Copy this file and customize values for your environment

aws_region         = "ap-southeast-1"
environment_suffix = "synth9d4wp"

vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# Database configuration
db_username = "dbadmin"
db_name     = "paymentdb"

# EC2 configuration
instance_type    = "t3.medium"
min_size         = 2
max_size         = 6
desired_capacity = 2

# DMS source endpoint (on-premises database)
dms_source_endpoint_server   = "10.1.1.100"
dms_source_endpoint_port     = 5432
dms_source_endpoint_username = "sourceadmin"
dms_source_endpoint_password = "SourcePassword123!"
dms_source_endpoint_database = "legacy_payment_db"

# Application configuration
app_config_values = {
  "app_version"    = "1.0.0"
  "log_level"      = "INFO"
  "feature_flag_1" = "enabled"
}
