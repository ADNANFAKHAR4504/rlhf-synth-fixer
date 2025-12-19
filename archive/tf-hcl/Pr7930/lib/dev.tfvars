environment    = "dev"
project_prefix = "tap"
aws_region     = "us-east-1"
vpc_cidr       = "10.0.0.0/16"

# Kinesis Configuration
kinesis_telemetry_shard_count = 2
kinesis_retention_hours       = 24

# Lambda Configuration  
lambda_processor_memory      = 512
lambda_processor_timeout     = 60
lambda_concurrent_executions = 10

# DynamoDB Configuration
dynamodb_vehicle_rcu     = 5
dynamodb_vehicle_wcu     = 5
dynamodb_diagnostics_rcu = 10
dynamodb_diagnostics_wcu = 10
dynamodb_inventory_rcu   = 5
dynamodb_inventory_wcu   = 5

# Redis Configuration
redis_node_type       = "cache.t4g.small"
redis_num_cache_nodes = 2

# Aurora Configuration
aurora_instance_class   = "db.t4g.medium"
aurora_instance_count   = 1
aurora_backup_retention = 7

# Firehose Configuration
firehose_buffer_size     = 5
firehose_buffer_interval = 300

# Step Functions Configuration
step_functions_timeout_seconds = 3600