# Staging environment configuration
environment        = "staging"
aws_region         = "us-east-1"
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Moderate capacity for staging
kinesis_shard_count                   = 2
kinesis_retention_hours               = 48
dynamodb_read_capacity                = 10
dynamodb_write_capacity               = 10
lambda_memory_size                    = 1024
lambda_timeout                        = 90
lambda_reserved_concurrent_executions = 10

sqs_visibility_timeout = 300
sqs_message_retention  = 604800 # 7 days
sqs_max_receive_count  = 5

aurora_min_capacity   = 1
aurora_max_capacity   = 4
redis_node_type       = "cache.t3.small"
redis_num_cache_nodes = 2

eventbridge_schedule = "rate(30 minutes)"
log_retention_days   = 14
hospital_regions     = ["east", "west", "central"]

owner       = "QA Team"
cost_center = "QA-001"