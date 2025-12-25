# Terraform variables for LocalStack deployment
aws_region         = "us-east-1"
environment        = "dev"
project_name       = "tap-stack"
environment_suffix = "dev"
vpc_cidr           = "10.0.0.0/16"
instance_type      = "t3.micro"
min_size           = 1
max_size           = 3
desired_capacity   = 2
db_instance_class  = "db.t3.micro"
db_name            = "tapdb"
db_username        = "admin"

# Disable Pro features for LocalStack Community edition
enable_pro_features = false
