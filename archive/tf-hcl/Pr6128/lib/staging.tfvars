# Network Configuration
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = false

# RDS Configuration
rds_instance_class    = "db.t3.small"
rds_allocated_storage = 50
rds_backup_retention  = 14
rds_multi_az          = false

# ECS Configuration
ecs_task_count  = 2
ecs_task_cpu    = "512"
ecs_task_memory = "1024"

# S3 Configuration
s3_transition_days = 60
s3_glacier_days    = 180
s3_expiration_days = 730
