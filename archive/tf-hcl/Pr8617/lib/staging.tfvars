environment        = "staging"
environment_suffix = "stg01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.2.0.0/16"

# RDS Configuration
rds_instance_class   = "db.t3.small"
rds_backup_retention = 14

# ECS Configuration
ecs_task_cpu      = "512"
ecs_task_memory   = "1024"
ecs_desired_count = 2

# CloudWatch Configuration
cloudwatch_retention_days = 30

# Optional: Route53 zone
route53_zone_name = ""
