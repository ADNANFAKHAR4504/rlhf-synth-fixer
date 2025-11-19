# Development environment configuration
environment        = "dev"
aws_region         = "us-east-1"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Minimal capacity for development
kinesis_shard_count                   = 1
kinesis_retention_hours               = 24
dynamodb_read_capacity                = 5
dynamodb_write_capacity               = 5
lambda_memory_size                    = 512
lambda_timeout                        = 60
lambda_reserved_concurrent_executions = 5

sqs_visibility_timeout = 300
sqs_message_retention  = 345600 # 4 days
sqs_max_receive_count  = 3

aurora_min_capacity   = 0.5
aurora_max_capacity   = 1
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

eventbridge_schedule = "rate(1 hour)"
log_retention_days   = 7
hospital_regions     = ["east", "west"]

owner       = "Development Team"
cost_center = "DEV-001"