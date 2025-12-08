env          = "staging"
aws_region   = "us-east-1"
project_name = "tap"
owner        = "qa-team"
cost_center  = "quality-assurance"
user_pool_id = "us-east-1_ABC123STG"
pr_number    = "pr7901"

# Moderate capacity for staging
request_handler_memory = 512
scheduler_memory       = 512
node_type              = "cache.t3.small"
instance_class         = "db.t3.medium"
min_capacity           = 1
max_capacity           = 2
backup_retention_days  = 3
deletion_protection    = false
log_retention_days     = 14

# Standard schedules in staging
compliance_schedule_expression = "cron(0 3 * * ? *)" # 3 AM daily
reminders_schedule_expression  = "rate(1 hour)"

common_tags = {
  Team        = "QA"
  Environment = "Staging"
  Compliance  = "HIPAA-Staging"
}