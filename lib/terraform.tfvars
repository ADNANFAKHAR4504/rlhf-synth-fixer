# terraform.tfvars
# Example variables for the secure infrastructure module

project_name = "secure-infra"
environment  = "staging"
region       = "us-east-1"

allowed_cidr_blocks = ["10.0.0.0/8"]

db_username = "dbadmin"
db_password = "your-secure-password"

instance_type = "t3.micro"

notification_email = "your-email@example.com"
