# Default values (can be overridden by workspace-specific tfvars)
aws_region                = "ap-southeast-1"
project_name              = "payment-platform"
environment_suffix        = "default"
vpc_cidr                  = "10.1.0.0/16"
ecs_task_count            = 1
rds_instance_class        = "db.t3.micro"
alb_health_check_interval = 30
s3_lifecycle_days         = 90
