region = "us-east-1"
environment = "dev"
cluster_name = "saas-platform-dev"
db_cluster_identifier = "saas-db-dev"
db_master_username = "admin"
db_master_password = "password123"  # Use secure password
cache_cluster_id = "saas-cache-dev"
cognito_user_pool_name = "saas-users-dev"
ecr_repository_names = [
  "api-gateway",
  "user-service",
  "tenant-service",
  "billing-service",
  "notification-service",
  "analytics-service",
  "audit-service",
  "integration-service"
]
github_repo = "TuringGpt/iac-test-automations"