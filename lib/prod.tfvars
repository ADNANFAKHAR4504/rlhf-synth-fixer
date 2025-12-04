env          = "prod"
aws_region   = "us-east-1"
project_name = "tap"
owner        = "platform-team"
cost_center  = "production-operations"
user_pool_id = "us-east-1_ABC123PRD"
pr_number    = "pr7901"

# Production capacity
request_handler_memory = 1024
scheduler_memory       = 1024
notifier_memory        = 512
billing_memory         = 512
session_memory         = 512
prescription_memory    = 1024
approval_memory        = 1024
pharmacy_memory        = 512
compliance_memory      = 1024
reminder_memory        = 512
analytics_memory       = 1024
document_memory        = 1024
node_type              = "cache.r6g.large"
instance_class         = "db.r6g.large"
min_capacity           = 2
max_capacity           = 8
backup_retention_days  = 30
deletion_protection    = true
log_retention_days     = 90

# Production schedules
compliance_schedule_expression = "cron(0 2 * * ? *)" # 2 AM daily
reminders_schedule_expression  = "rate(30 minutes)"

# Production subnet configuration
vpc_cidr             = "10.100.0.0/16"
public_subnet_cidrs  = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
private_subnet_cidrs = ["10.100.11.0/24", "10.100.12.0/24", "10.100.13.0/24"]

common_tags = {
  Team        = "Platform"
  Environment = "Production"
  Compliance  = "HIPAA"
  DataClass   = "PHI"
  CostCenter  = "PROD-001"
}