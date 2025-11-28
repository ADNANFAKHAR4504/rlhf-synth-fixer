aws_region      = "us-east-1"
project_name    = "payment"
pr_number       = "pr7072prod"
vpc_cidr_base   = "10.0"
container_image = "nginx:latest" # Replace with actual payment app image

# Database credentials
db_username = "dbadmin"
# db_password is auto-generated and stored in AWS Secrets Manager

# Optional: ACM certificate for HTTPS
alb_certificate_arn = "" # Add your production certificate ARN
