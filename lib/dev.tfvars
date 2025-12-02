# dev.tfvars - Development environment
aws_region         = "eu-west-1"
environment        = "dev"
environment_suffix = "devtest257"
cost_center        = "engineering-dev"
vpc_cidr           = "10.1.0.0/16"
task_cpu           = 256
task_memory        = 512
desired_count      = 1
db_instance_class  = "db.t4g.medium"
db_instance_count  = 1
log_retention_days = 3
container_image    = "nginx:latest"
database_name      = "devdb"
db_master_username = "devadmin"
