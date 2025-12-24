environment_suffix = "synth101912358"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

enable_nat_gateway = false

container_image = "nginx:latest"
container_port  = 80

task_cpu    = "256"
task_memory = "512"

desired_count = 1
min_capacity  = 1
max_capacity  = 2

health_check_path         = "/"
enable_container_insights = true
