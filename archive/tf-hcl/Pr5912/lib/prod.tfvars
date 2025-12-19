environment        = "prod"
environment_suffix = "prod01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.3.0.0/16"

# RDS Configuration
rds_instance_class   = "db.t3.medium"
rds_backup_retention = 30

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 3

# CloudWatch Configuration
cloudwatch_retention_days = 90

# Optional: Route53 zone
route53_zone_name = ""
