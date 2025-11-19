environment_suffix = "stg001"

vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]

enable_nat_gateway = true

container_image = "nginx:latest"
container_port  = 80

task_cpu    = "256"
task_memory = "512"

desired_count = 2
min_capacity  = 1
max_capacity  = 4

health_check_path         = "/"
enable_container_insights = true
