# Development Environment Configuration
environment = "dev"
aws_region  = "us-west-2"

# Network
vpc_cidr             = "10.10.0.0/16"
public_subnet_cidrs  = ["10.10.1.0/24", "10.10.2.0/24"]
private_subnet_cidrs = ["10.10.11.0/24", "10.10.12.0/24"]
enable_nat           = true
nat_gateway_count    = 1

# Services
service_names = ["billing", "ledger", "auth"]

# DynamoDB
ddb_tables = {
  billing = {
    name           = "billing"
    hash_key       = "id"
    range_key      = "timestamp"
    billing_mode   = "PAY_PER_REQUEST"
    read_capacity  = null
    write_capacity = null
  }
  ledger = {
    name           = "ledger"
    hash_key       = "id"
    range_key      = "timestamp"
    billing_mode   = "PAY_PER_REQUEST"
    read_capacity  = null
    write_capacity = null
  }
  auth = {
    name           = "auth"
    hash_key       = "id"
    range_key      = null
    billing_mode   = "PAY_PER_REQUEST"
    read_capacity  = null
    write_capacity = null
  }
}

# Aurora
aurora_engine         = "aurora-postgresql"
aurora_engine_version = "14.6"
aurora_instance_class = "db.t3.medium"
aurora_username       = "dbadmin"
aurora_password       = "DevPass123!ChangeMe"
aurora_db_name        = "fintech_dev"

# S3 Buckets (must be globally unique)
artifact_bucket_name = "fintech-dev-artifacts-20241023-unique"
data_bucket_name     = "fintech-dev-data-20241023-unique"
staging_bucket_name  = "fintech-dev-staging-20241023-unique"

# Masking Rules
masking_rules = {
  "email"       = "dev+{{hash}}@example.com"
  "phone"       = "555-{{hash:4}}"
  "ssn"         = "XXX-XX-{{last:4}}"
  "credit_card" = "XXXX-XXXX-XXXX-{{last:4}}"
}

# Source environment references (OPTIONAL - for cross-environment data refresh/sync)
# If not specified, the stack operates standalone using its own resources
# Uncomment these to enable data refresh from another environment (e.g., production):
# source_account_id         = "123456789012"                      # Account ID of source environment
# source_data_bucket        = "fintech-prod-data-20241023-unique" # Source bucket to sync from
# source_cluster_identifier = "fintech-prod-aurora"               # Source Aurora cluster for snapshots

# Tags
tags = {
  Environment = "dev"
  ManagedBy   = "terraform"
  Project     = "fintech-platform"
  CostCenter  = "engineering"
}
