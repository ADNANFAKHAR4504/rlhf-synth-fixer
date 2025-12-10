environment    = "staging"
project_prefix = "tap"
aws_region     = "us-east-1"
vpc_cidr       = "10.1.0.0/16"

# Kinesis Configuration
kinesis_telemetry_shard_count = 4
kinesis_retention_hours       = 48

# Lambda Configuration
lambda_processor_memory      = 1024
lambda_processor_timeout     = 90
lambda_concurrent_executions = 50

# DynamoDB Configuration
dynamodb_vehicle_rcu     = 20
dynamodb_vehicle_wcu     = 20
dynamodb_diagnostics_rcu = 40
dynamodb_diagnostics_wcu = 40
dynamodb_inventory_rcu   = 20
dynamodb_inventory_wcu   = 20

# Redis Configuration
redis_node_type       = "cache.r7g.large"
redis_num_cache_nodes = 3

# Aurora Configuration
aurora_instance_class   = "db.r6g.large"
aurora_instance_count   = 2
aurora_backup_retention = 14

# Firehose Configuration
firehose_buffer_size     = 10
firehose_buffer_interval = 120

# Step Functions Configuration
step_functions_timeout_seconds = 7200