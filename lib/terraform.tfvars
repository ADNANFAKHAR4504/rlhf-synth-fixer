environment_suffix = "synth101912554v6"
region             = "ap-southeast-1"

# Database credentials (using environment variables TF_VAR_db_username and TF_VAR_db_password)
db_name = "financialdb"

# Container configuration
container_image = "nginx:latest"
container_port  = 80

# ECS configuration
desired_task_count = 2
min_task_count     = 3
max_task_count     = 4
cpu                = "256"
memory             = "512"

# VPC configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# Tags
cost_center = "FinancialServices"
environment = "dev"
compliance  = "PCI-DSS"

# Domain
domain_name = "financial-portal-synth101912554.example.com"

# WAF geo-restrictions
geo_restriction_locations = ["KP", "IR", "SY", "CU"]
