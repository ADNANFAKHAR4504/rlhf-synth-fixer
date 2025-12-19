# Production environment configuration
environment_suffix        = "prod"
vpc_cidr                  = "10.3.0.0/16"
ecs_task_count            = 3
rds_instance_class        = "db.t3.medium"
alb_health_check_interval = 30
s3_lifecycle_days         = 90
