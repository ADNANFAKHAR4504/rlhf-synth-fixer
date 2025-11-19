environment_suffix = "synth101912382"
aws_region         = "us-east-1"
project_name       = "trading-dashboard"
environment        = "dev"
owner              = "iac-qa-team"

vpc_cidr                 = "10.0.0.0/16"
availability_zones_count = 2

container_image = "nginx:latest"
container_port  = 80

ecs_task_cpu    = "256"
ecs_task_memory = "512"

ecs_desired_count = 1
ecs_min_capacity  = 1
ecs_max_capacity  = 2

db_master_username = "dbadmin"
db_instance_class  = "db.t3.medium"
db_name            = "tradingdb"

blue_weight  = 100
green_weight = 0
