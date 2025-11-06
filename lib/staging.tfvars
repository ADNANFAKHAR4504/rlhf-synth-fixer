# Staging environment configuration
environment_suffix        = "staging"
vpc_cidr                  = "10.2.0.0/16"
ecs_task_count            = 2
rds_instance_class        = "db.t3.small"
alb_health_check_interval = 45
s3_lifecycle_days         = 60
