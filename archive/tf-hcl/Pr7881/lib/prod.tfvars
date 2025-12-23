# Production Environment Configuration
env          = "prod"
aws_region   = "us-east-1"
project_name = "tap-delivery"
pr_number    = "pr7881"

# Full production capacity
orders_shard_count             = 10
locations_shard_count          = 5
rcu                            = 100
wcu                            = 100
reserved_concurrent_executions = 100

# Production instance sizes
node_type          = "cache.r7g.xlarge"
num_cache_clusters = 3
instance_class     = "db.r6g.2xlarge"
min_capacity       = 1
max_capacity       = 4

# Extended retention periods
log_retention_days        = 30
backup_retention_days     = 7
message_retention_seconds = 345600 # 4 days

# Production thresholds
throttle_burst_limit   = 5000
throttle_rate_limit    = 10000
alarm_p99_threshold_ms = 1000

# Production schedule (runs nightly at 2 AM)
earnings_schedule_expression = "cron(0 2 * * ? *)"

# Production-specific tags
common_tags = {
  Compliance = "SOC2"
  DataClass  = "Confidential"
  Backup     = "Required"
}