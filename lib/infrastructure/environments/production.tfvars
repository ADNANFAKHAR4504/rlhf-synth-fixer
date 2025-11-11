region = "us-east-1"
environment = "production"
cluster_name = "saas-platform-prod"
db_cluster_identifier = "saas-db-prod"
db_master_username = "admin"
cache_cluster_id = "saas-cache-prod"
cognito_user_pool_name = "saas-users-prod"
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