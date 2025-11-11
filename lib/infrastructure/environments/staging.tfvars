region = "us-east-1"
environment = "staging"
cluster_name = "saas-platform-staging"
db_cluster_identifier = "saas-db-staging"
db_master_username = "admin"
db_master_password = "password123"  # Use secure password
cache_cluster_id = "saas-cache-staging"
cognito_user_pool_name = "saas-users-staging"
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