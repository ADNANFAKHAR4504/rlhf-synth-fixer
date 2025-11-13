# Production environment configuration
environment        = "prod"
aws_region         = "us-east-1"
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# High capacity for production
kinesis_shard_count                   = 10
kinesis_retention_hours               = 168 # 7 days
dynamodb_read_capacity                = 100
dynamodb_write_capacity               = 100
lambda_memory_size                    = 3008
lambda_timeout                        = 120
lambda_reserved_concurrent_executions = 100

sqs_visibility_timeout = 600
sqs_message_retention  = 1209600 # 14 days
sqs_max_receive_count  = 10

aurora_min_capacity   = 2
aurora_max_capacity   = 16
redis_node_type       = "cache.r6g.xlarge"
redis_num_cache_nodes = 3

eventbridge_schedule = "rate(10 minutes)"
log_retention_days   = 90
hospital_regions     = ["east", "west", "central", "north", "south"]

owner       = "Healthcare IT Operations"
cost_center = "PROD-001"