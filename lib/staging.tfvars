# Region Configuration
aws_region         = "ap-southeast-1"
environment_suffix = "staging"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24", "10.2.30.0/24"]
enable_nat_gateway   = true

# ECS Configuration
ecs_task_cpu      = "512"
ecs_task_memory   = "1024"
ecs_desired_count = 1

# Aurora Configuration (Independent staging cluster - not part of global)
aurora_instance_class    = "db.t3.medium"
aurora_engine_version    = "8.0.mysql_aurora.3.04.0"
aurora_cluster_size      = 1
is_primary_region        = true # Independent staging cluster
aurora_global_cluster_id = ""

# S3 Configuration
s3_enable_replication       = false
s3_replication_destinations = []

# Tagging
repository    = "iac-test-automations"
commit_author = "automation"
pr_number     = "main"
team          = "platform"
