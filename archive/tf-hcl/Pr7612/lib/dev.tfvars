env          = "dev"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Reduced capacity for dev environment
throttle_rate_limit     = 100
throttle_burst_limit    = 200
shard_count             = 1
rcu                     = 5
wcu                     = 5
event_processor_memory  = 256
recommendations_memory  = 512
node_type               = "cache.t3.micro"
num_cache_clusters      = 1
instance_class          = "db.t4g.small"
min_capacity            = 0.5
max_capacity            = 1
backup_retention_days   = 1
log_retention_days      = 7
alarm_latency_threshold = 2000
