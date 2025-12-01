env          = "staging"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Moderate capacity for staging environment
throttle_rate_limit     = 500
throttle_burst_limit    = 1000
shard_count             = 2
rcu                     = 10
wcu                     = 10
event_processor_memory  = 512
recommendations_memory  = 1024
node_type               = "cache.t3.small"
num_cache_clusters      = 2
instance_class          = "db.t4g.medium"
min_capacity            = 1
max_capacity            = 2
backup_retention_days   = 3
log_retention_days      = 14
alarm_latency_threshold = 1500
