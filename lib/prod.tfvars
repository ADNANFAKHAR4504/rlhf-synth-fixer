env          = "prod"
aws_region   = "us-east-1"
project_name = "tap-pipeline"
owner        = "data-platform-team"
cost_center  = "engineering"

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]
enable_nat           = true
single_nat_gateway   = false # Multi-AZ NAT for production

# DynamoDB Configuration
ddb_billing_mode = "PROVISIONED"
ddb_rcu          = 100
ddb_wcu          = 100

# Lambda Configuration
lambda_memory_mb               = 1024
lambda_timeout_s               = 300
lambda_provisioned_concurrency = 10

# Kinesis Configuration
kinesis_mode        = "PROVISIONED"
kinesis_shard_count = 10

# ElastiCache Configuration
redis_node_type    = "cache.r6g.large"
redis_num_replicas = 3
redis_multi_az     = true

# Aurora Configuration
aurora_min_capacity = 2
aurora_max_capacity = 16

# Neptune Configuration
neptune_instance_class = "db.r5.xlarge"
enable_neptune         = true

# Event Configuration
consistency_check_rate = "rate(1 minute)"
sfn_tracing_enabled    = true

# Operations Configuration
log_retention_days = 30
alarm_email        = "prod-alerts@example.com"

# Tags
common_tags = {
  Team       = "DataEngineering"
  Terraform  = "true"
  Compliance = "SOC2"
}
