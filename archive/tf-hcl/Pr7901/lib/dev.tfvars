env          = "dev"
aws_region   = "us-east-1"
project_name = "tap"
owner        = "dev-team"
cost_center  = "engineering"
user_pool_id = "us-east-1_ABC123DEV"
pr_number    = "pr7901"

# Reduced capacity for dev
request_handler_memory = 256
scheduler_memory       = 256
node_type              = "cache.t3.micro"
instance_class         = "db.t3.medium"
min_capacity           = 0.5
max_capacity           = 1
backup_retention_days  = 1
deletion_protection    = false
log_retention_days     = 7

# Less frequent schedules in dev
compliance_schedule_expression = "cron(0 4 * * ? *)" # 4 AM daily
reminders_schedule_expression  = "rate(2 hours)"

common_tags = {
  Team        = "Platform"
  Environment = "Development"
  Compliance  = "HIPAA-Test"
}