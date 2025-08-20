# terraform.tfvars.example
# Example variable values for the secure infrastructure

project_name = "secure-infra"
environment  = "staging"
region       = "us-east-1"

vpc_cidr = "10.0.0.0/16"

allowed_cidr_blocks = ["1.2.3.4/32"]

db_username = "dbadmin"
db_password = "your-secure-password"

instance_type = "t3.medium"
key_pair_name = "your-key-pair-name"

notification_email = "your-email@example.com"
