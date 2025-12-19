# Region Configuration
aws_region         = "eu-west-1"
environment_suffix = "prod"
availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# Aurora Configuration (Secondary Region)
aurora_instance_class    = "db.r5.large"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 2
is_primary_region        = false
aurora_global_cluster_id = "global-cluster-tap-prod" # Set this after primary region is created

# S3 Configuration
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
