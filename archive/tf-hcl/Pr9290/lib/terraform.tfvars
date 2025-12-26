# Terraform variables for LocalStack deployment
project_name       = "web-app"
environment        = "dev"
aws_region         = "us-east-1"
environment_suffix = "synthtrainr896"
vpc_cidr           = "10.0.0.0/16"

# LocalStack endpoint URL - enables LocalStack-specific conditional behavior
aws_endpoint_url = "http://localhost:4566"

# RDS settings
db_instance_class = "db.t3.micro"
db_name           = "webapp_db"
db_username       = "admin"

# Elastic Beanstalk settings (not used in LocalStack Community)
eb_solution_stack = "64bit Amazon Linux 2023 v4.7.0 running Python 3.11"
