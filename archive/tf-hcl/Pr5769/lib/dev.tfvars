environment        = "dev"
environment_suffix = "dev01"
aws_region         = "us-east-1"
project_name       = "multi-env-saas"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"

# RDS Configuration
rds_instance_class   = "db.t3.micro"
rds_backup_retention = 7

# ECS Configuration
ecs_task_cpu      = "256"
ecs_task_memory   = "512"
ecs_desired_count = 1

# CloudWatch Configuration
cloudwatch_retention_days = 7

# Optional: Route53 zone
route53_zone_name = ""
