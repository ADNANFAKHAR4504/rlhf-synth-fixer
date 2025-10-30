env          = "staging"
aws_region   = "us-east-1"
project_name = "tap-pipeline"
owner        = "data-platform-team"
cost_center  = "engineering"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
enable_nat           = true
single_nat_gateway   = false # Multi-AZ NAT for staging

# DynamoDB Configuration
ddb_billing_mode = "PROVISIONED"
ddb_rcu          = 25
ddb_wcu          = 25

# Lambda Configuration
lambda_memory_mb               = 512
lambda_timeout_s               = 120
lambda_provisioned_concurrency = 2

# Kinesis Configuration
kinesis_mode        = "PROVISIONED"
kinesis_shard_count = 4

# ElastiCache Configuration
redis_node_type    = "cache.t3.small"
redis_num_replicas = 2
redis_multi_az     = true

# Aurora Configuration
aurora_min_capacity = 1
aurora_max_capacity = 4

# Neptune Configuration
neptune_instance_class = "db.r5.large"
enable_neptune         = true

# Event Configuration
consistency_check_rate = "rate(5 minutes)"
sfn_tracing_enabled    = true

# Operations Configuration
log_retention_days = 14
alarm_email        = "staging-alerts@example.com"

# Tags
common_tags = {
  Team      = "DataEngineering"
  Terraform = "true"
}
