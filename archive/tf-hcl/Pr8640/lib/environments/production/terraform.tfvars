environment_suffix = "prd001"

vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24"]

enable_nat_gateway = true

container_image = "nginx:latest"
container_port  = 80

task_cpu    = "512"
task_memory = "1024"

desired_count = 3
min_capacity  = 2
max_capacity  = 10

health_check_path         = "/"
enable_container_insights = true
