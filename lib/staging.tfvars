# Staging Environment Configuration
env          = "staging"
aws_region   = "us-east-1"
project_name = "tap-delivery"
pr_number    = "pr7881"

# Moderate capacity for staging
orders_shard_count             = 5
locations_shard_count          = 3
rcu                            = 50
wcu                            = 50
reserved_concurrent_executions = 50

# Medium instance sizes
node_type          = "cache.t3.small"
num_cache_clusters = 2
instance_class     = "db.t4g.medium"
min_capacity       = 0.5
max_capacity       = 2

# Standard retention periods
log_retention_days        = 14
backup_retention_days     = 3
message_retention_seconds = 86400 # 24 hours

# Moderate thresholds
throttle_burst_limit   = 3000
throttle_rate_limit    = 5000
alarm_p99_threshold_ms = 2000

# Staging schedule (runs twice daily)
earnings_schedule_expression = "cron(0 2,14 * * ? *)"