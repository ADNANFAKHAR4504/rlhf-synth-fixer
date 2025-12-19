# prod-use1.tfvars
# Production environment in US East 1
# Workspace: prod-use1

# Region Configuration
aws_region         = "us-east-1"
environment_suffix = "prod"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# Aurora Configuration (Primary Region)
aurora_instance_class    = "db.r5.large"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 2
is_primary_region        = true
aurora_global_cluster_id = ""

# S3 Configuration - Disable replication initially until destination buckets exist
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
