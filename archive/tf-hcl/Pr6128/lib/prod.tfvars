# Network Configuration
vpc_cidr             = "10.2.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
public_subnet_cidrs  = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = false

# RDS Configuration
rds_instance_class    = "db.t3.medium"
rds_allocated_storage = 100
rds_backup_retention  = 30
rds_multi_az          = true

# ECS Configuration
ecs_task_count  = 4
ecs_task_cpu    = "1024"
ecs_task_memory = "2048"

# S3 Configuration
s3_transition_days = 90
s3_glacier_days    = 365
s3_expiration_days = 2555 # 7 years for compliance
