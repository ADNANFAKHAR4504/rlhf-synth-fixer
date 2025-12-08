env          = "prod"
aws_region   = "us-east-1"
project_name = "tap-stream"
owner        = "platform-team"
cost_center  = "engineering"
pr_number    = "pr7612"

# Full capacity for production environment
throttle_rate_limit     = 1000
throttle_burst_limit    = 2000
shard_count             = 4
rcu                     = 20
wcu                     = 20
event_processor_memory  = 1024
recommendations_memory  = 2048
node_type               = "cache.r7g.large"
num_cache_clusters      = 3
instance_class          = "db.r6g.xlarge"
min_capacity            = 2
max_capacity            = 8
backup_retention_days   = 30
log_retention_days      = 90
alarm_latency_threshold = 1000

# Production-specific settings
common_tags = {
  Compliance = "SOC2"
  DataClass  = "Sensitive"
}
