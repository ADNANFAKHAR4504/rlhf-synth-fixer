# Terraform variables for observability platform deployment
# Auto-generated for QA testing

environment_suffix = "synth101912750"
aws_region         = "us-east-1"

# Repository and tagging variables
repository    = "synth-101912750"
commit_author = "ArpitPatidar"
pr_number     = "unknown"
team          = "synth"

# Monitoring target resources (placeholders for testing)
ecs_cluster_name       = "payment-processing-cluster-synth101912750"
rds_cluster_identifier = "payment-db-cluster-synth101912750"
alb_arn_suffix         = "app/payment-alb-synth101912750/test"

# Log configuration
log_group_names = [
  "/aws/ecs/payment-service-synth101912750",
  "/aws/ecs/transaction-service-synth101912750"
]
log_retention_days = 30

# Cross-account sharing (empty for testing)
security_account_id = ""

# Alert endpoints (empty for testing - no actual notifications)
critical_email_endpoints = []
warning_email_endpoints  = []
info_email_endpoints     = []
critical_sms_endpoints   = []

# Synthetic monitoring endpoint
api_endpoint_url      = "https://httpbin.org/status/200"
canary_check_interval = 5

# Alarm thresholds
cpu_alarm_threshold    = 80
memory_alarm_threshold = 80

# Feature flags
enable_container_insights     = false
enable_xray                   = false
enable_eventbridge_enrichment = false
