# Development Environment Configuration
env          = "dev"
aws_region   = "us-east-1"
project_name = "tap-delivery"
pr_number    = "pr7881"

# Reduced capacity for development
orders_shard_count             = 2
locations_shard_count          = 1
rcu                            = 20
wcu                            = 20
reserved_concurrent_executions = 10

# Smaller instance sizes
node_type          = "cache.t3.micro"
num_cache_clusters = 1
instance_class     = "db.t4g.small"
min_capacity       = 0.5
max_capacity       = 1

# Shorter retention periods
log_retention_days        = 7
backup_retention_days     = 1
message_retention_seconds = 43200 # 12 hours

# Lower thresholds
throttle_burst_limit   = 1000
throttle_rate_limit    = 2000
alarm_p99_threshold_ms = 3000

# Development schedule (runs every 6 hours for testing)
earnings_schedule_expression = "cron(0 */6 * * ? *)"