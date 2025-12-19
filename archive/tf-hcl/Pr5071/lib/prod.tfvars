# Production Environment Configuration
environment = "prod"
aws_region  = "us-east-1"

# Network
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
enable_nat           = true
nat_gateway_count    = 2

# Services
service_names = [
  "billing", "ledger", "auth", "payment", "notification",
  "user-service", "account-service", "transaction-service",
  "fraud-detection", "compliance"
]

# DynamoDB (with PROVISIONED billing for high-traffic tables)
ddb_tables = {
  billing = {
    name           = "billing"
    hash_key       = "id"
    range_key      = "timestamp"
    billing_mode   = "PROVISIONED"
    read_capacity  = 10
    write_capacity = 10
  }
  ledger = {
    name           = "ledger"
    hash_key       = "id"
    range_key      = "timestamp"
    billing_mode   = "PROVISIONED"
    read_capacity  = 20
    write_capacity = 20
  }
  auth = {
    name           = "auth"
    hash_key       = "id"
    range_key      = null
    billing_mode   = "PAY_PER_REQUEST"
    read_capacity  = null
    write_capacity = null
  }
  payment = {
    name           = "payment"
    hash_key       = "transaction_id"
    range_key      = "created_at"
    billing_mode   = "PROVISIONED"
    read_capacity  = 50
    write_capacity = 50
  }
}

# Aurora
aurora_engine         = "aurora-postgresql"
aurora_engine_version = "14.6"
aurora_instance_class = "db.r5.2xlarge"
aurora_username       = "dbadmin"
aurora_password       = "ProdPass456!UseSecretsManager"
aurora_db_name        = "fintech_prod"

# S3 Buckets (must be globally unique)
artifact_bucket_name = "fintech-prod-artifacts-20241023-unique"
data_bucket_name     = "fintech-prod-data-20241023-unique"
staging_bucket_name  = "fintech-prod-staging-20241023-unique"

# Masking Rules
masking_rules = {
  "email"          = "masked+{{hash}}@example.com"
  "phone"          = "555-{{hash:4}}"
  "ssn"            = "XXX-XX-{{last:4}}"
  "credit_card"    = "XXXX-XXXX-XXXX-{{last:4}}"
  "bank_account"   = "****{{last:4}}"
  "routing_number" = "****{{last:4}}"
}

# Source environment references (OPTIONAL - for cross-environment data refresh/sync)
# For production, these are typically not needed (defaults to self-references)
# Uncomment only if you need to refresh prod from another source (unusual):
# source_account_id         = "987654321098"                      # Source account ID
# source_data_bucket        = "fintech-prod-data-20241023-unique" # Source bucket
# source_cluster_identifier = "fintech-prod-aurora"               # Source cluster

# Tags
tags = {
  Environment = "production"
  ManagedBy   = "terraform"
  Project     = "fintech-platform"
  CostCenter  = "operations"
  Compliance  = "pci-dss"
  DataClass   = "confidential"
}
