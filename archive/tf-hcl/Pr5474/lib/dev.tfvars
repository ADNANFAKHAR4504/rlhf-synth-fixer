env          = "dev"
aws_region   = "us-east-1"
project_name = "tap-pipeline"
owner        = "data-platform-team"
cost_center  = "engineering"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
enable_nat           = true
single_nat_gateway   = true # Cost optimization for dev

# DynamoDB Configuration
ddb_billing_mode = "PAY_PER_REQUEST"

# Lambda Configuration
lambda_memory_mb               = 256
lambda_timeout_s               = 60
lambda_provisioned_concurrency = 0

# Kinesis Configuration
kinesis_mode = "ON_DEMAND"

# ElastiCache Configuration
redis_node_type    = "cache.t3.micro"
redis_num_replicas = 1
redis_multi_az     = false

# Aurora Configuration
aurora_min_capacity = 0.5
aurora_max_capacity = 1

# Neptune Configuration
neptune_instance_class = "db.t3.medium"
enable_neptune         = true

# Event Configuration
consistency_check_rate = "rate(10 minutes)"
sfn_tracing_enabled    = false

# Operations Configuration
log_retention_days = 7
alarm_email        = ""

# Tags
common_tags = {
  Team      = "DataEngineering"
  Terraform = "true"
}
