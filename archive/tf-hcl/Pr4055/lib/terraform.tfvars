# Update these values according to your requirements
aws_region   = "eu-north-1"
project_name = "secure-webapp-hipaa-prd"
environment  = "production"

# Replace with your allowed IP addresses
allowed_ips = [
  "0.0.0.0/0"
]

# Database credentials (use AWS Secrets Manager in production)
db_password = "YourSecurePasswordHere!"

# Instance configuration
instance_type = "t3.medium"
min_instances = 2
max_instances = 6

