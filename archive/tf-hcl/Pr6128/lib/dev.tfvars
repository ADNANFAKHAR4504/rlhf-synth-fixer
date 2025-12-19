# Network Configuration
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = true

# RDS Configuration
rds_instance_class    = "db.t3.micro"
rds_allocated_storage = 20
rds_backup_retention  = 7
rds_multi_az          = false

# ECS Configuration
ecs_task_count  = 1
ecs_task_cpu    = "256"
ecs_task_memory = "512"

# S3 Configuration
s3_transition_days = 30
s3_glacier_days    = 90
s3_expiration_days = 365
