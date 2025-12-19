environment    = "prod"
project_prefix = "tap"
aws_region     = "us-east-1"
vpc_cidr       = "10.2.0.0/16"

# Kinesis Configuration
kinesis_telemetry_shard_count = 10
kinesis_retention_hours       = 168

# Lambda Configuration
lambda_processor_memory      = 3008
lambda_processor_timeout     = 120
lambda_concurrent_executions = 200

# DynamoDB Configuration
dynamodb_vehicle_rcu     = 100
dynamodb_vehicle_wcu     = 100
dynamodb_diagnostics_rcu = 200
dynamodb_diagnostics_wcu = 200
dynamodb_inventory_rcu   = 100
dynamodb_inventory_wcu   = 100

# Redis Configuration
redis_node_type       = "cache.r7g.xlarge"
redis_num_cache_nodes = 5

# Aurora Configuration
aurora_instance_class   = "db.r6g.2xlarge"
aurora_instance_count   = 3
aurora_backup_retention = 30

# Firehose Configuration
firehose_buffer_size     = 128
firehose_buffer_interval = 60

# Step Functions Configuration
step_functions_timeout_seconds = 14400