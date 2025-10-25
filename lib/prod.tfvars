# Production Environment Configuration
# Task: stf-5035 - Player State Multiplayer Pipeline

aws_region = "us-east-1"

# Production settings
project_name = "player-consistency"
environment  = "prod"
owner        = "platform-team"
cost_center  = "gaming-core"

# Kinesis configuration
use_kinesis_on_demand = true
use_shards            = false
updates_per_second    = 2550
avg_item_size_bytes   = 1024

# Replication and consumers
replica_regions          = []
consumer_groups          = ["graph-updater"]
verification_sample_size = 100

