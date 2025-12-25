# Terraform variables for LocalStack deployment

aws_region         = "us-east-1"
project            = "iac-nova-model-breaking"
environment        = "dev"
environment_suffix = "ls"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

instance_type        = "t3.micro"
asg_min_size         = 2
asg_desired_capacity = 2
asg_max_size         = 4

db_instance_class  = "db.t4g.micro"
db_name            = "appdb"
db_username        = "appuser"
log_retention_days = 30

# LocalStack compatibility - these features are not supported in free tier
enable_alb         = false
enable_rds         = false
enable_asg         = false
enable_nat_gateway = false
